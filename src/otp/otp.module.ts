import { Global, Module } from '@nestjs/common';
import { RedisModule } from 'src/redis/redis.module';
import { OtpService } from './otp.service';

@Global()
@Module({
  providers: [OtpService],
  imports: [RedisModule],
  exports: [OtpService],
})
export class OtpModule {}
