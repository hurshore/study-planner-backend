import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SigninDto {
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
}
