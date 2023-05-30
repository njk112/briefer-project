// supabase.module.ts
import { Module } from '@nestjs/common';
import { BrieferPdfReportService } from './briefer-pdf-report.service';

@Module({
  providers: [BrieferPdfReportService],
  exports: [BrieferPdfReportService],
})
export class BrieferPdfReportModule {}
