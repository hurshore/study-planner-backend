import { Injectable } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';
import { DEFAULT_OTP_DURATION } from './otp.constants';

@Injectable()
export class OtpService {
  constructor(
    private redisService: RedisService,
    private emailService: EmailService,
  ) {}

  generateOtp() {
    return Math.floor(1000 + Math.random() * 9000);
  }

  async sendOtp(email: string, duration = DEFAULT_OTP_DURATION) {
    try {
      await this.redisService.delete(email);
      const otp = this.generateOtp().toString();
      await this.redisService.set(email, otp, duration);

      // send email;
      await this.emailService.sendEmail({
        to: email,
        template: 'confirmation',
        subject: 'Study Planner Verification Code',
        context: { otp },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async verifyOtp(email: string, otp: string) {
    const code = await this.redisService.get(email);
    const isValid = code === otp;
    if (isValid) await this.deleteOtp(email);
    return isValid;
  }

  async deleteOtp(email: string) {
    await this.redisService.delete(email);
  }
}
