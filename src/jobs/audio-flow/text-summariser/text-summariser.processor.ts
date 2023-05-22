import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { OpenAiService } from 'src/common/openAi/openAi.service';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import {
  OpenAiConfig,
  StorageConfig,
} from 'src/common/configs/config.interface';
import { TextSummariserDto } from './dto/textSummariser.dto';
import { YoutubeVideoSummaryService } from 'src/common/prisma-related/youtube-related/YoutubeVideoSummary/youtube-video-summary.service';
import { YoutubeVideoService } from 'src/common/prisma-related/youtube-related/YoutubeVideo/youtube-video.service';
import { UserBriefingOrderService } from 'src/common/prisma-related/user-related/UserBriefingOrder/user-briefing-order.service';

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
    private openAiService: OpenAiService,
    private configService: ConfigService,
    private youtubeVideoSummaryService: YoutubeVideoSummaryService,
    private userBriefingOrderService: UserBriefingOrderService,
    private youtubeVideoService: YoutubeVideoService,

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

    const videoData = await this.youtubeVideoService.getYoutubeVideo(
      {
        youtubeId: fileId,
      },
      {
        id: true,
        YoutubeVideoSummary: {
          select: {
            summary: true,
          },
        },
      },
    );

    if (videoData?.YoutubeVideoSummary?.summary) {
      this.logger.debug('Video summary exists');
    } else {
      const textBlob = await this.downloadTextFile(fileId);
      const textData = await textBlob.text();

      const textChunks = this.processText(textData);

      const gptAnswer = await this.openAiService.chatGptToSummary(textChunks);
      await this.youtubeVideoSummaryService.createYoutubeVideoSummary({
        summary: gptAnswer,
        youtubeId: fileId,
        YoutubeVideo: {
          connect: {
            id: videoData.id,
          },
        },
      });
    }
    const briefingOrderCount =
      await this.userBriefingOrderService.updateUserBriefingOrder(
        {
          id: briefingOrderId,
        },
        {
          videosProccessed: {
            increment: 1,
          },
        },
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
