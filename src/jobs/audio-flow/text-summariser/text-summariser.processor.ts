import { Process, Processor } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'nestjs-prisma';
import { OpenAiService } from 'src/common/openAi/openAi.service';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import { SummaryJobDto } from 'src/youtube/dto/queue-jobs.dto';
import {
  OpenAiConfig,
  StorageConfig,
} from 'src/common/configs/config.interface';

@Injectable()
@Processor('text-summariser')
export class TextSummariserProcessor {
  private readonly logger = new Logger(TextSummariserProcessor.name);
  private storageBucket: string;
  private storageTextPath: string;
  private storageTextFormat: string;
  private openAiTokenLimit: number;
  private whisperFinalPromt: string;
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
    this.openAiTokenLimit =
      this.configService.get<OpenAiConfig>('openAi').tokenLimit;
    this.whisperFinalPromt =
      this.configService.get<OpenAiConfig>('openAi').whisperFinalPrompt;
  }

  async downloadTextFile(fileId: string) {
    try {
      const { data, error } = await this.supabaseService.downloadFile({
        bucket: this.storageBucket,
        path: this.storageTextPath,
        fileName: `${fileId}${this.storageTextFormat}`,
      });
      if (error) {
        this.logger.error(
          `TEXT_SUMMARISER_WORKER: Failed to download file: fileId: ${fileId}, error: ${error.message}`,
        );
        throw error;
      }
      return data;
    } catch (error) {
      this.logger.error(
        `TEXT_SUMMARISER_WORKER: Error downloading text file: fileId: ${fileId}, error: ${error.message}`,
      );
      throw error;
    }
  }

  async uploadToPrisma(textData: string, fileId: string): Promise<void> {
    try {
      await this.prismaService.youtubeVideoSummary.create({
        data: {
          summary: textData,
          youtubeId: fileId,
          YoutubeTextLink: {
            connect: {
              youtubeId: fileId,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `TEXT_SUMMARISER_WORKER: Failed to upload to Prisma: textData: ${textData}, fileId: ${fileId}, error: ${error.message}`,
      );
      throw error;
    }
  }

  processText(textData: string, gptTokenLimit: number = this.openAiTokenLimit) {
    const tokenCount = this.openAiService.getTokenCount(textData);
    const chunksNeeded = Math.ceil(tokenCount / gptTokenLimit);
    return this.chunkText(textData, gptTokenLimit, chunksNeeded);
  }

  chunkText(text: string, chunkSize: number, chunksNeeded: number) {
    const chunks = [];
    let start = 0;
    let iteration = 0;
    while (start < text.length && iteration < chunksNeeded) {
      let end = start + chunkSize;
      if (end < text.length) {
        while ('!.?'.indexOf(text[end]) === -1 && end > start) {
          end--;
        }
        if (end === start) {
          end = start + chunkSize;
        } else {
          end++;
        }
      }
      chunks.push({
        role: 'user',
        content: `Text part ${iteration}: ${text.slice(start, end)}`,
      });
      iteration++;
      start = end;
    }
    const finalPrompt = {
      role: 'user',
      content: this.whisperFinalPromt,
    };
    chunks.push(finalPrompt);

    return chunks;
  }

  @Process('summarise')
  async handleSummarisation(job: Job<SummaryJobDto>): Promise<void> {
    this.logger.debug('Starting summarising text...');
    this.logger.debug(job.data);
    const { userId, fileId } = job.data;

    const textBlob = await this.downloadTextFile(fileId);
    const textData = await textBlob.text();

    const textChunks = this.processText(textData);

    const gptAnswer = await this.openAiService.chatGptToSummary(textChunks);
    await this.uploadToPrisma(gptAnswer, fileId);

    this.logger.debug('Text summarisation completed');
  }
}
