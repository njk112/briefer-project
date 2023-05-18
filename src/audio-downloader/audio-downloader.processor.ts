import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { YoutubeAudioLink } from '@prisma/client';
import { Job } from 'bull';
import { PrismaService } from 'nestjs-prisma';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import * as ytdl from 'ytdl-core';

@Processor('youtube-audio')
export class AudioDownloaderProcessor {
  constructor(
    private supabaseService: SupabaseService,
    private prismaService: PrismaService,
  ) {}
  private readonly logger = new Logger(AudioDownloaderProcessor.name);

  async youtubeDownload(url: string): Promise<[Buffer, ytdl.videoInfo]> {
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });
    if (format) {
      const videoStream = ytdl(url);
      const chunks = [];

      for await (const chunk of videoStream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      return [buffer, info];
    }
  }

  async uploadToSupabaseStorage(
    bucket: string,
    path: string,
    file: any,
  ): Promise<any> {
    const { data, error } = await this.supabaseService.uploadFile(
      bucket,
      path,
      file,
    );
    if (error) {
      throw { SUPABASE_ERROR: { path, error } };
    }
    return data;
  }

  async uploadToPrisma(audioUrl: string, youtubeId: string): Promise<any> {
    try {
      const prismaUpload = await this.prismaService.youtubeAudioLink.create({
        data: {
          audioUrl,
          youtubeId,
        },
      });
      return prismaUpload;
    } catch (error) {
      throw { PRISMA_ERROR: { audioUrl, youtubeId, error } };
    }
  }

  async getVideo(youtubeUrl: string): Promise<YoutubeAudioLink> {
    const regex = /(?<=v=)[^&]+/;
    const youtubeId = youtubeUrl.match(regex)[0];
    try {
      const video = await this.prismaService.youtubeAudioLink.findUnique({
        where: {
          youtubeId,
        },
      });
      return video;
    } catch (error) {
      throw { PRISMA_ERROR: { youtubeId, error } };
    }
  }

  @Process('download')
  async handleDownload(job: Job<{ url: string; userId: string }>) {
    this.logger.debug('Start transcoding...');
    this.logger.debug(job.data);

    const { url, userId } = job.data;

    const video = await this.getVideo(url);
    console.log({ video });
    if (video) {
      this.logger.debug('Video already exists');
      return video.audioUrl;
    }

    const [youtubeBuffer, info] = await this.youtubeDownload(url);

    if (youtubeBuffer) {
      try {
        const data = await this.uploadToSupabaseStorage(
          process.env.YOUTUBE_AUDIO_BUCKET,
          `${info.videoDetails.videoId}.mp4`,
          youtubeBuffer,
        );

        const prismaUpload = await this.uploadToPrisma(
          data.path,
          info.videoDetails.videoId,
        );
        this.logger.log({ prismaUpload });

        this.logger.debug('Transcoding completed');
        return { path: data.path };
      } catch (error) {
        this.logger.debug({ DOWNLOAD_WORKER_ERROR: { job: job.id, error } });
        throw new Error(error);
      }
    }
  }
}
