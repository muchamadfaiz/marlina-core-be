import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, ResponseMessage, Roles } from '../../common';
import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { ReportService } from './report.service';
import { PdfService } from './pdf/pdf.service';
import {
  CreateReportDto,
  UpdateReportDto,
  RejectReportDto,
  ReportResponseDto,
  UpsertPdfSettingDto,
  PdfSettingResponseDto,
} from './dto';

@ApiBearerAuth()
@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  @Roles('TEAM_LEADER', 'PENGAWAS', 'ADMIN')
  @ApiOperation({ summary: 'Create a new report (TL/Pengawas/Admin)' })
  @ApiResponse({ status: 201, type: ReportResponseDto })
  @ResponseMessage('Success create report')
  create(
    @Body() dto: CreateReportDto,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.reportService.create(dto, userId, baseUrl);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my reports' })
  @ApiResponse({ status: 200, type: [ReportResponseDto] })
  @ResponseMessage('Success get my reports')
  findMine(
    @CurrentUser('id') userId: string,
    @Query() query: PageOptionsDto,
    @Req() req: Request,
  ) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.reportService.findMine(userId, query, baseUrl);
  }

  @Get('team')
  @Roles('PENGAWAS')
  @ApiOperation({ summary: 'Get reports from supervised teams (Pengawas only)' })
  @ApiResponse({ status: 200, type: [ReportResponseDto] })
  @ResponseMessage('Success get team reports')
  findByTeams(
    @CurrentUser('id') userId: string,
    @Query() query: PageOptionsDto,
    @Req() req: Request,
  ) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.reportService.findByTeams(userId, query, baseUrl);
  }

  @Patch(':id/approve')
  @Roles('PENGAWAS')
  @ApiOperation({ summary: 'Approve a submitted report (Pengawas only)' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  @ResponseMessage('Success approve report')
  approveReport(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.reportService.approveReport(id, userId, baseUrl);
  }

  @Patch(':id/reject')
  @Roles('PENGAWAS')
  @ApiOperation({ summary: 'Reject a submitted report (Pengawas only)' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  @ResponseMessage('Success reject report')
  rejectReport(
    @Param('id') id: string,
    @Body() dto: RejectReportDto,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.reportService.rejectReport(id, userId, dto.rejectionNote, baseUrl);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all reports (Admin only)' })
  @ApiResponse({ status: 200, type: [ReportResponseDto] })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ResponseMessage('Success get all reports')
  findAll(@Query() query: PageOptionsDto, @Req() req: Request) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.reportService.findAll(query, baseUrl);
  }

  @Get('pdf-settings')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all PDF settings' })
  @ApiResponse({ status: 200, type: [PdfSettingResponseDto] })
  @ResponseMessage('Success get PDF settings')
  getPdfSettings(@Req() req: Request) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.reportService.getPdfSettings(baseUrl);
  }

  @Get('pdf-settings/preview')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Preview PDF template with sample data' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF preview stream' })
  async previewPdfTemplate(@Res() res: Response) {
    const doc = await this.pdfService.generateReport({
      title: 'TIM OP BUSET',
      content: '',
      reportDate: new Date().toISOString().split('T')[0],
      userName: 'Budi Santoso',
      teamName: 'TIM OP BUSET',
      weekNumber: 1,
      deskripsiKegiatan:
        'Kegiatan Tim Operasional dan Pemeliharaan Sungai Dinas PUPR Kota Palembang di kerjakan Oleh Tim Buset OP Sungai. Detail pekerjaan dapat dilihat pada Tabel dibawah ini :',
      kondisiCuaca: 'Cuaca Cerah',
      waktuMulai: '08.00',
      waktuSelesai: '15.00',
      peralatanCangkul: 1,
      peralatanParang: 3,
      peralatanPes: 0,
      peralatanLori: 0,
      peralatanCatut: 0,
      peralatanPalu: 0,
      peralatanGarpu: 2,
      tenagaPengawas: 1,
      tenagaPekerja: 7,
      tenagaKorlap: 1,
      lokasi: [
        {
          workLocationName: 'Normalisasi Vegetasi Anak Sungai',
          workLocationAddress:
            'Jl. Mr. Sudarman Ganda Subrata, Suka Maju, Kec. Sako, Kota Palembang, Sumatera Selatan',
          kegiatan: 'Normalisasi Vegetasi Anak Sungai',
          panjang: 57,
          lebar: 4,
        },
      ],
      photos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="preview-template.pdf"',
    });

    doc.pipe(res);
  }

  @Post('pdf-settings')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create or update a PDF setting' })
  @ApiResponse({ status: 200, type: PdfSettingResponseDto })
  @ResponseMessage('Success update PDF setting')
  upsertPdfSetting(@Body() dto: UpsertPdfSettingDto, @Req() req: Request) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.reportService.upsertPdfSetting(dto, baseUrl);
  }

  @Get('attendance-photos')
  @ApiOperation({ summary: 'Get own attendance photos for a given date' })
  @ApiResponse({ status: 200, description: 'Attendance check-in/check-out photos' })
  @ResponseMessage('Success get attendance photos')
  getAttendancePhotos(
    @CurrentUser('id') userId: string,
    @Query('date') date: string,
    @Req() req: Request,
  ) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.reportService.getAttendancePhotosByDate(userId, date, baseUrl);
  }

  @Get(':id/export/pdf')
  @ApiOperation({ summary: 'Export report as PDF' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file stream' })
  async exportPdf(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const report = await this.reportService.findOne(id, baseUrl);

    const doc = await this.pdfService.generateReport({
      title: report.title,
      content: report.content,
      reportDate: report.reportDate,
      userName: report.userName || '',
      teamName: report.title,
      weekNumber: report.weekNumber,
      deskripsiKegiatan: report.deskripsiKegiatan,
      kondisiCuaca: report.kondisiCuaca,
      waktuMulai: report.waktuMulai,
      waktuSelesai: report.waktuSelesai,
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
      lokasi: (report.lokasi || []).map((l) => ({
        workLocationName: l.workLocationName || '',
        workLocationAddress: l.workLocationAddress || '',
        kegiatan: l.kegiatan,
        panjang: l.panjang,
        lebar: l.lebar,
      })),
      photos: report.photos,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    });

    const filename = `laporan-${report.reportDate}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    doc.pipe(res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  @ResponseMessage('Success get report')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.reportService.findOne(id, baseUrl);
  }

  @Patch(':id')
  @Roles('TEAM_LEADER', 'PENGAWAS', 'ADMIN')
  @ApiOperation({ summary: 'Update report (TL/Pengawas/Admin)' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  @ResponseMessage('Success update report')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Req() req: Request,
  ) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.reportService.update(id, dto, userId, userRole, baseUrl);
  }

  @Delete(':id')
  @Roles('TEAM_LEADER', 'PENGAWAS', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete report (TL/Pengawas/Admin)' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  @ApiResponse({ status: 204, description: 'Report deleted' })
  @ResponseMessage('Success delete report')
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.reportService.remove(id, userId, userRole);
  }
}
