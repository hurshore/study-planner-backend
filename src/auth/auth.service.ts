import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import * as argon from 'argon2';
import { OtpService } from 'src/otp/otp.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ResetPasswordDto,
  SendOtpDto,
  SigninDto,
  SignupDto,
  VerifyEmailDto,
} from './dto';
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

  async signin(dto: SigninDto) {
    const { user } = await this.verifyUserExists(dto.email);

    // compare password
    const pwMatches = await argon.verify(user.password, dto.password);

    // if password incorrect throw exception
    if (!pwMatches) {
      throw new BadRequestException(ResponseMessage.INCORRECT_CREDENTIALS);
    }
    if (!user.emailVerified) {
      throw new BadRequestException(ResponseMessage.EMAIL_UNVERIFIED);
    }

    const data = await this.returnUser(user);
    return { data, message: ResponseMessage.SIGNIN_SUCCESS };
  }

  async sendOtp(dto: SendOtpDto) {
    return this.otpService.sendOtp(dto.email);
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const { user } = await this.verifyUserExists(dto.email);
    if (user.emailVerified) {
      throw new BadRequestException(ResponseMessage.EMAIL_ALREADY_VERIFIED);
    }

    const isValid = await this.otpService.verifyOtp(dto.email, dto.otp);
    if (!isValid) {
      throw new BadRequestException(ResponseMessage.INVALID_OTP);
    }
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { emailVerified: true },
    });
  }

  async resetPassword(dto: ResetPasswordDto) {
    await this.verifyUserExists(dto.email);
    const isValid = await this.otpService.verifyOtp(dto.email, dto.otp);
    if (!isValid) throw new BadRequestException('Invalid OTP');

    const password = await argon.hash(dto.password);
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { password },
    });
    return { data: null, message: 'password reset successful' };
  }

  private async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = { sub: userId, email };
    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
      secret: secret,
    });

    return { access_token: token };
  }

  private async returnUser(user: User) {
    delete user.password;
    delete user.emailVerified;
    const token = (await this.signToken(user.id, user.email)).access_token;
    return { ...user, token };
  }

  private async userExists(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return { exists: !!user, user };
  }

  private async verifyUserExists(email: string) {
    const data = await this.userExists(email);
    if (!data.exists) {
      throw new BadRequestException(ResponseMessage.USER_NOT_FOUND);
    }
    return data;
  }
}
