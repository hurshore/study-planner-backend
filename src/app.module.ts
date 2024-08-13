import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheModule } from '@nestjs/cache-manager';

import { AuthModule } from './auth/auth.module';
import { OtpModule } from './otp/otp.module';
import { RedisModule } from './redis/redis.module';
import { EmailModule } from './email/email.module';
import { PrismaModule } from './prisma/prisma.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { QuestionModule } from './question/question.module';
import { AssessmentModule } from './assessment/assessment.module';
import { AIModule } from './ai/ai.module';
import { PlannerModule } from './planner/planner.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({
      store: redisStore,
      host: 'localhost',
      port: 6379,
      isGlobal: true,
    }),
    AuthModule,
    OtpModule,
    RedisModule,
    EmailModule,
    PrismaModule,
    FileUploadModule,
    QuestionModule,
    AssessmentModule,
    AIModule,
    PlannerModule,
  ],
  providers: [],
})
export class AppModule {}
