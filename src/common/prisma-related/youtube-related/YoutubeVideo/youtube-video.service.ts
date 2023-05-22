import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { PrismaException } from '../../exceptions/prisma.exceptions';

@Injectable()
export class YoutubeVideoService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(YoutubeVideoService.name);
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

  async createYoutubeVideo(data: Prisma.YoutubeVideoCreateInput) {
    try {
      return this.prisma.youtubeVideo.create({
        data,
      });
    } catch (error) {
      this.handleError(error, data, 'youtubeVideo', 'create');
    }
  }

  async getYoutubeVideo(
    youtubeVideoWhereUniqueInput: Prisma.YoutubeVideoWhereUniqueInput,
    selectFieldsInput?: Prisma.YoutubeVideoSelect,
  ) {
    try {
      return this.prisma.youtubeVideo.findUnique({
        where: youtubeVideoWhereUniqueInput,
        select: selectFieldsInput,
      });
    } catch (error) {
      this.handleError(
        error,
        youtubeVideoWhereUniqueInput,
        'youtubeVideo',
        'get',
      );
    }
  }
}
