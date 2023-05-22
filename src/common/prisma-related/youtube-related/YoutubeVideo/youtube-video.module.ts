// supabase.module.ts
import { Module } from '@nestjs/common';
import { YoutubeVideoService } from './youtube-video.service';

@Module({
  providers: [YoutubeVideoService],
  exports: [YoutubeVideoService],
})
export class YoutubeVideoModule {}
