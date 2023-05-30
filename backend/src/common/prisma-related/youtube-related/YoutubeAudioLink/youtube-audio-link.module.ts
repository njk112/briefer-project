// supabase.module.ts
import { Module } from '@nestjs/common';
import { YoutubeAudioLinkService } from './youtube-audio-link.service';

@Module({
  providers: [YoutubeAudioLinkService],
  exports: [YoutubeAudioLinkService],
})
export class YoutubeAudioLinkModule {}
