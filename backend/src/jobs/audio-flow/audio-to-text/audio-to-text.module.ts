import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { AudioToTextProcessor } from './audio-to-text.processor';
import { OpenAiModule } from 'src/common/openAi/openAi.module';
import { TextSummariserModule } from '../text-summariser/text-summariser.module';
import { YoutubeTextLinkModule } from 'src/common/prisma-related/youtube-related/YoutubeTextLink/youtube-text-link.module';
import { YoutubeVideoModule } from 'src/common/prisma-related/youtube-related/YoutubeVideo/youtube-video.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio-to-text',
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
    TextSummariserModule,
    YoutubeTextLinkModule,
    YoutubeVideoModule,
  ],
  providers: [AudioToTextProcessor],
  exports: [BullModule],
})
export class AudioToTextModule {}
