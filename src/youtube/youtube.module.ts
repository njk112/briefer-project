import { Module } from '@nestjs/common';
import { YoutubeController } from './youtube.controller';
import { YoutubeService } from './youtube.service';
import { AudioDownloaderModule } from 'src/jobs/audio-flow/audio-downloader/audio-downloader.module';
import { AudioToTextModule } from 'src/jobs/audio-flow/audio-to-text/audio-to-text.module';
import { TextSummariserModule } from 'src/jobs/audio-flow/text-summariser/text-summariser.module';
import { PdfGeneratorModule } from 'src/jobs/email-flow/pdf-generator/pdf-generator.module';

@Module({
  imports: [
    AudioDownloaderModule,
    AudioToTextModule,
    TextSummariserModule,
    PdfGeneratorModule,
  ],
  controllers: [YoutubeController],
  providers: [YoutubeService],
})
export class CatsModule {}
