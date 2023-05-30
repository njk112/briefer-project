// supabase.module.ts
import { Module } from '@nestjs/common';
import { OpenAiService } from './openAi.service';

@Module({
  providers: [OpenAiService],
  exports: [OpenAiService],
})
export class OpenAiModule {}
