import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QueueJobDto } from './dto/queue-jobs.dto';

@Injectable()
export class YoutubeService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('youtube-audio') private audioQueue: Queue,
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
}
