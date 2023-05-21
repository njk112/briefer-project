import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { YoutubeService } from './youtube.service';
import {
  QueueJobDto,
  SummaryJobDto,
  TranscribeJobDto,
} from './dto/queue-jobs.dto';

@Controller('youtube')
export class YoutubeController {
  constructor(private youtubeService: YoutubeService) {}

  @Post('queue')
  async queueJobs(@Body(new ValidationPipe()) queueJobDto: QueueJobDto) {
    return await this.youtubeService.queueJobs(queueJobDto);
  }

  @Post('transcribe')
  async queueTranscribe(
    @Body(new ValidationPipe()) queueJobDto: TranscribeJobDto,
  ) {
    return await this.youtubeService.queueTranscribeJobs(queueJobDto);
  }

  @Post('summarise')
  async queueSummary(@Body(new ValidationPipe()) queueJobDto: SummaryJobDto) {
    return await this.youtubeService.queueSummariseJobs(queueJobDto);
  }
}
