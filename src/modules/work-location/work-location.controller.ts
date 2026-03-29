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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage, Roles } from '../../common';
import { WorkLocationService } from './work-location.service';
import {
  CreateWorkLocationDto,
  UpdateWorkLocationDto,
  WorkLocationResponseDto,
  AssignTeamWorkLocationDto,
  TeamWorkLocationResponseDto,
  WorkLocationQueryDto,
} from './dto';

@ApiBearerAuth()
@ApiTags('Work Locations')
@Controller('work-locations')
export class WorkLocationController {
  constructor(private readonly workLocationService: WorkLocationService) {}

  @Post()
  @Roles('ADMIN', 'PENGAWAS', 'TEAM_LEADER')
  @ApiOperation({ summary: 'Create work location (Admin/Pengawas)' })
  @ApiResponse({ status: 201, type: WorkLocationResponseDto })
  @ResponseMessage('Success create work location')
  create(@Body() dto: CreateWorkLocationDto) {
    return this.workLocationService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all work locations' })
  @ApiResponse({ status: 200, type: [WorkLocationResponseDto] })
  @ResponseMessage('Success get work locations')
  findAll(@Query() query: WorkLocationQueryDto) {
    return this.workLocationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get work location by ID' })
  @ApiParam({ name: 'id', description: 'Work Location UUID' })
  @ApiResponse({ status: 200, type: WorkLocationResponseDto })
  @ResponseMessage('Success get work location')
  findOne(@Param('id') id: string) {
    return this.workLocationService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PENGAWAS', 'TEAM_LEADER')
  @ApiOperation({ summary: 'Update work location (Admin/Pengawas)' })
  @ApiParam({ name: 'id', description: 'Work Location UUID' })
  @ApiResponse({ status: 200, type: WorkLocationResponseDto })
  @ResponseMessage('Success update work location')
  update(@Param('id') id: string, @Body() dto: UpdateWorkLocationDto) {
    return this.workLocationService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'PENGAWAS', 'TEAM_LEADER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete work location (Admin/Pengawas)' })
  @ApiParam({ name: 'id', description: 'Work Location UUID' })
  @ApiResponse({ status: 204, description: 'Work location deleted' })
  @ResponseMessage('Success delete work location')
  remove(@Param('id') id: string) {
    return this.workLocationService.remove(id);
  }

  // ── Team-WorkLocation Assignments ──

  @Post('assign')
  @Roles('ADMIN', 'PENGAWAS', 'TEAM_LEADER')
  @ApiOperation({ summary: 'Assign team to work location on a date (Admin/Pengawas)' })
  @ApiResponse({ status: 201, type: TeamWorkLocationResponseDto })
  @ResponseMessage('Success assign team to work location')
  assignTeam(@Body() dto: AssignTeamWorkLocationDto) {
    return this.workLocationService.assignTeam(dto);
  }

  @Get('assignments/by-date')
  @Roles('ADMIN', 'PENGAWAS', 'TEAM_LEADER')
  @ApiOperation({ summary: 'Get assignments by date' })
  @ApiQuery({ name: 'date', required: true, description: 'Date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, type: [TeamWorkLocationResponseDto] })
  @ResponseMessage('Success get assignments by date')
  findAssignmentsByDate(@Query('date') date: string) {
    return this.workLocationService.findAssignmentsByDate(date);
  }

  @Get('assignments/upcoming')
  @Roles('ADMIN', 'PENGAWAS', 'TEAM_LEADER')
  @ApiOperation({ summary: 'Get upcoming assignments (next N days)' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days ahead (default 7)' })
  @ApiResponse({ status: 200, type: [TeamWorkLocationResponseDto] })
  @ResponseMessage('Success get upcoming assignments')
  findUpcomingAssignments(@Query('days') days?: string) {
    return this.workLocationService.findUpcomingAssignments(days ? parseInt(days) : 7);
  }

  @Get('assignments/by-team/:teamId')
  @Roles('ADMIN', 'PENGAWAS', 'TEAM_LEADER')
  @ApiOperation({ summary: 'Get assignments by team' })
  @ApiParam({ name: 'teamId', description: 'Team UUID' })
  @ApiResponse({ status: 200, type: [TeamWorkLocationResponseDto] })
  @ResponseMessage('Success get assignments by team')
  findAssignmentsByTeam(@Param('teamId') teamId: string) {
    return this.workLocationService.findAssignmentsByTeam(teamId);
  }

  @Get('assignments/by-location/:locationId')
  @ApiOperation({ summary: 'Get assignments by work location' })
  @ApiParam({ name: 'locationId', description: 'Work Location UUID' })
  @ApiResponse({ status: 200, type: [TeamWorkLocationResponseDto] })
  @ResponseMessage('Success get assignments by work location')
  findAssignmentsByWorkLocation(@Param('locationId') locationId: string) {
    return this.workLocationService.findAssignmentsByWorkLocation(locationId);
  }

  @Delete('assignments/:id')
  @Roles('ADMIN', 'PENGAWAS', 'TEAM_LEADER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove team-location assignment (Admin/Pengawas)' })
  @ApiParam({ name: 'id', description: 'Assignment UUID' })
  @ApiResponse({ status: 204, description: 'Assignment removed' })
  @ResponseMessage('Success remove assignment')
  removeAssignment(@Param('id') id: string) {
    return this.workLocationService.removeAssignment(id);
  }
}
