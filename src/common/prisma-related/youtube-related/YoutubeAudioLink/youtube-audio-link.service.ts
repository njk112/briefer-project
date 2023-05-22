import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { PrismaException } from '../../exceptions/prisma.exceptions';

@Injectable()
export class YoutubeAudioLinkService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(YoutubeAudioLinkService.name);

  async createYoutubeAudioLink(data: Prisma.YoutubeAudioLinkCreateInput) {
    try {
      return this.prisma.youtubeAudioLink.create({
        data,
      });
    } catch (error) {
      const prismaException = new PrismaException(
        JSON.stringify(data),
        error.message,
        'youtubeAudioLink',
        'create',
      );

      this.logger.error(prismaException);
      throw prismaException;
    }
  }
}
