import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { PrismaException } from '../../exceptions/prisma.exceptions';

@Injectable()
export class YoutubeTextLinkService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(YoutubeTextLinkService.name);
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

  async createYoutubeTextLink(data: Prisma.YoutubeTextLinkCreateInput) {
    try {
      return this.prisma.youtubeTextLink.create({
        data,
      });
    } catch (error) {
      this.handleError(error, data, 'youtubeTextLink', 'create');
    }
  }
}
