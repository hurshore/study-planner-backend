import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'janedoe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "The otp sent to the user's email",
    example: '1234',
  })
  @IsNotEmpty()
  otp: string;
}
