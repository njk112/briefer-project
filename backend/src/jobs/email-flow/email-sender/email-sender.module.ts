import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { EmailSenderProcessor } from './email-sender.processor';
import { MailJetModule } from 'src/common/mailJet/mailJet.module';
import { UserModule } from 'src/common/prisma-related/user-related/User/user.module';
import { BrieferPdfReportModule } from 'src/common/prisma-related/BrieferPdfReport/briefer-pdf-report.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-sender',
    }),
    SupabaseModule,
    MailJetModule,
    UserModule,
    BrieferPdfReportModule,
  ],
  providers: [EmailSenderProcessor],
  exports: [BullModule],
})
export class EmailSenderModule {}
