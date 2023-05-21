import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QueueJobDto, TranscribeJobDto } from './dto/queue-jobs.dto';

@Injectable()
export class YoutubeService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('youtube-audio') private audioQueue: Queue,
    @InjectQueue('audio-to-text') private transcribeQueue: Queue,
    @InjectQueue('text-summariser') private summariserQueue: Queue,
  ) {}

  async queueJobs(queueJobs: QueueJobDto) {
    const { urls, userId } = queueJobs;
    const jobs = urls.map((url) => ({
      name: 'download',
      data: { url, userId },
    }));
    const jobsQueue = await this.audioQueue.addBulk(jobs);

    return jobsQueue;
  }

  async queueTranscribeJobs(queueJob: TranscribeJobDto) {
    const { fileId, userId } = queueJob;
    const jobs = [{ name: 'transcribe', data: { fileId, userId } }];
    const jobsQueue = await this.transcribeQueue.addBulk(jobs);

    return jobsQueue;
  }

  async queueSummariseJobs(queueJob: TranscribeJobDto) {
    const { fileId, userId } = queueJob;
    const jobs = [{ name: 'summarise', data: { fileId, userId } }];
    const jobsQueue = await this.summariserQueue.addBulk(jobs);

    return jobsQueue;
  }
}
