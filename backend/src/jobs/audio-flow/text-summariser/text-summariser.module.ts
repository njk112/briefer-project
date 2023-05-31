import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { TextSummariserProcessor } from './text-summariser.processor';
import { OpenAiModule } from 'src/common/openAi/openAi.module';
import { PdfGeneratorModule } from 'src/jobs/email-flow/pdf-generator/pdf-generator.module';
import { YoutubeVideoSummaryModule } from 'src/common/prisma-related/youtube-related/YoutubeVideoSummary/youtube-video-summary.module';
import { UserBriefingOrderModule } from 'src/common/prisma-related/user-related/UserBriefingOrder/user-briefing-order.module';
import { YoutubeVideoModule } from 'src/common/prisma-related/youtube-related/YoutubeVideo/youtube-video.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'text-summariser',
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
    OpenAiModule,
    PdfGeneratorModule,
    YoutubeVideoSummaryModule,
    UserBriefingOrderModule,
    YoutubeVideoModule,
  ],
  providers: [TextSummariserProcessor],
  exports: [BullModule],
})
export class TextSummariserModule {}
