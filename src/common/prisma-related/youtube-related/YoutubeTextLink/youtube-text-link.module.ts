// supabase.module.ts
import { Module } from '@nestjs/common';
import { YoutubeTextLinkService } from './youtube-text-link.service';

@Module({
  providers: [YoutubeTextLinkService],
  exports: [YoutubeTextLinkService],
})
export class YoutubeTextLinkModule {}
