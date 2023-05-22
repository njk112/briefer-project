import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { YoutubeVideo } from '@prisma/client';
import { Job, Queue } from 'bull';
import { PrismaService } from 'nestjs-prisma';
import { StorageConfig } from 'src/common/configs/config.interface';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import * as ytdl from 'ytdl-core';
import { AudioDownloaderDto } from './dto/audioDownloader.dto';
@Processor('youtube-audio')
export class AudioDownloaderProcessor {
  private storageAudioPath: string;
  private storageAudioFormat: string;
  constructor(
    private supabaseService: SupabaseService,
    private prismaService: PrismaService,
    private configService: ConfigService,

    @InjectQueue('audio-to-text') private textQueue: Queue,
  ) {
    this.configService.get<StorageConfig>('storage').textFormat;
    this.storageAudioPath =
      this.configService.get<StorageConfig>('storage').audioPath;
    this.storageAudioFormat =
      this.configService.get<StorageConfig>('storage').audioFormat;
  }
  private readonly logger = new Logger(AudioDownloaderProcessor.name);

  async uploadToPrisma(
    audioUrl: string,
    youtubeId: string,
    youtubeVideoId: string,
  ) {
    try {
      const prismaUpload = await this.prismaService.youtubeAudioLink.create({
        data: {
          audioUrl,
          youtubeId,
          youtubeVideoId,
        },
      });
      return prismaUpload;
    } catch (error) {
      throw { PRISMA_ERROR: { audioUrl, youtubeId, error } };
    }
  }

  async createVideo(
    youtubeId: string,
    userBriefingOrderId: string,
    title: string,
  ): Promise<YoutubeVideo> {
    try {
      const video = await this.prismaService.youtubeVideo.create({
        data: {
          youtubeId,
          userBriefingOrderId,
          title,
        },
      });
      this.logger.debug('VIDEO_CREATED');
      return video;
    } catch (error) {
      throw { PRISMA_ERROR: { youtubeId, error } };
    }
  }

  getYoutubeIdFromUrl(youtubeUrl: string) {
    const regex = /(?<=v=)[^&]+/;
    const youtubeId = youtubeUrl.match(regex)[0];
    return youtubeId;
  }

  async getVideo(youtubeId: string) {
    try {
      const video = await this.prismaService.youtubeVideo.findUnique({
        where: {
          youtubeId,
        },
        select: {
          id: true,
          youtubeId: true,
          YoutubeAudioLink: {
            select: {
              audioUrl: true,
            },
          },
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
    this.logger.debug('Downloading audio from url');
    const response = await fetch(url);

    if (!response.ok)
      throw new Error(`unexpected response ${response.statusText}`);

    const buffer = await response.arrayBuffer();

    return buffer;
  }

  async updateUserBriefingOrderWithExistingVideos(
    briefingReportId: string,
    videoId: string,
  ) {
    try {
      await this.prismaService.userBriefingOrder.update({
        where: {
          id: briefingReportId,
        },
        data: {
          YoutubeVideo: {
            connect: {
              id: videoId,
            },
          },
        },
      });
    } catch (error) {
      throw { PRISMA_ERROR: { briefingReportId, videoId, error } };
    }
  }

  async queueAudioToText(
    userId: string,
    youtubeId: string,
    briefingOrderId: string,
  ) {
    const audioToTextQueueJob = await this.textQueue.add('transcribe', {
      userId,
      fileId: youtubeId,
      briefingOrderId,
    });
    this.logger.debug({ ADDED_JOB_TO_OTHER_QUEUE: audioToTextQueueJob });
  }

  @Process('download')
  async handleDownload(job: Job<AudioDownloaderDto>) {
    this.logger.debug('Start downloading...');
    this.logger.debug(job.data);

    const { url, userId, briefingOrderId } = job.data;

    const youtubeId = this.getYoutubeIdFromUrl(url);
    const video = await this.getVideo(youtubeId);
    if (video?.YoutubeAudioLink?.audioUrl) {
      this.logger.debug('Video audio link exists');
      await this.updateUserBriefingOrderWithExistingVideos(
        briefingOrderId,
        video.id,
      );
    } else {
      const [audioUrl, videoInfo] = await this.getYoutubeAudioInformation(url);
      this.logger.debug('Audio url obtained');
      const newVideo = await this.createVideo(
        youtubeId,
        briefingOrderId,
        videoInfo.videoDetails.title,
      );
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
          const data = await this.supabaseService.uploadFile({
            bucket: process.env.YOUTUBE_BUCKET,
            path: `${this.storageAudioPath}/${youtubeId}${this.storageAudioFormat}`,
            file: audioBufferArray,
          });

          await this.uploadToPrisma(
            `${process.env.YOUTUBE_BUCKET}/${this.storageAudioPath}/${data.path}`,
            youtubeId,
            newVideo.id,
          );
        } catch (error) {
          this.logger.debug({ DOWNLOAD_WORKER_ERROR: { job: job.id, error } });
          throw new Error(error);
        }
      }
    }

    await this.queueAudioToText(userId, youtubeId, briefingOrderId);
    this.logger.log({ DOWNLOAD_WORKER: 'Job completed' });
    return;
  }
}
