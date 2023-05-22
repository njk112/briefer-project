import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { PrismaException } from '../../exceptions/prisma.exceptions';

@Injectable()
export class YoutubeVideoSummaryService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(YoutubeVideoSummaryService.name);

  async createYoutubeVideoSummary(data: Prisma.YoutubeVideoSummaryCreateInput) {
    try {
      return this.prisma.youtubeVideoSummary.create({
        data,
      });
    } catch (error) {
      const prismaException = new PrismaException(
        JSON.stringify(data),
        error.message,
        'youtubeVideoSummary',
        'create',
      );

      this.logger.error(prismaException);
      throw prismaException;
    }
  }

  async getYoutubeVideoSummary(
    youtubeVideoSummaryWhereUniqueInput: Prisma.YoutubeVideoSummaryWhereUniqueInput,
  ) {
    try {
      return this.prisma.youtubeVideoSummary.findUnique({
        where: youtubeVideoSummaryWhereUniqueInput,
      });
    } catch (error) {
      const prismaException = new PrismaException(
        JSON.stringify(youtubeVideoSummaryWhereUniqueInput),
        error.message,
        'youtubeVideoSummary',
        'get',
      );
      this.logger.error(prismaException);
      throw prismaException;
    }
  }
}
