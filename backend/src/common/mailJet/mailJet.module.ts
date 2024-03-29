// supabase.module.ts
import { Module } from '@nestjs/common';
import { MailjetService } from './mailJet.service';

@Module({
  providers: [MailjetService],
  exports: [MailjetService],
})
export class MailJetModule {}
