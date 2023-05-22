import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { AudioDownloaderProcessor } from './audio-downloader.processor';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { AudioToTextModule } from '../audio-to-text/audio-to-text.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'youtube-audio',
    }),
    SupabaseModule,
    AudioToTextModule,
  ],
  providers: [AudioDownloaderProcessor],
  exports: [BullModule],
})
export class AudioDownloaderModule {}
