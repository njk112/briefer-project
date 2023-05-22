import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'nestjs-prisma';
import { OpenAiService } from 'src/common/openAi/openAi.service';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import {
  OpenAiConfig,
  StorageConfig,
} from 'src/common/configs/config.interface';
import { TextSummariserDto } from './dto/textSummariser.dto';

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

    @InjectQueue('pdf-generator') private pdfGeneratorQueue: Queue,
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
      const data = await this.supabaseService.downloadFile({
        bucket: this.storageBucket,
        path: this.storageTextPath,
        fileName: `${fileId}${this.storageTextFormat}`,
      });
      return data;
    } catch (error) {
      this.logger.error(
        `TEXT_SUMMARISER_WORKER: Error downloading text file: fileId: ${fileId}, error: ${error.message}`,
      );
      throw error;
    }
  }

  async uploadVideoSummaryToPrisma(
    textData: string,
    youtubeId: string,
    youtubeVideoId: string,
  ) {
    try {
      await this.prismaService.youtubeVideoSummary.create({
        data: {
          summary: textData,
          youtubeId,
          youtubeVideoId,
        },
      });
    } catch (error) {
      this.logger.error(
        `TEXT_SUMMARISER_WORKER: Failed to upload to Prisma: textData: ${textData}, fileId: ${youtubeId}, error: ${error.message}`,
      );
      throw error;
    }
  }

  async updateBriefingOrderProcessedVideos(briefingOrderId: string) {
    try {
      const briefingOrder = await this.prismaService.userBriefingOrder.update({
        where: {
          id: briefingOrderId,
        },
        data: {
          videosProccessed: {
            increment: 1,
          },
        },
      });
      return briefingOrder;
    } catch (error) {
      this.logger.error(
        `TEXT_SUMMARISER_WORKER: Failed to upload to Prisma: briefingOrderId: ${briefingOrderId}, error: ${error.message}`,
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

  async getVideoData(youtubeId: string) {
    try {
      const video = await this.prismaService.youtubeVideo.findUnique({
        where: {
          youtubeId,
        },
        select: {
          id: true,
          YoutubeVideoSummary: {
            select: {
              summary: true,
            },
          },
        },
      });
      return video;
    } catch (error) {
      throw { PRISMA_ERROR: { youtubeId, error } };
    }
  }

  async queuePdfGeneration(userId: string, briefingOrderId: string) {
    const pdfGeneration = await this.pdfGeneratorQueue.add('generatePdf', {
      userId,
      briefingOrderId,
    });
    this.logger.debug({ ADDED_JOB_TO_OTHER_QUEUE: pdfGeneration });
  }

  @Process('summarise')
  async handleSummarisation(job: Job<TextSummariserDto>): Promise<void> {
    this.logger.debug('Starting summarising text...');
    this.logger.debug(job.data);
    const { userId, fileId, briefingOrderId } = job.data;
    const videoData = await this.getVideoData(fileId);

    if (videoData?.YoutubeVideoSummary?.summary) {
      this.logger.debug('Video summary exists');
    } else {
      const textBlob = await this.downloadTextFile(fileId);
      const textData = await textBlob.text();

      const textChunks = this.processText(textData);

      const gptAnswer = await this.openAiService.chatGptToSummary(textChunks);
      await this.uploadVideoSummaryToPrisma(gptAnswer, fileId, videoData.id);
    }
    const briefingOrderCount = await this.updateBriefingOrderProcessedVideos(
      briefingOrderId,
    );

    if (
      briefingOrderCount.totalVideos === briefingOrderCount.videosProccessed
    ) {
      await this.queuePdfGeneration(userId, briefingOrderId);
      this.logger.debug('PDF generation queued');
    } else {
      this.logger.debug('More jobs have to be processed before pdf generation');
    }

    this.logger.debug('Text summarisation completed');
  }
}
