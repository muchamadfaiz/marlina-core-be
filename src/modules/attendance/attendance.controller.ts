import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { AttendanceService } from './attendance.service';
import {
  AttendanceResponseDto,
  CreateAttendanceDto,
  UpdateAttendanceDto,
  DashboardSummaryDto,
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

  @Get('me')
  @ApiOperation({ summary: 'Get my attendance history' })
  @ApiResponse({ status: 200, type: [AttendanceResponseDto] })
  @ResponseMessage('Success get my attendances')
  findMine(
    @CurrentUser('id') userId: string,
    @Query() query: PageOptionsDto,
  ) {
    return this.attendanceService.findMyAttendances(userId, query);
  }

  @Get()
  @Roles('ADMIN', 'PENGAWAS')
  @ApiOperation({ summary: 'Get all attendance records (Admin & Pengawas)' })
  @ApiResponse({ status: 200, type: [AttendanceResponseDto] })
  @ResponseMessage('Success get all attendances')
  findAll(@Query() query: PageOptionsDto) {
    return this.attendanceService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'PENGAWAS')
  @ApiOperation({ summary: 'Get attendance by ID (Admin & Pengawas)' })
  @ApiParam({ name: 'id', description: 'Attendance UUID' })
  @ApiResponse({ status: 200, type: AttendanceResponseDto })
  @ResponseMessage('Success get attendance')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update attendance (Admin only)' })
  @ApiParam({ name: 'id', description: 'Attendance UUID' })
  @ApiResponse({ status: 200, type: AttendanceResponseDto })
  @ResponseMessage('Success update attendance')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.update(id, dto);
  }
}
