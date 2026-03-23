import { Module } from '@nestjs/common';
import { WorkLocationController } from './work-location.controller';
import { WorkLocationService } from './work-location.service';

@Module({
  controllers: [WorkLocationController],
  providers: [WorkLocationService],
})
export class WorkLocationModule {}
