import {
  Body,
  Controller,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { YoutubeService } from './youtube.service';
import {
  GeneratePdfDto,
  QueueJobDto,
  SendEmailDto,
  SummaryJobDto,
  TranscribeJobDto,
} from './dto/queue-jobs.dto';
import { AuthGuard } from './auth/auth.guard';

@Controller('youtube')
export class YoutubeController {
  constructor(private youtubeService: YoutubeService) {}

  @Post('queue')
  @UseGuards(AuthGuard)
  async queueJobs(@Body(new ValidationPipe()) queueJobDto: QueueJobDto) {
    return await this.youtubeService.queueJobs(queueJobDto);
  }

  @Post('transcribe')
  @UseGuards(AuthGuard)
  async queueTranscribe(
    @Body(new ValidationPipe()) queueJobDto: TranscribeJobDto,
  ) {
    return await this.youtubeService.queueTranscribeJobs(queueJobDto);
  }

  @Post('summarise')
  @UseGuards(AuthGuard)
  async queueSummary(@Body(new ValidationPipe()) queueJobDto: SummaryJobDto) {
    return await this.youtubeService.queueSummariseJobs(queueJobDto);
  }

  @Post('generate-pdf')
  @UseGuards(AuthGuard)
  async generatePdf(@Body(new ValidationPipe()) queueJobDto: GeneratePdfDto) {
    return await this.youtubeService.queueGeneratePdfJobs(queueJobDto);
  }

  @Post('send-email')
  @UseGuards(AuthGuard)
  async sendEmail(@Body(new ValidationPipe()) queueJobDto: SendEmailDto) {
    return await this.youtubeService.queueSendEmailJobs(queueJobDto);
  }
}
