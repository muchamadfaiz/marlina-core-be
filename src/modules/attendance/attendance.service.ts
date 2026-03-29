import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import { AdminCreateAttendanceDto, CreateAttendanceDto, DashboardSummaryDto, AttendanceQueryDto, UpdateAttendanceDto } from './dto';
import { mapAttendanceToResponse } from './mapper/attendance.mapper';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate distance between two GPS coordinates using the Haversine formula.
   * Returns distance in meters.
   */
  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth's radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async create(
    dto: CreateAttendanceDto,
    userId: string,
    submittedById: string,
  ) {
    // 1. Check operational hour for today
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sunday, 6=Saturday
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const operationalHour = await this.prisma.operationalHour.findUnique({
      where: { dayOfWeek },
    });

    if (!operationalHour || !operationalHour.isActive) {
      throw new BadRequestException(
        'Attendance is not allowed today (non-operational day)',
      );
    }

    // Allow attendance 15 minutes before operational hours start
    const [startH, startM] = operationalHour.startTime.split(':').map(Number);
    const earlyMinutes = startH * 60 + startM - 15;
    const earlyStartTime = `${String(Math.floor(earlyMinutes / 60)).padStart(2, '0')}:${String(earlyMinutes % 60).padStart(2, '0')}`;

    if (
      currentTime < earlyStartTime ||
      currentTime > operationalHour.endTime
    ) {
      throw new BadRequestException(
        `Attendance is only allowed between ${earlyStartTime} - ${operationalHour.endTime}`,
      );
    }

    // 2. Check duplicate attendance for today
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        userId,
        type: dto.type,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existingAttendance) {
      throw new BadRequestException(
        `User already has a ${dto.type} record for today`,
      );
    }

    // 3. If CHECK_OUT, ensure CHECK_IN exists for today
    if (dto.type === 'CHECK_OUT') {
      const checkIn = await this.prisma.attendance.findFirst({
        where: {
          userId,
          type: 'CHECK_IN',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      });

      if (!checkIn) {
        throw new BadRequestException(
          'Cannot check out without checking in first',
        );
      }
    }

    // 4. Validate selfieFileId exists and belongs to the user
    const file = await this.prisma.file.findUnique({
      where: { id: dto.selfieFileId },
    });

    if (!file) {
      throw new NotFoundException('Selfie file not found');
    }

    if (file.userId !== submittedById) {
      throw new ForbiddenException('Selfie file does not belong to you');
    }

    // 5. Validate GPS radius against work location
    if (dto.workLocationId) {
      const workLocation = await this.prisma.workLocation.findUnique({
        where: { id: dto.workLocationId },
      });

      if (!workLocation) {
        throw new NotFoundException('Work location not found');
      }

      // Skip radius check if:
      // 1. Attendance is manual (latitude & longitude are 0)
      // 2. Work Location is manual (latitude & longitude are null)
      const isManualAttendance = dto.latitude === 0 && dto.longitude === 0;
      const isManualWorkLocation = workLocation.latitude === null || workLocation.longitude === null;

      if (!isManualAttendance && !isManualWorkLocation) {
        const distance = this.haversineDistance(
          dto.latitude,
          dto.longitude,
          workLocation.latitude!,
          workLocation.longitude!,
        );

        if (distance > workLocation.radius) {
          throw new BadRequestException(
            `Anda berada ${Math.round(distance)} meter dari lokasi kerja "${workLocation.name}". Maksimal radius ${workLocation.radius} meter.`,
          );
        }
      }
    }

    // 6. Create attendance record
    const attendance = await this.prisma.attendance.create({
      data: {
        userId,
        type: dto.type,
        selfieFileId: dto.selfieFileId,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        workLocationId: dto.workLocationId,
        submittedById,
      },
    });

    return mapAttendanceToResponse(attendance);
  }

  async adminCreate(dto: AdminCreateAttendanceDto, submittedById: string) {
    // 1. Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException('User not found');

    // 2. Check duplicate on target date
    const targetDate = dto.createdAt ? new Date(dto.createdAt) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        userId: dto.userId,
        type: dto.type,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `User sudah memiliki record ${dto.type} pada tanggal tersebut`,
      );
    }

    // 3. If CHECK_OUT, ensure CHECK_IN exists on the same day
    if (dto.type === 'CHECK_OUT') {
      const checkIn = await this.prisma.attendance.findFirst({
        where: {
          userId: dto.userId,
          type: 'CHECK_IN',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      });

      if (!checkIn) {
        throw new BadRequestException(
          'Tidak bisa CHECK_OUT tanpa CHECK_IN di hari yang sama',
        );
      }
    }

    // 4. Validate selfie file if provided
    if (dto.selfieFileId) {
      const file = await this.prisma.file.findUnique({
        where: { id: dto.selfieFileId },
      });
      if (!file) throw new NotFoundException('Selfie file not found');
    }

    // 5. Create attendance (skip operational hour & GPS radius validation)
    const attendance = await this.prisma.attendance.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        selfieFileId: dto.selfieFileId || '',
        description: dto.description,
        latitude: dto.latitude ?? 0,
        longitude: dto.longitude ?? 0,
        workLocationId: dto.workLocationId,
        submittedById,
        ...(dto.createdAt && { createdAt: new Date(dto.createdAt) }),
      },
      include: this.includeRelations,
    });

    const opHours = await this.getOpHoursMap();
    return mapAttendanceToResponse(attendance, opHours);
  }

  private readonly includeRelations = {
    user: { include: { profile: true } },
    workLocation: true,
  };

  private async getOpHoursMap() {
    const hours = await this.prisma.operationalHour.findMany();
    const map: Record<number, { startTime: string; endTime: string; isActive: boolean }> = {};
    for (const h of hours) {
      map[h.dayOfWeek] = { startTime: h.startTime, endTime: h.endTime, isActive: h.isActive };
    }
    return map;
  }

  async findOne(id: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: this.includeRelations,
    });
    if (!attendance) throw new NotFoundException('Attendance not found');
    const opHours = await this.getOpHoursMap();
    return mapAttendanceToResponse(attendance, opHours);
  }

  async update(id: string, dto: UpdateAttendanceDto, userId: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
    });
    if (!attendance) throw new NotFoundException('Attendance not found');

    const dataToUpdate: any = {};
    if (dto.type !== undefined) dataToUpdate.type = dto.type;
    if (dto.description !== undefined) dataToUpdate.description = dto.description;
    if (dto.latitude !== undefined) dataToUpdate.latitude = dto.latitude;
    if (dto.longitude !== undefined) dataToUpdate.longitude = dto.longitude;
    if (dto.createdAt !== undefined) dataToUpdate.createdAt = new Date(dto.createdAt);

    const updated = await this.prisma.attendance.update({
      where: { id },
      data: dataToUpdate,
      include: this.includeRelations,
    });

    const opHours = await this.getOpHoursMap();
    return mapAttendanceToResponse(updated, opHours);
  }

  async findMyAttendances(userId: string, query: AttendanceQueryDto) {
    const where: any = { userId };
    if (query.date) {
      const [year, month, day] = query.date.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      where.createdAt = { gte: startOfDay, lte: endOfDay };
    }
    const orderBy = query.sortBy
      ? { [query.sortBy]: query.order }
      : { createdAt: query.order };

    const [attendances, totalData, opHours] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: this.includeRelations,
        orderBy,
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.attendance.count({ where }),
      this.getOpHoursMap(),
    ]);

    const data = attendances.map((a) => mapAttendanceToResponse(a, opHours));
    const meta = new PageMetaDto({ page: query.page, limit: query.limit, totalData });
    return { data, meta };
  }

  async findAll(query: AttendanceQueryDto) {
    const where: any = {};
    if (query.date) {
      const [year, month, day] = query.date.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      where.createdAt = { gte: startOfDay, lte: endOfDay };
    }
    const orderBy = query.sortBy
      ? { [query.sortBy]: query.order }
      : { createdAt: query.order };

    const [attendances, totalData, opHours] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: this.includeRelations,
        orderBy,
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.attendance.count({ where }),
      this.getOpHoursMap(),
    ]);

    const data = attendances.map((a) => mapAttendanceToResponse(a, opHours));
    const meta = new PageMetaDto({ page: query.page, limit: query.limit, totalData });
    return { data, meta };
  }

  async remove(id: string) {
    const existing = await this.prisma.attendance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Attendance not found');

    await this.prisma.attendance.delete({ where: { id } });
  }

  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [todayRecords, activeOfficers, opHours] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
        include: this.includeRelations,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          role: { name: { in: ['PETUGAS', 'TEAM_LEADER'] } },
        },
        include: { profile: true, role: true },
      }),
      this.getOpHoursMap(),
    ]);

    const todayAttendances = todayRecords.map((a) =>
      mapAttendanceToResponse(a, opHours),
    );

    const checkIns = todayAttendances.filter((a) => a.type === 'CHECK_IN');
    const presentUserIds = new Set(checkIns.map((a) => a.userId));

    const onTimeCount = checkIns.filter((a) => a.status === 'on_time').length;
    const lateCount = checkIns.filter((a) => a.status === 'late').length;

    // Only show absent officers after operational hours have started
    const dayOfWeek = now.getDay();
    const todayOpHour = opHours[dayOfWeek];
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const isOperationalStarted =
      todayOpHour?.isActive && currentHHMM >= todayOpHour.startTime;

    const absentOfficers = isOperationalStarted
      ? activeOfficers
          .filter((u) => !presentUserIds.has(u.id))
          .map((u) => ({
            id: u.id,
            name: u.profile?.fullName || u.email,
            email: u.email,
            role: u.role.name,
          }))
      : [];

    const todayMarkers = checkIns
      .filter((a) => a.latitude && a.longitude)
      .map((a) => ({
        id: a.id,
        userName: a.userName || a.userEmail || '-',
        latitude: a.latitude!,
        longitude: a.longitude!,
        workLocationName: a.workLocationName,
        createdAt: a.createdAt,
      }));

    return {
      totalOfficers: activeOfficers.length,
      presentToday: checkIns.length,
      onTimeCount,
      lateCount,
      absentCount: absentOfficers.length,
      absentOfficers,
      todayAttendances,
      todayMarkers,
    };
  }
}
