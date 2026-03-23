import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage, Roles } from '../../../common';
import { OperationalHourService } from './operational-hour.service';
import { SetOperationalHoursDto } from './dto';

@ApiBearerAuth()
@ApiTags('Attendance')
@Controller('attendance/operational-hours')
export class OperationalHourController {
  constructor(
    private readonly operationalHourService: OperationalHourService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get operational hours' })
  @ApiResponse({ status: 200, description: 'List of operational hours' })
  @ResponseMessage('Success get operational hours')
  findAll() {
    return this.operationalHourService.findAll();
  }

  @Put()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Set operational hours (Admin only, bulk upsert)' })
  @ApiResponse({ status: 200, description: 'Operational hours updated' })
  @ResponseMessage('Success update operational hours')
  update(@Body() dto: SetOperationalHoursDto) {
    return this.operationalHourService.bulkUpsert(dto);
  }
}
