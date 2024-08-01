import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheModule } from '@nestjs/cache-manager';

import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({
      store: redisStore,
      url: process.env.REDIS_URL,
      isGlobal: true,
    }),
    RedisModule,
  ],
  providers: [],
})
export class AppModule {}
