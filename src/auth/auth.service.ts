import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as argon from 'argon2';
import { OtpService } from 'src/otp/otp.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignupDto } from './dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { ResponseMessage } from './auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private otpService: OtpService,
  ) {}

  async signup(dto: SignupDto) {
    // generate the password hash
    const hash = await argon.hash(dto.password);
    try {
      const data = { ...dto, password: hash };
      const user = await this.prisma.user.create({ data });
      this.sendOtp({ email: dto.email });

      return {
        data: user,
        message: ResponseMessage.SIGNUP_SUCCESS,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new BadRequestException(ResponseMessage.ACCOUNT_EXISTS);
        }
      }
      throw e;
    }
  }

  private async sendOtp(dto: SendOtpDto) {
    return this.otpService.sendOtp(dto.email);
  }
}
