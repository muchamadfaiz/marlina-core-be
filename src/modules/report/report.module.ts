import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { PdfService } from './pdf/pdf.service';

@Module({
  controllers: [ReportController],
  providers: [ReportService, PdfService],
})
export class ReportModule {}
