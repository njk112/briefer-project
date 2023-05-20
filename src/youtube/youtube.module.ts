import { Module } from '@nestjs/common';
import { YoutubeController } from './youtube.controller';
import { YoutubeService } from './youtube.service';
import { AudioDownloaderModule } from 'src/jobs/audio-flow/audio-downloader/audio-downloader.module';
import { AudioToTextModule } from 'src/jobs/audio-flow/audio-to-text/audio-to-text.module';

@Module({
  imports: [AudioDownloaderModule, AudioToTextModule],
  controllers: [YoutubeController],
  providers: [YoutubeService],
})
export class CatsModule {}
