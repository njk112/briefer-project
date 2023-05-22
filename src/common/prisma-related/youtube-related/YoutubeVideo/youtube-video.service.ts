import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { PrismaException } from '../../exceptions/prisma.exceptions';

@Injectable()
export class YoutubeVideoService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(YoutubeVideoService.name);

  async createYoutubeVideo(data: Prisma.YoutubeVideoCreateInput) {
    try {
      return this.prisma.youtubeVideo.create({
        data,
      });
    } catch (error) {
      const prismaException = new PrismaException(
        JSON.stringify(data),
        error.message,
        'youtubeVideo',
        'create',
      );

      this.logger.error(prismaException);
      throw prismaException;
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
      const prismaException = new PrismaException(
        JSON.stringify(youtubeVideoWhereUniqueInput),
        error.message,
        'youtubeVideo',
        'get',
      );
      this.logger.error(prismaException);
      throw prismaException;
    }
  }
}
