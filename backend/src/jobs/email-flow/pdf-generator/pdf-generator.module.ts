import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { PdfGeneratorProcessor } from './pdf-generator.processor';
import { PrismaModule } from 'nestjs-prisma';
import { EmailSenderModule } from '../email-sender/email-sender.module';
import { UserBriefingOrderModule } from 'src/common/prisma-related/user-related/UserBriefingOrder/user-briefing-order.module';
import { BrieferPdfReportModule } from 'src/common/prisma-related/BrieferPdfReport/briefer-pdf-report.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'pdf-generator',
      defaultJobOptions: {
        removeOnComplete: true,
        attempts: 2,
        removeOnFail: true,
      },
      limiter: {
        max: 100,
        duration: 1000,
      },
      settings: {
        stalledInterval: 300000, // 5 minutes in milliseconds
      },
    }),
    SupabaseModule,
    PrismaModule,
    EmailSenderModule,
    UserBriefingOrderModule,
    BrieferPdfReportModule,
  ],
  providers: [PdfGeneratorProcessor],
  exports: [BullModule],
})
export class PdfGeneratorModule {}
