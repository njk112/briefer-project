import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bull';
import { StorageConfig } from 'src/common/configs/config.interface';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import * as ytdl from 'ytdl-core';
import { AudioDownloaderDto } from './dto/audioDownloader.dto';
import { UserBriefingOrderService } from 'src/common/prisma-related/user-related/UserBriefingOrder/user-briefing-order.service';
import { YoutubeVideoService } from 'src/common/prisma-related/youtube-related/YoutubeVideo/youtube-video.service';
import { YoutubeAudioLinkService } from 'src/common/prisma-related/youtube-related/YoutubeAudioLink/youtube-audio-link.service';
import { AudioDownloaderException } from './exceptions/audio-downloader.exceptions';
@Processor('youtube-audio')
export class AudioDownloaderProcessor {
  private storageAudioPath: string;
  private storageAudioFormat: string;
  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
    private youtubeAudioLinkService: YoutubeAudioLinkService,
    private youtubeVideoService: YoutubeVideoService,
    private userBriefingOrderService: UserBriefingOrderService,

    @InjectQueue('audio-to-text') private textQueue: Queue,
  ) {
    this.configService.get<StorageConfig>('storage').textFormat;
    this.storageAudioPath =
      this.configService.get<StorageConfig>('storage').audioPath;
    this.storageAudioFormat =
      this.configService.get<StorageConfig>('storage').audioFormat;
  }
  private readonly logger = new Logger(AudioDownloaderProcessor.name);
  private handleError(error: any): void {
    const audioTextException = new AudioDownloaderException(error.message);
    this.logger.error(audioTextException);
    throw error;
  }

  getYoutubeIdFromUrl(youtubeUrl: string) {
    try {
      const regex = /(?<=v=)[^&]+/;
      const youtubeId = youtubeUrl.match(regex)[0];
      return youtubeId;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getYoutubeAudioInformation(
    videoURL: string,
  ): Promise<[string, ytdl.videoInfo]> {
    try {
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
    } catch (error) {
      this.handleError(error);
    }
  }

  async downloadAudioFromUrl(url: string): Promise<ArrayBuffer> {
    try {
      if (url === '') return;
      this.logger.debug('Downloading audio from url');
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      return buffer;
    } catch (error) {
      this.handleError(error);
    }
  }

  async queueAudioToText(
    userId: string,
    youtubeId: string,
    briefingOrderId: string,
  ) {
    try {
      const audioToTextQueueJob = await this.textQueue.add('transcribe', {
        userId,
        fileId: youtubeId,
        briefingOrderId,
      });
      this.logger.debug({
        AUDIO_DOWNLOADER_WORKER: {
          ADDED_JOB_TO_OTHER_QUEUE: audioToTextQueueJob,
        },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Process('download')
  async handleDownload(job: Job<AudioDownloaderDto>) {
    this.logger.debug({ AUDIO_DOWNLOADER_WORKER: 'Start downloading...' });
    this.logger.debug({ AUDIO_DOWNLOADER_WORKER: { data: job.data } });
    try {
      const { url, userId, briefingOrderId } = job.data;

      const youtubeId = this.getYoutubeIdFromUrl(url);
      const video = await this.youtubeVideoService.getYoutubeVideo(
        {
          youtubeId,
        },
        {
          id: true,
          YoutubeAudioLink: {
            select: {
              audioUrl: true,
            },
          },
        },
      );
      if (video?.YoutubeAudioLink?.audioUrl) {
        this.logger.debug({ AUDIO_DOWNLOADER_WORKER: 'Video link exists' });
        await this.youtubeVideoService.updateYoutubeVideo(
          {
            id: video.id,
          },
          {
            timesAccessed: {
              increment: 1,
            },
          },
        );
        await this.userBriefingOrderService.updateUserBriefingOrder(
          {
            id: briefingOrderId,
          },
          {
            YoutubeVideo: {
              connect: {
                id: video.id,
              },
            },
          },
        );
      } else {
        const [audioUrl, videoInfo] = await this.getYoutubeAudioInformation(
          url,
        );
        const newVideo = await this.youtubeVideoService.createYoutubeVideo({
          youtubeId,
          UserBriefingOrder: {
            connect: {
              id: briefingOrderId,
            },
          },
          title: videoInfo.videoDetails.title,
          videoAuthor: videoInfo.videoDetails.author.name,
        });

        const audioBufferArray = await this.downloadAudioFromUrl(audioUrl);
        this.logger.debug({
          AUDIO_DOWNLOADER_WORKER: 'Audio download completed',
        });

        if (audioBufferArray) {
          const data = await this.supabaseService.uploadFile({
            bucket: process.env.YOUTUBE_BUCKET,
            path: `${this.storageAudioPath}/${youtubeId}${this.storageAudioFormat}`,
            file: audioBufferArray,
          });

          await this.youtubeAudioLinkService.createYoutubeAudioLink({
            audioUrl: `${process.env.YOUTUBE_BUCKET}/${data.path}`,
            youtubeId,
            YoutubeVideo: {
              connect: {
                id: newVideo.id,
              },
            },
          });
        }
      }

      await this.queueAudioToText(userId, youtubeId, briefingOrderId);
      this.logger.log({ AUDIO_DOWNLOADER_WORKER: 'Job completed' });
      return {};
    } catch (error) {
      this.handleError(error);
      return {};
    }
  }
}
