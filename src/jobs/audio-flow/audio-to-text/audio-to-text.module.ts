import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { AudioToTextProcessor } from './audio-to-text.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio-to-text',
    }),
    SupabaseModule,
  ],
  providers: [AudioToTextProcessor],
  exports: [BullModule],
})
export class AudioToTextModule {}
