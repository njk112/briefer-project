import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { YoutubeService } from './youtube.service';
import { QueueJobDto } from './dto/queue-jobs.dto';

@Controller('youtube')
export class YoutubeController {
  constructor(private youtubeService: YoutubeService) {}

  @Post('queue')
  async queueJobs(@Body(new ValidationPipe()) queueJobDto: QueueJobDto) {
    return await this.youtubeService.queueJobs(queueJobDto);
  }
}
