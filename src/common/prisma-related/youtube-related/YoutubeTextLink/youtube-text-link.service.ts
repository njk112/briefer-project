import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { PrismaException } from '../../exceptions/prisma.exceptions';

@Injectable()
export class YoutubeTextLinkService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(YoutubeTextLinkService.name);

  async createYoutubeTextLink(data: Prisma.YoutubeTextLinkCreateInput) {
    try {
      return this.prisma.youtubeTextLink.create({
        data,
      });
    } catch (error) {
      const prismaException = new PrismaException(
        JSON.stringify(data),
        error.message,
        'youtubeTextLink',
        'create',
      );

      this.logger.error(prismaException);
      throw prismaException;
    }
  }
}
