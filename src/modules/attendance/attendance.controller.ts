import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, ResponseMessage, Roles } from '../../common';
import { AttendanceService } from './attendance.service';
import {
  AdminCreateAttendanceDto,
  AttendanceResponseDto,
  CreateAttendanceDto,
  DashboardSummaryDto,
  AttendanceQueryDto,
  UpdateAttendanceDto,
} from './dto';

@ApiBearerAuth()
@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('dashboard')
  @Roles('ADMIN', 'PENGAWAS')
  @ApiOperation({ summary: 'Get dashboard summary (Admin & Pengawas)' })
  @ApiResponse({ status: 200, type: DashboardSummaryDto })
  @ResponseMessage('Success get dashboard summary')
  getDashboardSummary() {
    return this.attendanceService.getDashboardSummary();
  }

  @Post()
  @ApiOperation({ summary: 'Submit attendance (check-in / check-out)' })
  @ApiResponse({ status: 201, type: AttendanceResponseDto })
  @ApiResponse({ status: 400, description: 'Validation or business rule error' })
  @ResponseMessage('Success submit attendance')
  create(
    @Body() dto: CreateAttendanceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.attendanceService.create(dto, userId, userId);
  }

  @Post('on-behalf/:userId')
  @Roles('TEAM_LEADER', 'PENGAWAS', 'ADMIN')
  @ApiOperation({ summary: 'Submit attendance on behalf of another user (TL / Pengawas / Admin)' })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
  @ApiResponse({ status: 201, type: AttendanceResponseDto })
  @ResponseMessage('Success submit attendance on behalf')
  createOnBehalf(
    @Body() dto: CreateAttendanceDto,
    @Param('userId') targetUserId: string,
    @CurrentUser('id') submittedById: string,
  ) {
    return this.attendanceService.create(dto, targetUserId, submittedById);
  }

  @Post('admin-create')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create attendance by admin (skip time & GPS validation)' })
  @ApiResponse({ status: 201, type: AttendanceResponseDto })
  @ApiResponse({ status: 400, description: 'Duplicate or validation error' })
  @ResponseMessage('Success create attendance by admin')
  adminCreate(
    @Body() dto: AdminCreateAttendanceDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.attendanceService.adminCreate(dto, adminId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my attendance history' })
  @ApiResponse({ status: 200, type: [AttendanceResponseDto] })
  @ResponseMessage('Success get my attendances')
  findMine(
    @CurrentUser('id') userId: string,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.attendanceService.findMyAttendances(userId, query);
  }

  @Get()
  @Roles('ADMIN', 'PENGAWAS')
  @ApiOperation({ summary: 'Get all attendance records (Admin & Pengawas)' })
  @ApiResponse({ status: 200, type: [AttendanceResponseDto] })
  @ResponseMessage('Success get all attendances')
  findAll(@Query() query: AttendanceQueryDto) {
    return this.attendanceService.findAll(query);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get single attendance by ID' })
  @ApiResponse({ status: 200, type: AttendanceResponseDto })
  @ResponseMessage('Success get attendance detail')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update attendance record (All users temporary)' })
  @ApiResponse({ status: 200, type: AttendanceResponseDto })
  @ResponseMessage('Success update attendance')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttendanceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.attendanceService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete attendance record (Admin only)' })
  @ApiParam({ name: 'id', description: 'Attendance UUID' })
  @ApiResponse({ status: 204, description: 'Attendance deleted' })
  @ResponseMessage('Success delete attendance')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceService.remove(id);
  }
}
