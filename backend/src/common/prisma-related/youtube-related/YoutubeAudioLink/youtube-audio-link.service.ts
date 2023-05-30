import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { PrismaException } from '../../exceptions/prisma.exceptions';

@Injectable()
export class YoutubeAudioLinkService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(YoutubeAudioLinkService.name);
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

  async createYoutubeAudioLink(data: Prisma.YoutubeAudioLinkCreateInput) {
    try {
      return this.prisma.youtubeAudioLink.create({
        data,
      });
    } catch (error) {
      this.handleError(error, data, 'youtubeAudioLink', 'create');
    }
  }
}
