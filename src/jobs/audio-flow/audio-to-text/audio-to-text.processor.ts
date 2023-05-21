import { Process, Processor } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'nestjs-prisma';
import { OpenAiService } from 'src/common/openAi/openAi.service';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import { TranscribeJobDto } from 'src/youtube/dto/queue-jobs.dto';
import { StorageConfig } from 'src/common/configs/config.interface';

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
      const { data, error } = await this.supabaseService.downloadFile({
        bucket: this.storageBucket,
        path: this.storageAudioPath,
        fileName: `${fileId}${this.storageAudioFormat}`,
      });
      if (error) {
        this.logger.error(
          `AUDIO_TO_TEXT_WORKER: Failed to download file: fileId: ${fileId}, error: ${error.message}`,
        );
        throw error;
      }
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

  async uploadToPrisma(textUrl: string, youtubeId: string): Promise<void> {
    try {
      await this.prismaService.youtubeTextLink.create({
        data: {
          textUrl,
          youtubeId,
          youtubeAudioLink: {
            connect: {
              youtubeId,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `AUDIO_TO_TEXT_WORKER: Failed to upload to Prisma: textUrl: ${textUrl}, youtubeId: ${youtubeId}, error: ${error.message}`,
      );
      throw error;
    }
  }

  @Process('transcribe')
  async handleAudioToText(job: Job<TranscribeJobDto>): Promise<void> {
    this.logger.debug('Start extracting audio...');
    this.logger.debug(job.data);
    const { userId, fileId } = job.data;

    const data = await this.downloadAudioFile(fileId);
    const textData = await this.transcribeAudioFile(data, fileId);
    await this.uploadTranscription(fileId, textData.text);
    await this.uploadToPrisma(
      `${this.storageBucket}/${this.storageTextPath}/${fileId}${this.storageTextFormat}`,
      fileId,
    );
    this.logger.debug('Audio download completed');
  }
}
