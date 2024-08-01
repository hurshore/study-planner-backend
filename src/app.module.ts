import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheModule } from '@nestjs/cache-manager';

import { AuthModule } from './auth/auth.module';
import { OtpModule } from './otp/otp.module';
import { RedisModule } from './redis/redis.module';
import { EmailModule } from './email/email.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({
      store: redisStore,
      url: process.env.REDIS_URL,
      isGlobal: true,
    }),
    AuthModule,
    OtpModule,
    RedisModule,
    EmailModule,
    PrismaModule,
  ],
  providers: [],
})
export class AppModule {}
