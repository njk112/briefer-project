import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { AudioToTextProcessor } from './audio-to-text.processor';
import { OpenAiModule } from 'src/common/openAi/openAi.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio-to-text',
    }),
    SupabaseModule,
    OpenAiModule,
  ],
  providers: [AudioToTextProcessor],
  exports: [BullModule],
})
export class AudioToTextModule {}
