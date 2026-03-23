import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { OperationalHourController } from './operational-hour/operational-hour.controller';
import { OperationalHourService } from './operational-hour/operational-hour.service';

@Module({
  controllers: [AttendanceController, OperationalHourController],
  providers: [AttendanceService, OperationalHourService],
})
export class AttendanceModule {}
