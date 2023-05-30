// supabase.module.ts
import { Module } from '@nestjs/common';
import { YoutubeVideoSummaryService } from './youtube-video-summary.service';

@Module({
  providers: [YoutubeVideoSummaryService],
  exports: [YoutubeVideoSummaryService],
})
export class YoutubeVideoSummaryModule {}
