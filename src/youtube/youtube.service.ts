import { UserBriefingOrderService } from '../common/prisma-related/user-related/UserBriefingOrder/user-briefing-order.service';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  GeneratePdfDto,
  QueueJobDto,
  SendEmailDto,
  TranscribeJobDto,
} from './dto/queue-jobs.dto';
import { UserService } from 'src/common/prisma-related/user-related/User/user.service';

@Injectable()
export class YoutubeService {
  constructor(
    private userService: UserService,
    private userBriefingOrderService: UserBriefingOrderService,
    @InjectQueue('youtube-audio') private audioQueue: Queue,
    @InjectQueue('audio-to-text') private transcribeQueue: Queue,
    @InjectQueue('text-summariser') private summariserQueue: Queue,
    @InjectQueue('pdf-generator') private pdfGeneratorQueue: Queue,
    @InjectQueue('email-sender') private emailSenderQueue: Queue,
  ) {}

  private readonly logger = new Logger(YoutubeService.name);

  async queueJobs(queueJobs: QueueJobDto) {
    this.logger.debug(`Queueing jobs: ${JSON.stringify(queueJobs)}`);
    const { urls, userEmail } = queueJobs;

    let user = await this.userService.getUser({ email: userEmail });

    if (!user) {
      user = await this.userService.createUser({ email: userEmail });
    }

    const briefingOder =
      await this.userBriefingOrderService.createUserBriefingOrder({
        totalVideos: urls.length,
        User: {
          connect: { id: user.id },
        },
      });

    const jobs = urls.map((url) => ({
      name: 'download',
      data: { url, userId: user.id, briefingOrderId: briefingOder.id },
    }));

    const jobsQueue = await this.audioQueue.addBulk(jobs);

    this.logger.debug(`Jobs queued: ${JSON.stringify(jobsQueue)}`);
    return jobsQueue;
  }

  async queueTranscribeJobs(queueJob: TranscribeJobDto) {
    throw new ForbiddenException('Used for testing only');
    const { fileId, userId } = queueJob;
    const jobs = [{ name: 'transcribe', data: { fileId, userId } }];
    const jobsQueue = await this.transcribeQueue.addBulk(jobs);

    return jobsQueue;
  }

  async queueSummariseJobs(queueJob: TranscribeJobDto) {
    throw new ForbiddenException('Used for testing only');
    const { fileId, userId } = queueJob;
    const jobs = [{ name: 'summarise', data: { fileId, userId } }];
    const jobsQueue = await this.summariserQueue.addBulk(jobs);

    return jobsQueue;
  }

  async queueGeneratePdfJobs(queueJob: GeneratePdfDto) {
    throw new ForbiddenException('Used for testing only');
    const { fileIds, userId } = queueJob;
    const jobs = [{ name: 'generatePdf', data: { fileIds, userId } }];
    const jobsQueue = await this.pdfGeneratorQueue.addBulk(jobs);

    return jobsQueue;
  }

  async queueSendEmailJobs(queueJob: SendEmailDto) {
    throw new ForbiddenException('Used for testing only');
    const { fileId, userId } = queueJob;
    const jobs = [{ name: 'sendEmail', data: { fileId, userId } }];
    const jobsQueue = await this.emailSenderQueue.addBulk(jobs);

    return jobsQueue;
  }
}
