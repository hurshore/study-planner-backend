import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class GenerateQuestionsDto {
  @ApiProperty({
    description: 'The course id to generate questions from',
    example: 3,
  })
  @IsNotEmpty()
  courseId: number;

  @ApiProperty({
    description: 'The number of questions to generate',
    example: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsNumber()
  @Min(1)
  @Max(20)
  numQuestions: number;
}
