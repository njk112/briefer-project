import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  GeneratePdfDto,
  QueueJobDto,
  SendEmailDto,
  TranscribeJobDto,
} from './dto/queue-jobs.dto';

@Injectable()
export class YoutubeService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('youtube-audio') private audioQueue: Queue,
    @InjectQueue('audio-to-text') private transcribeQueue: Queue,
    @InjectQueue('text-summariser') private summariserQueue: Queue,
    @InjectQueue('pdf-generator') private pdfGeneratorQueue: Queue,
    @InjectQueue('email-sender') private emailSenderQueue: Queue,
  ) {}

  private readonly logger = new Logger(YoutubeService.name);

  async createUser(userEmail: string) {
    this.logger.debug(`Creating user: ${userEmail}`);
    const user = await this.prisma.user.create({
      data: {
        email: userEmail,
      },
    });
    return user;
  }

  async getUser(userEmail: string) {
    this.logger.debug(`Getting user: ${userEmail}`);
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });
    return user;
  }

  async createBriefingOrder(userId: string, totalVideos: number) {
    this.logger.debug(`Creating briefing order: ${userId}`);
    const briefingOrder = await this.prisma.userBriefingOrder.create({
      data: {
        totalVideos,
        userId: userId,
      },
    });
    return briefingOrder;
  }

  async queueJobs(queueJobs: QueueJobDto) {
    const { urls, userEmail } = queueJobs;

    let user = await this.getUser(userEmail);
    if (!user) user = await this.createUser(userEmail);
    const briefingOrder = await this.createBriefingOrder(user.id, urls.length);

    const jobs = urls.map((url) => ({
      name: 'download',
      data: { url, userId: user.id, briefingOrderId: briefingOrder.id },
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

  async queueGeneratePdfJobs(queueJob: GeneratePdfDto) {
    const { fileIds, userId } = queueJob;
    const jobs = [{ name: 'generatePdf', data: { fileIds, userId } }];
    const jobsQueue = await this.pdfGeneratorQueue.addBulk(jobs);

    return jobsQueue;
  }

  async queueSendEmailJobs(queueJob: SendEmailDto) {
    const { fileId, userId } = queueJob;
    const jobs = [{ name: 'sendEmail', data: { fileId, userId } }];
    const jobsQueue = await this.emailSenderQueue.addBulk(jobs);

    return jobsQueue;
  }
}
