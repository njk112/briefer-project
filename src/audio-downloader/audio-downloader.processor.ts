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

  async getYoutubeVideoInfo(url: string): Promise<any> {
    const youtubeInfo = await ytdl.getInfo(url);
    return youtubeInfo;
  }

  async getYoutubeAudioBuffer(url: string): Promise<Buffer> {
    const stream = ytdl(url, {
      filter: (format) => format.container === 'mp4',
    });
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    return buffer;
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

  async getYoutubeAudioInformation(
    videoURL: string,
  ): Promise<[string, ytdl.videoInfo]> {
    const videoid = ytdl.getURLVideoID(videoURL);
    const info = await ytdl.getInfo(videoid);

    const format = ytdl.filterFormats(info.formats, 'audioonly');
    let audioUrl = '';
    format.forEach((element) => {
      if (element.mimeType == `audio/mp4; codecs="mp4a.40.2"`) {
        audioUrl = element.url;
      }
    });

    return [audioUrl, info];
  }

  async downloadAudioFromUrl(url: string): Promise<ArrayBuffer> {
    if (url === '') return;
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`unexpected response ${response.statusText}`);

    const buffer = await response.arrayBuffer();

    return buffer;
  }

  @Process('download')
  async handleDownload(job: Job<{ url: string; userId: string }>) {
    this.logger.debug('Start transcoding...');
    this.logger.debug(job.data);

    const { url, userId } = job.data;

    const video = await this.getVideo(url);
    if (video) {
      this.logger.debug('Video already exists');
      return video.audioUrl;
    }
    const [audioUrl, videoInfo] = await this.getYoutubeAudioInformation(url);
    let audioBufferArray: ArrayBuffer;

    try {
      audioBufferArray = await this.downloadAudioFromUrl(audioUrl);
      this.logger.debug('Audio download completed');
    } catch (error) {
      this.logger.debug({ DOWNLOAD_WORKER_ERROR: { job: job.id, error } });
      throw new Error(error);
    }

    if (audioBufferArray) {
      try {
        const data = await this.uploadToSupabaseStorage(
          process.env.YOUTUBE_AUDIO_BUCKET,
          `${videoInfo.videoDetails.videoId}.mp4`,
          audioBufferArray,
        );

        const prismaUpload = await this.uploadToPrisma(
          data.path,
          videoInfo.videoDetails.videoId,
        );
        this.logger.log({ prismaUpload });

        this.logger.debug('Audio download completed');
        return { path: data.path };
      } catch (error) {
        this.logger.debug({ DOWNLOAD_WORKER_ERROR: { job: job.id, error } });
        throw new Error(error);
      }
    }
  }
}
