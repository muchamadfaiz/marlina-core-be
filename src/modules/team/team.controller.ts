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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, ResponseMessage, Roles } from '../../common';
import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { TeamService } from './team.service';
import { CreateTeamDto, UpdateTeamDto, TeamResponseDto } from './dto';

@ApiBearerAuth()
@ApiTags('Teams')
@Controller('teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new team (Admin only)' })
  @ApiResponse({ status: 201, type: TeamResponseDto })
  @ResponseMessage('Success create team')
  create(@Body() dto: CreateTeamDto) {
    return this.teamService.create(dto);
  }

  @Get()
  @Roles('ADMIN', 'PENGAWAS')
  @ApiOperation({ summary: 'Get all teams (Admin & Pengawas)' })
  @ApiResponse({ status: 200, type: [TeamResponseDto] })
  @ResponseMessage('Success get all teams')
  findAll(@Query() query: PageOptionsDto) {
    return this.teamService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my team (for Team Leader / Petugas)' })
  @ApiResponse({ status: 200, type: TeamResponseDto })
  @ResponseMessage('Success get my team')
  findMyTeam(@CurrentUser('id') userId: string) {
    return this.teamService.findMyTeam(userId);
  }

  @Get('supervised')
  @Roles('PENGAWAS')
  @ApiOperation({ summary: 'Get teams supervised by current Pengawas' })
  @ApiResponse({ status: 200, type: [TeamResponseDto] })
  @ResponseMessage('Success get supervised teams')
  findSupervisedTeams(@CurrentUser('id') userId: string) {
    return this.teamService.findSupervisedTeams(userId);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get team by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Team UUID' })
  @ApiResponse({ status: 200, type: TeamResponseDto })
  @ResponseMessage('Success get team')
  findOne(@Param('id') id: string) {
    return this.teamService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PENGAWAS', 'TEAM_LEADER')
  @ApiOperation({ summary: 'Update team (Admin, Pengawas, & Team Leader)' })
  @ApiParam({ name: 'id', description: 'Team UUID' })
  @ApiResponse({ status: 200, type: TeamResponseDto })
  @ResponseMessage('Success update team')
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teamService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete team (Admin only)' })
  @ApiParam({ name: 'id', description: 'Team UUID' })
  @ApiResponse({ status: 204, description: 'Team deleted' })
  @ResponseMessage('Success delete team')
  remove(@Param('id') id: string) {
    return this.teamService.remove(id);
  }
}
