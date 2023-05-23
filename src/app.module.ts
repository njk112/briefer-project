import { Module, Logger } from '@nestjs/common';
import { YoutubeModule } from './youtube/youtube.module';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Make sure to import ConfigService
import { PrismaModule, loggingMiddleware } from 'nestjs-prisma';

import config from './common/configs/config';
import { BullModule } from '@nestjs/bull';
import { RedisConfig } from './common/configs/config.interface';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        middlewares: [
          loggingMiddleware({
            logger: new Logger('PrismaMiddleware'),
            logLevel: 'log',
          }),
        ],
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<RedisConfig>('redis').redisHost,
          port: configService.get<RedisConfig>('redis').redisPort,
          password: configService.get<RedisConfig>('redis').redisPassword,
          tls: {},
        },
      }),
      inject: [ConfigService],
    }),
    YoutubeModule,
  ],
})
export class AppModule {}
