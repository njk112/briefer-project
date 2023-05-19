import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { TextSummariserProcessor } from './text-summariser.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'text-summariser',
    }),
    SupabaseModule,
  ],
  providers: [TextSummariserProcessor],
  exports: [BullModule],
})
export class TextSummariserModule {}
