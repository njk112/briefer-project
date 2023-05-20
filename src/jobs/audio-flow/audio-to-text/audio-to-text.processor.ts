import { Process, Processor } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'nestjs-prisma';
import { OpenAiService } from 'src/common/openAi/openAi.service';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import { TranscribeJobDto } from 'src/youtube/dto/queue-jobs.dto';

@Injectable()
@Processor('audio-to-text')
export class AudioToTextProcessor {
  private readonly logger = new Logger(AudioToTextProcessor.name);

  constructor(
    private supabaseService: SupabaseService,
    private prismaService: PrismaService,
    private openAiService: OpenAiService,
    private configService: ConfigService,
    @InjectQueue('audio-to-text') private audioToTextQueue: Queue,
  ) {}

  async downloadAudioFile(bucket: string, fileId: string) {
    try {
      const { data, error } = await this.supabaseService.downloadFile({
        bucket,
        path: 'audio',
        fileName: `${fileId}.mp4`,
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

  async transcribeAudioFile(data: any, fileId: string) {
    try {
      return await this.openAiService.whisperAudioToText(data, `${fileId}.mp4`);
    } catch (error) {
      this.logger.error(
        `AUDIO_TO_TEXT_WORKER: Failed to transcribe file: fileId: ${fileId}, error: ${error.message}`,
      );
      throw error;
    }
  }

  async uploadTranscription(
    bucket: string,
    fileId: string,
    textData: string,
  ): Promise<void> {
    try {
      const textBuffer = Buffer.from(textData, 'utf-8');
      await this.supabaseService.uploadFile({
        bucket,
        path: `text/${fileId}.txt`,
        file: textBuffer,
      });
    } catch (error) {
      this.logger.error(
        `AUDIO_TO_TEXT_WORKER: Failed to upload transcription to Supabase: fileId: ${fileId}, error: ${error.message}`,
      );
      throw error;
    }
  }

  async uploadToPrisma(textUrl: string, youtubeId: string): Promise<any> {
    try {
      const prismaUpload = await this.prismaService.youtubeTextLink.create({
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
      return prismaUpload;
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
    // const youtubeBucket = this.configService.get('YOUTUBE_BUCKET'); // set this up at some point;
    const youtubeBucket = process.env.YOUTUBE_BUCKET;

    const data = await this.downloadAudioFile(youtubeBucket, fileId);
    const textData = await this.transcribeAudioFile(data, fileId);
    await this.uploadTranscription(youtubeBucket, fileId, textData.text);
    await this.uploadToPrisma(`${youtubeBucket}/text/${fileId}.txt`, fileId);
    this.logger.debug('Audio download completed');
  }
}
