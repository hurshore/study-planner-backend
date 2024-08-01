import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'janedoe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'The password of the user', example: 'password' })
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: "The otp sent to the user's email",
    example: '1234',
  })
  @IsNotEmpty()
  otp: string;
}
