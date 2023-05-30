import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { OpenAiService } from 'src/common/openAi/openAi.service';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import { StorageConfig } from 'src/common/configs/config.interface';
import { AudioToTextDto } from './dto/audioToText.dto';
import { YoutubeTextLinkService } from 'src/common/prisma-related/youtube-related/YoutubeTextLink/youtube-text-link.service';
import { YoutubeVideoService } from 'src/common/prisma-related/youtube-related/YoutubeVideo/youtube-video.service';
import { AudioToTextException } from './exceptions/audio-to-text.exceptions';

@Processor('audio-to-text')
export class AudioToTextProcessor {
  private readonly logger = new Logger(AudioToTextProcessor.name);
  private storageBucket: string;
  private storageTextPath: string;
  private storageTextFormat: string;
  private storageAudioPath: string;
  private storageAudioFormat: string;
  constructor(
    private supabaseService: SupabaseService,
    private openAiService: OpenAiService,
    private configService: ConfigService,
    private youtubeTextLinkService: YoutubeTextLinkService,
    private youtubeVideoService: YoutubeVideoService,

    @InjectQueue('text-summariser') private summariserQueue: Queue,
  ) {
    this.storageBucket =
      this.configService.get<StorageConfig>('storage').bucket;
    this.storageTextPath =
      this.configService.get<StorageConfig>('storage').textPath;
    this.storageTextFormat =
      this.configService.get<StorageConfig>('storage').textFormat;
    this.storageAudioPath =
      this.configService.get<StorageConfig>('storage').audioPath;
    this.storageAudioFormat =
      this.configService.get<StorageConfig>('storage').audioFormat;
  }

  private handleError(error: any): void {
    const audioTextException = new AudioToTextException(error.message);
    this.logger.error(audioTextException);
    throw error;
  }

  async downloadAudioFile(fileId: string) {
    try {
      const data = await this.supabaseService.downloadFile({
        bucket: this.storageBucket,
        path: this.storageAudioPath,
        fileName: `${fileId}${this.storageAudioFormat}`,
      });
      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async transcribeAudioFile(data: Blob, fileId: string) {
    try {
      return await this.openAiService.whisperAudioToText(
        data,
        `${fileId}${this.storageAudioFormat}`,
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  async uploadTranscription(fileId: string, textData: string): Promise<void> {
    try {
      const textBuffer = Buffer.from(textData, 'utf-8');
      await this.supabaseService.uploadFile({
        bucket: this.storageBucket,
        path: `${this.storageTextPath}/${fileId}${this.storageTextFormat}`,
        file: textBuffer,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async queueTextSummary(
    userId: string,
    fileId: string,
    briefingOrderId: string,
  ) {
    try {
      const summaryJob = await this.summariserQueue.add('summarise', {
        userId,
        fileId,
        briefingOrderId,
      });
      this.logger.debug({ ADDED_JOB_TO_OTHER_QUEUE: summaryJob });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Process('transcribe')
  async handleAudioToText(job: Job<AudioToTextDto>): Promise<void> {
    this.logger.debug('AUDIO_TO_TEXT_WORKER: Start extracting audio...');
    this.logger.debug({ AUDIO_TO_TEXT_WORKER: { data: job.data } });

    const { userId, fileId, briefingOrderId } = job.data;

    const videoData = await this.youtubeVideoService.getYoutubeVideo(
      {
        youtubeId: fileId,
      },
      {
        id: true,
        YoutubeTextLink: {
          select: {
            textUrl: true,
          },
        },
      },
    );

    if (videoData?.YoutubeTextLink?.textUrl) {
      this.logger.debug('AUDIO_TO_TEXT_WORKER: Video text link exists');
    } else {
      const data = await this.downloadAudioFile(fileId);
      const textData = await this.transcribeAudioFile(data, fileId);
      await this.uploadTranscription(fileId, textData.text);

      await this.youtubeTextLinkService.createYoutubeTextLink({
        textUrl: `${this.storageBucket}/${this.storageTextPath}/${fileId}${this.storageTextFormat}`,
        youtubeId: fileId,
        YoutubeVideo: {
          connect: {
            id: videoData.id,
          },
        },
      });
    }
    await this.queueTextSummary(userId, fileId, briefingOrderId);
    this.logger.debug('AUDIO_TO_TEXT_WORKER: Audio download completed');
    return;
  }
}
