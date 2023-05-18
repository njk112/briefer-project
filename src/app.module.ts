import { Module, Logger } from '@nestjs/common';
import { CatsModule } from './youtube/youtube.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule, loggingMiddleware } from 'nestjs-prisma';

import config from './common/configs/config';
import { BullModule } from '@nestjs/bull';

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
    BullModule.forRoot({
      redis: process.env.REDIS_URL,
    }),
    CatsModule,
  ],
})
export class AppModule {}
