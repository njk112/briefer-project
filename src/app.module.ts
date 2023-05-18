import { Module, Logger } from '@nestjs/common';
import { CatsModule } from './youtube/youtube.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule, loggingMiddleware } from 'nestjs-prisma';

import config from './common/configs/config';
import { BullModule } from '@nestjs/bull';
import { Redis } from 'ioredis';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        middlewares: [
          // configure your prisma middleware
          loggingMiddleware({
            logger: new Logger('PrismaMiddleware'),
            logLevel: 'log',
          }),
        ],
      },
    }),
    // upstash for some reason does not want to play along, so we use it this way
    BullModule.forRoot({ redis: new Redis(process.env.REDIS_URL) as any }),
    CatsModule,
  ],
})
export class AppModule {}
