import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { TextSummariserProcessor } from './text-summariser.processor';
import { OpenAiModule } from 'src/common/openAi/openAi.module';
import { PdfGeneratorModule } from 'src/jobs/email-flow/pdf-generator/pdf-generator.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'text-summariser',
    }),
    SupabaseModule,
    OpenAiModule,
    PdfGeneratorModule,
  ],
  providers: [TextSummariserProcessor],
  exports: [BullModule],
})
export class TextSummariserModule {}
