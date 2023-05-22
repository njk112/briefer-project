import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'nestjs-prisma';
import { OpenAiService } from 'src/common/openAi/openAi.service';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import { StorageConfig } from 'src/common/configs/config.interface';
import { AudioToTextDto } from './dto/audioToText.dto';

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
    private prismaService: PrismaService,
    private openAiService: OpenAiService,
    private configService: ConfigService,

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

  async downloadAudioFile(fileId: string) {
    try {
      const data = await this.supabaseService.downloadFile({
        bucket: this.storageBucket,
        path: this.storageAudioPath,
        fileName: `${fileId}${this.storageAudioFormat}`,
      });
      return data;
    } catch (error) {
      this.logger.error(
        `AUDIO_TO_TEXT_WORKER: Error downloading audio file: fileId: ${fileId}, error: ${error.message}`,
      );
      throw error;
    }
  }

  async transcribeAudioFile(data: Blob, fileId: string) {
    try {
      return await this.openAiService.whisperAudioToText(
        data,
        `${fileId}${this.storageAudioFormat}`,
      );
    } catch (error) {
      this.logger.error(
        `AUDIO_TO_TEXT_WORKER: Failed to transcribe file: fileId: ${fileId}, error: ${error.message}`,
      );
      throw error;
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
      this.logger.error(
        `AUDIO_TO_TEXT_WORKER: Failed to upload transcription to Supabase: fileId: ${fileId}, error: ${error.message}`,
      );
      throw error;
    }
  }

  async uploadToPrisma(
    textUrl: string,
    youtubeId: string,
    youtubeVideoId: string,
  ): Promise<void> {
    try {
      await this.prismaService.youtubeTextLink.create({
        data: {
          textUrl,
          youtubeId,
          youtubeVideoId,
        },
      });
    } catch (error) {
      this.logger.error(
        `AUDIO_TO_TEXT_WORKER: Failed to upload to Prisma: textUrl: ${textUrl}, youtubeId: ${youtubeId}, error: ${error.message}`,
      );
      throw error;
    }
  }

  async getVideoData(youtubeId: string) {
    try {
      const video = await this.prismaService.youtubeVideo.findUnique({
        where: {
          youtubeId,
        },
        select: {
          id: true,
          YoutubeTextLink: {
            select: {
              textUrl: true,
            },
          },
        },
      });
      return video;
    } catch (error) {
      throw { PRISMA_ERROR: { youtubeId, error } };
    }
  }

  async queueTextSummary(
    userId: string,
    fileId: string,
    briefingOrderId: string,
  ) {
    const summaryJob = await this.summariserQueue.add('summarise', {
      userId,
      fileId,
      briefingOrderId,
    });
    this.logger.debug({ ADDED_JOB_TO_OTHER_QUEUE: summaryJob });
  }

  @Process('transcribe')
  async handleAudioToText(job: Job<AudioToTextDto>): Promise<void> {
    this.logger.debug('Start extracting audio...');
    this.logger.debug(job.data);
    const { userId, fileId, briefingOrderId } = job.data;

    const videoData = await this.getVideoData(fileId);

    if (videoData?.YoutubeTextLink?.textUrl) {
      this.logger.debug('Video text link exists');
    } else {
      const data = await this.downloadAudioFile(fileId);
      const textData = await this.transcribeAudioFile(data, fileId);
      await this.uploadTranscription(fileId, textData.text);
      await this.uploadToPrisma(
        `${this.storageBucket}/${this.storageTextPath}/${fileId}${this.storageTextFormat}`,
        fileId,
        videoData.id,
      );
    }
    await this.queueTextSummary(userId, fileId, briefingOrderId);
    this.logger.debug('Audio download completed');
    return;
  }
}
