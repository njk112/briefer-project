import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { EmailSenderProcessor } from './email-sender.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-sender',
    }),
    SupabaseModule,
  ],
  providers: [EmailSenderProcessor],
  exports: [BullModule],
})
export class EmailSenderModule {}
