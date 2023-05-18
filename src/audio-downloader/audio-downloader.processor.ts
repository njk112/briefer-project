import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import * as ytdl from 'ytdl-core';

@Processor('youtube-audio')
export class AudioDownloaderProcessor {
  constructor(private supabaseService: SupabaseService) {}
  private readonly logger = new Logger(AudioDownloaderProcessor.name);

  @Process('download')
  async handleDownload(job: Job<{ url: string; userId: string }>) {
    this.logger.debug('Start transcoding...');
    this.logger.debug(job.data);

    const { url, userId } = job.data;

    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });

    if (format) {
      const videoStream = ytdl(url);
      const chunks = [];

      for await (const chunk of videoStream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      const { data, error } = await this.supabaseService.uploadFile(
        'youtube-videos-audio',
        `${info.videoDetails.videoId}.mp4`,
        buffer,
      );

      if (error) {
        throw error;
      }
      this.logger.log({ data });
      this.logger.log({ path: data.path, userId });

      return { path: data.path };
      this.logger.debug('Transcoding completed');
    }
  }
}
