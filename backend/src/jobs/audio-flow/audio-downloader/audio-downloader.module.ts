import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { AudioDownloaderProcessor } from './audio-downloader.processor';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { AudioToTextModule } from '../audio-to-text/audio-to-text.module';
import { YoutubeAudioLinkModule } from 'src/common/prisma-related/youtube-related/YoutubeAudioLink/youtube-audio-link.module';
import { YoutubeVideoModule } from 'src/common/prisma-related/youtube-related/YoutubeVideo/youtube-video.module';
import { UserBriefingOrderModule } from 'src/common/prisma-related/user-related/UserBriefingOrder/user-briefing-order.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'youtube-audio',
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
    AudioToTextModule,
    YoutubeAudioLinkModule,
    YoutubeVideoModule,
    UserBriefingOrderModule,
  ],
  providers: [AudioDownloaderProcessor],
  exports: [BullModule],
})
export class AudioDownloaderModule {}
