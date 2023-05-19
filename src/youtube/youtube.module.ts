import { Module } from '@nestjs/common';
import { YoutubeController } from './youtube.controller';
import { YoutubeService } from './youtube.service';
import { AudioDownloaderModule } from 'src/jobs/audio-flow/audio-downloader/audio-downloader.module';

@Module({
  imports: [AudioDownloaderModule],
  controllers: [YoutubeController],
  providers: [YoutubeService],
})
export class CatsModule {}
