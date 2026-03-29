import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportResponseDto } from './dto/report-response.dto';
import { UpsertPdfSettingDto, PdfSettingResponseDto } from './dto/pdf-setting.dto';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelations = {
    user: {
      include: {
        profile: true,
        teamMemberships: { include: { team: { include: { division: true } } }, take: 1 },
      },
    },
    approvedBy: { include: { profile: true } },
    rejectedBy: { include: { profile: true } },
    photos: {
      include: { file: true },
      orderBy: { order: 'asc' as const },
    },
    lokasi: {
      include: { workLocation: true },
    },
  };

  private async getAttendancePhotos(
    userId: string,
    reportDate: Date,
    baseUrl: string,
  ) {
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        userId,
        createdAt: { gte: startOfDay, lte: endOfDay },
        type: { in: ['CHECK_IN', 'CHECK_OUT'] },
      },
      include: { selfieFile: true },
      orderBy: { createdAt: 'asc' },
    });

    const checkIn = attendances.find((a) => a.type === 'CHECK_IN');
    const checkOut = attendances.find((a) => a.type === 'CHECK_OUT');

    const mapAttendance = (a: any) =>
      a
        ? {
            fileId: a.selfieFileId,
            url: a.selfieFile?.url || '',
            secureUrl: a.selfieFile?.url
              ? `${baseUrl}${a.selfieFile.url}`
              : '',
            createdAt: a.createdAt,
          }
        : undefined;

    return {
      checkIn: mapAttendance(checkIn),
      checkOut: mapAttendance(checkOut),
    };
  }

  private mapToResponse(report: any, baseUrl: string, attendancePhotos?: any): ReportResponseDto {
    return {
      id: report.id,
      userId: report.userId,
      userName: report.user?.profile?.fullName || report.user?.email,
      divisionName: report.user?.teamMemberships?.[0]?.team?.division?.name || undefined,
      title: report.title,
      content: report.content,
      status: report.status,
      reportDate: report.reportDate.toISOString().split('T')[0],
      photos: (report.photos || []).map((p: any) => ({
        id: p.id,
        fileId: p.fileId,
        order: p.order,
        url: p.file?.url || '',
        secureUrl: p.file?.url ? `${baseUrl}${p.file.url}` : '',
        label: p.label || null,
      })),
      weekNumber: report.weekNumber,
      deskripsiKegiatan: report.deskripsiKegiatan,
      kondisiCuaca: report.kondisiCuaca,
      waktuMulai: report.waktuMulai,
      waktuSelesai: report.waktuSelesai,
      formatLaporan: report.formatLaporan,
      peralatanCangkul: report.peralatanCangkul,
      peralatanParang: report.peralatanParang,
      peralatanPes: report.peralatanPes,
      peralatanLori: report.peralatanLori,
      peralatanCatut: report.peralatanCatut,
      peralatanPalu: report.peralatanPalu,
      peralatanGarpu: report.peralatanGarpu,
      tenagaPengawas: report.tenagaPengawas,
      tenagaPekerja: report.tenagaPekerja,
      tenagaKorlap: report.tenagaKorlap,
      lokasi: (report.lokasi || []).map((l: any) => ({
        id: l.id,
        workLocationId: l.workLocationId,
        workLocationName: l.workLocation?.name || l.name || '',
        workLocationAddress: l.workLocation?.address || l.alamatLengkap || '',
        name: l.name,
        alamatLengkap: l.alamatLengkap,
        kegiatan: l.kegiatan,
        panjang: l.panjang,
        lebar: l.lebar,
        lebarAtas: l.lebarAtas,
        lebarBawah: l.lebarBawah,
        kedalaman: l.kedalaman,
        sedimen: l.sedimen,
      })),
      approvedById: report.approvedById || undefined,
      approvedByName: report.approvedBy?.profile?.fullName || report.approvedBy?.email || undefined,
      approvedAt: report.approvedAt || undefined,
      rejectedById: report.rejectedById || undefined,
      rejectedByName: report.rejectedBy?.profile?.fullName || report.rejectedBy?.email || undefined,
      rejectedAt: report.rejectedAt || undefined,
      rejectionNote: report.rejectionNote || undefined,
      attendancePhotos: attendancePhotos || undefined,
      signatory1Name: report.signatory1Name,
      signatory1Title: report.signatory1Title,
      signatory2Name: report.signatory2Name,
      signatory2Title: report.signatory2Title,
      signatory3Name: report.signatory3Name,
      signatory3Title: report.signatory3Title,
      signatory4Name: report.signatory4Name,
      signatory4Title: report.signatory4Title,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }

  private getTodayDate(): Date {
    const now = new Date();
    // Set to start of day (UTC+7 WIB)
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    wib.setUTCHours(0, 0, 0, 0);
    return wib;
  }

  async create(dto: CreateReportDto, userId: string, baseUrl: string): Promise<ReportResponseDto> {
    const { photoFileIds, photoLabels, lokasi, ...data } = dto;

    // Force reportDate to today — users cannot pick a different date
    const today = this.getTodayDate();
    data.reportDate = today.toISOString().split('T')[0];

    // Validate file IDs exist
    if (photoFileIds?.length) {
      const files = await this.prisma.file.findMany({
        where: { id: { in: photoFileIds } },
      });
      if (files.length !== photoFileIds.length) {
        throw new BadRequestException('Some photo file IDs are invalid');
      }
    }

    // Validate work location IDs (only if provided)
    if (lokasi?.length) {
      const wlIds = lokasi.map((l) => l.workLocationId).filter(Boolean) as string[];
      if (wlIds.length > 0) {
        const wls = await this.prisma.workLocation.findMany({
          where: { id: { in: wlIds } },
        });
        if (wls.length !== new Set(wlIds).size) {
          throw new BadRequestException('Some work location IDs are invalid');
        }
      }
    }

    const report = await this.prisma.report.create({
      data: {
        userId,
        title: data.title,
        content: data.content,
        status: data.status || 'draft',
        reportDate: new Date(data.reportDate),
        weekNumber: data.weekNumber,
        deskripsiKegiatan: data.deskripsiKegiatan,
        kondisiCuaca: data.kondisiCuaca,
        waktuMulai: data.waktuMulai,
        waktuSelesai: data.waktuSelesai,
        peralatanCangkul: data.peralatanCangkul ?? 0,
        peralatanParang: data.peralatanParang ?? 0,
        peralatanPes: data.peralatanPes ?? 0,
        peralatanLori: data.peralatanLori ?? 0,
        peralatanCatut: data.peralatanCatut ?? 0,
        peralatanPalu: data.peralatanPalu ?? 0,
        peralatanGarpu: data.peralatanGarpu ?? 0,
        tenagaPengawas: data.tenagaPengawas ?? 0,
        tenagaPekerja: data.tenagaPekerja ?? 0,
        tenagaKorlap: data.tenagaKorlap ?? 0,
        formatLaporan: data.formatLaporan,
        alatBeratNama: data.alatBeratNama,
        alatBeratBahanBakar: data.alatBeratBahanBakar,
        signatory1Name: data.signatory1Name,
        signatory1Title: data.signatory1Title,
        signatory2Name: data.signatory2Name,
        signatory2Title: data.signatory2Title,
        signatory3Name: data.signatory3Name,
        signatory3Title: data.signatory3Title,
        signatory4Name: data.signatory4Name,
        signatory4Title: data.signatory4Title,
        photos: photoFileIds?.length
          ? {
              create: photoFileIds.map((fileId, index) => ({
                fileId,
                order: index + 1,
                label: photoLabels?.[index] || null,
              })),
            }
          : undefined,
        lokasi: lokasi?.length
          ? {
              create: lokasi.map((l) => ({
                workLocationId: l.workLocationId || null,
                name: l.name,
                alamatLengkap: l.alamatLengkap,
                kegiatan: l.kegiatan,
                panjang: l.panjang,
                lebar: l.lebar,
                lebarAtas: l.lebarAtas,
                lebarBawah: l.lebarBawah,
                kedalaman: l.kedalaman,
                sedimen: l.sedimen,
              })),
            }
          : undefined,
      },
      include: this.includeRelations,
    });

    const attPhotos = await this.getAttendancePhotos(userId, report.reportDate, baseUrl);
    return this.mapToResponse(report, baseUrl, attPhotos);
  }

  private buildReportWhere(query: ReportQueryDto, extra: Record<string, any> = {}) {
    const andConditions: any[] = [];

    if (query.date) {
      const start = new Date(`${query.date}T00:00:00.000Z`);
      const end = new Date(`${query.date}T23:59:59.999Z`);
      andConditions.push({ reportDate: { gte: start, lte: end } });
    }

    if (query.status) {
      andConditions.push({ status: query.status });
    }

    if (query.divisionId) {
      andConditions.push({
        user: {
          OR: [
            { teamMemberships: { some: { team: { divisionId: query.divisionId } } } },
            { ledTeams: { some: { divisionId: query.divisionId } } },
          ],
        },
      });
    }

    if (query.formatLaporan) {
      andConditions.push({ formatLaporan: query.formatLaporan });
    }

    return {
      ...extra,
      ...(andConditions.length ? { AND: andConditions } : {}),
    };
  }

  async findAll(
    query: ReportQueryDto,
    baseUrl: string,
  ): Promise<{ data: ReportResponseDto[]; meta: PageMetaDto }> {
    const where = this.buildReportWhere(query);
    const orderBy = query.sortBy
      ? { [query.sortBy]: query.order }
      : { createdAt: query.order };

    const [reports, totalData] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: this.includeRelations,
        orderBy,
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    const data = reports.map((r) => this.mapToResponse(r, baseUrl));
    const meta = new PageMetaDto({
      page: query.page,
      limit: query.limit,
      totalData,
    });

    return { data, meta };
  }

  async findMine(
    userId: string,
    query: ReportQueryDto,
    baseUrl: string,
  ): Promise<{ data: ReportResponseDto[]; meta: PageMetaDto }> {
    const where = this.buildReportWhere(query, { userId });
    const orderBy = query.sortBy
      ? { [query.sortBy]: query.order }
      : { createdAt: query.order };

    const [reports, totalData] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: this.includeRelations,
        orderBy,
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    const data = reports.map((r) => this.mapToResponse(r, baseUrl));
    const meta = new PageMetaDto({
      page: query.page,
      limit: query.limit,
      totalData,
    });

    return { data, meta };
  }

  async findOne(id: string, baseUrl: string): Promise<ReportResponseDto> {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: this.includeRelations,
    });
    if (!report) throw new NotFoundException('Report not found');
    const attPhotos = await this.getAttendancePhotos(report.userId, report.reportDate, baseUrl);
    return this.mapToResponse(report, baseUrl, attPhotos);
  }

  async update(
    id: string,
    dto: UpdateReportDto,
    userId: string,
    userRole: string,
    baseUrl: string,
  ): Promise<ReportResponseDto> {
    const existing = await this.prisma.report.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Report not found');

    // Only owner or admin can update
    if (existing.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own reports');
    }

    // Only draft/rejected can be updated (unless admin)
    // if (!['draft', 'rejected'].includes(existing.status) && userRole !== 'ADMIN') {
    //   throw new ForbiddenException('Hanya laporan draft atau yang ditolak yang bisa diedit');
    // }

    // Deadline: only today's reports can be edited (unless admin/team_leader/pengawas)
    const editAllowedRoles = ['ADMIN', 'team_leader', 'pengawas'];
    // if (!editAllowedRoles.includes(userRole)) {
    //   const today = this.getTodayDate();
    //   const reportDate = new Date(existing.reportDate);
    //   reportDate.setUTCHours(0, 0, 0, 0);
    //   if (reportDate.getTime() !== today.getTime()) {
    //     throw new ForbiddenException('Hanya laporan hari ini yang bisa diedit');
    //   }
    // }

    const { photoFileIds, photoLabels, lokasi, ...data } = dto;

    // If photoFileIds provided, replace all photos
    if (photoFileIds !== undefined) {
      if (photoFileIds.length) {
        const files = await this.prisma.file.findMany({
          where: { id: { in: photoFileIds } },
        });
        if (files.length !== photoFileIds.length) {
          throw new BadRequestException('Some photo file IDs are invalid');
        }
      }

      await this.prisma.reportPhoto.deleteMany({ where: { reportId: id } });
      if (photoFileIds.length) {
        await this.prisma.reportPhoto.createMany({
          data: photoFileIds.map((fileId, index) => ({
            reportId: id,
            fileId,
            order: index + 1,
            label: photoLabels?.[index] || null,
          })),
        });
      }
    }

    // If lokasi provided, replace all lokasi
    if (lokasi !== undefined) {
      await this.prisma.reportLokasi.deleteMany({ where: { reportId: id } });
      if (lokasi.length) {
        const wlIds = lokasi.map((l) => l.workLocationId).filter(Boolean) as string[];
        if (wlIds.length > 0) {
          const wls = await this.prisma.workLocation.findMany({
            where: { id: { in: wlIds } },
          });
          if (wls.length !== new Set(wlIds).size) {
            throw new BadRequestException('Some work location IDs are invalid');
          }
        }
        await this.prisma.reportLokasi.createMany({
          data: lokasi.map((l) => ({
            reportId: id,
            workLocationId: l.workLocationId || null,
            name: l.name,
            alamatLengkap: l.alamatLengkap,
            kegiatan: l.kegiatan,
            panjang: l.panjang,
            lebar: l.lebar,
            lebarAtas: l.lebarAtas,
            lebarBawah: l.lebarBawah,
            kedalaman: l.kedalaman,
            sedimen: l.sedimen,
          })),
        });
      }
    }

    // If re-submitting a rejected report, clear rejection fields
    const clearRejection = existing.status === 'rejected' && data.status === 'submitted'
      ? { rejectedById: null, rejectedAt: null, rejectionNote: null }
      : {};

    const report = await this.prisma.report.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.status !== undefined && { status: data.status }),
        ...clearRejection,
        ...(data.reportDate ? { reportDate: new Date(data.reportDate) } : {}),
        ...(data.weekNumber !== undefined && { weekNumber: data.weekNumber }),
        ...(data.deskripsiKegiatan !== undefined && { deskripsiKegiatan: data.deskripsiKegiatan }),
        ...(data.kondisiCuaca !== undefined && { kondisiCuaca: data.kondisiCuaca }),
        ...(data.waktuMulai !== undefined && { waktuMulai: data.waktuMulai }),
        ...(data.waktuSelesai !== undefined && { waktuSelesai: data.waktuSelesai }),
        ...(data.formatLaporan !== undefined && { formatLaporan: data.formatLaporan }),
        ...(data.alatBeratNama !== undefined && { alatBeratNama: data.alatBeratNama }),
        ...(data.alatBeratBahanBakar !== undefined && { alatBeratBahanBakar: data.alatBeratBahanBakar }),
        ...(data.peralatanCangkul !== undefined && { peralatanCangkul: data.peralatanCangkul }),
        ...(data.peralatanParang !== undefined && { peralatanParang: data.peralatanParang }),
        ...(data.peralatanPes !== undefined && { peralatanPes: data.peralatanPes }),
        ...(data.peralatanLori !== undefined && { peralatanLori: data.peralatanLori }),
        ...(data.peralatanCatut !== undefined && { peralatanCatut: data.peralatanCatut }),
        ...(data.peralatanPalu !== undefined && { peralatanPalu: data.peralatanPalu }),
        ...(data.peralatanGarpu !== undefined && { peralatanGarpu: data.peralatanGarpu }),
        ...(data.tenagaPengawas !== undefined && { tenagaPengawas: data.tenagaPengawas }),
        ...(data.tenagaPekerja !== undefined && { tenagaPekerja: data.tenagaPekerja }),
        ...(data.tenagaKorlap !== undefined && { tenagaKorlap: data.tenagaKorlap }),
        ...(data.signatory1Name !== undefined && { signatory1Name: data.signatory1Name }),
        ...(data.signatory1Title !== undefined && { signatory1Title: data.signatory1Title }),
        ...(data.signatory2Name !== undefined && { signatory2Name: data.signatory2Name }),
        ...(data.signatory2Title !== undefined && { signatory2Title: data.signatory2Title }),
        ...(data.signatory3Name !== undefined && { signatory3Name: data.signatory3Name }),
        ...(data.signatory3Title !== undefined && { signatory3Title: data.signatory3Title }),
        ...(data.signatory4Name !== undefined && { signatory4Name: data.signatory4Name }),
        ...(data.signatory4Title !== undefined && { signatory4Title: data.signatory4Title }),
      },
      include: this.includeRelations,
    });

    const attPhotos = await this.getAttendancePhotos(report.userId, report.reportDate, baseUrl);
    return this.mapToResponse(report, baseUrl, attPhotos);
  }

  async rejectReport(
    id: string,
    pengawasUserId: string,
    rejectionNote: string,
    baseUrl: string,
  ): Promise<ReportResponseDto> {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!report) throw new NotFoundException('Report not found');

    if (report.status !== 'submitted') {
      throw new BadRequestException('Hanya laporan yang sudah dikirim yang bisa ditolak');
    }

    // Verify this pengawas supervises the report owner's team
    const team = await this.prisma.team.findFirst({
      where: {
        pengawasId: pengawasUserId,
        isActive: true,
        OR: [
          { leaderId: report.userId },
          { members: { some: { userId: report.userId } } },
        ],
      },
    });

    if (!team) {
      throw new ForbiddenException('You can only reject reports from your supervised teams');
    }

    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedById: pengawasUserId,
        rejectedAt: new Date(),
        rejectionNote: rejectionNote || null,
      },
      include: this.includeRelations,
    });

    const attPhotos = await this.getAttendancePhotos(updated.userId, updated.reportDate, baseUrl);
    return this.mapToResponse(updated, baseUrl, attPhotos);
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const existing = await this.prisma.report.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Report not found');

    if (existing.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own reports');
    }

    // Approved reports cannot be deleted (unless admin)
    if (existing.status === 'approved' && userRole !== 'ADMIN') {
      throw new ForbiddenException('Laporan yang sudah disetujui tidak bisa dihapus');
    }

    await this.prisma.report.delete({ where: { id } });
  }

  async findByTeams(
    pengawasUserId: string,
    query: ReportQueryDto,
    baseUrl: string,
  ): Promise<{ data: ReportResponseDto[]; meta: PageMetaDto }> {
    // Find all teams supervised by this pengawas
    const teams = await this.prisma.team.findMany({
      where: { pengawasId: pengawasUserId, isActive: true },
      include: { members: true },
    });

    // Collect all user IDs from those teams (leaders + members)
    const userIds = new Set<string>();
    for (const team of teams) {
      userIds.add(team.leaderId);
      for (const m of team.members) {
        userIds.add(m.userId);
      }
    }
    // Also include the pengawas's own reports
    userIds.add(pengawasUserId);

    const where = this.buildReportWhere(query, { userId: { in: Array.from(userIds) } });
    const orderBy = query.sortBy
      ? { [query.sortBy]: query.order }
      : { createdAt: query.order };

    const [reports, totalData] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: this.includeRelations,
        orderBy,
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    const data = reports.map((r) => this.mapToResponse(r, baseUrl));
    const meta = new PageMetaDto({
      page: query.page,
      limit: query.limit,
      totalData,
    });

    return { data, meta };
  }

  async approveReport(
    id: string,
    pengawasUserId: string,
    baseUrl: string,
  ): Promise<ReportResponseDto> {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!report) throw new NotFoundException('Report not found');

    if (report.status !== 'submitted') {
      throw new BadRequestException('Only submitted reports can be approved');
    }

    // Verify this pengawas supervises the report owner's team
    const team = await this.prisma.team.findFirst({
      where: {
        pengawasId: pengawasUserId,
        isActive: true,
        OR: [
          { leaderId: report.userId },
          { members: { some: { userId: report.userId } } },
        ],
      },
    });

    if (!team) {
      throw new ForbiddenException('You can only approve reports from your supervised teams');
    }

    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        status: 'approved',
        approvedById: pengawasUserId,
        approvedAt: new Date(),
      },
      include: this.includeRelations,
    });

    const attPhotos = await this.getAttendancePhotos(updated.userId, updated.reportDate, baseUrl);
    return this.mapToResponse(updated, baseUrl, attPhotos);
  }

  async getAttendancePhotosByDate(userId: string, date: string, baseUrl: string) {
    const reportDate = new Date(date);
    if (isNaN(reportDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    return this.getAttendancePhotos(userId, reportDate, baseUrl);
  }

  // --- PDF Settings ---

  async getPdfSettings(baseUrl: string): Promise<PdfSettingResponseDto[]> {
    const settings = await this.prisma.pdfSetting.findMany({
      include: { file: true },
    });

    return settings.map((s) => ({
      key: s.key,
      name: s.name,
      title: s.title,
      fileId: s.fileId,
      fileUrl: s.file?.url ? `${baseUrl}${s.file.url}` : null,
    }));
  }

  async upsertPdfSetting(
    dto: UpsertPdfSettingDto,
    baseUrl: string,
  ): Promise<PdfSettingResponseDto> {
    if (dto.fileId) {
      const file = await this.prisma.file.findUnique({
        where: { id: dto.fileId },
      });
      if (!file) throw new BadRequestException('File ID is invalid');
    }

    const setting = await this.prisma.pdfSetting.upsert({
      where: { key: dto.key },
      create: {
        key: dto.key,
        name: dto.name,
        title: dto.title,
        fileId: dto.fileId,
      },
      update: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.fileId !== undefined && { fileId: dto.fileId }),
      },
      include: { file: true },
    });

    return {
      key: setting.key,
      name: setting.name,
      title: setting.title,
      fileId: setting.fileId,
      fileUrl: setting.file?.url ? `${baseUrl}${setting.file.url}` : null,
    };
  }
}
