import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'janedoe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
