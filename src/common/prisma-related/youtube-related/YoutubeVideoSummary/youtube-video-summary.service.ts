import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { PrismaException } from '../../exceptions/prisma.exceptions';

@Injectable()
export class YoutubeVideoSummaryService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(YoutubeVideoSummaryService.name);
  private handleError(error: any, data: any, entity: string, action: string) {
    const prismaException = new PrismaException(
      JSON.stringify(data),
      error.message,
      entity,
      action,
    );

    this.logger.error(prismaException);
    throw prismaException;
  }

  async createYoutubeVideoSummary(data: Prisma.YoutubeVideoSummaryCreateInput) {
    try {
      return this.prisma.youtubeVideoSummary.create({
        data,
      });
    } catch (error) {
      this.handleError(error, data, 'youtubeVideoSummary', 'create');
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
      this.handleError(
        error,
        youtubeVideoSummaryWhereUniqueInput,
        'youtubeVideoSummary',
        'get',
      );
    }
  }
}
