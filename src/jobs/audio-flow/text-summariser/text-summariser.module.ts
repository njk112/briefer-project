import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { TextSummariserProcessor } from './text-summariser.processor';
import { OpenAiModule } from 'src/common/openAi/openAi.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'text-summariser',
    }),
    SupabaseModule,
    OpenAiModule,
  ],
  providers: [TextSummariserProcessor],
  exports: [BullModule],
})
export class TextSummariserModule {}
