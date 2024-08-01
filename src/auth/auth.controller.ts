import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  ResetPasswordDto,
  SendOtpDto,
  SigninDto,
  SignupDto,
  VerifyEmailDto,
} from './dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Create user' })
  @ApiCreatedResponse({ description: 'User successfully created' })
  @ApiBadRequestResponse({ status: 400, description: 'Bad request.' })
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @ApiOperation({ summary: 'Sign in user' })
  @ApiOkResponse({ description: 'User successfully signed in' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }

  @ApiOperation({ summary: 'Send OTP' })
  @ApiOkResponse({ description: 'OTP sent successfully' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @HttpCode(HttpStatus.OK)
  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @ApiOperation({ summary: 'Verify email' })
  @ApiOkResponse({ description: 'Email successfully verified' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @ApiOperation({ summary: 'Reset password' })
  @ApiOkResponse({ description: 'Password successfully reset' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
