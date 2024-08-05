import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  @ApiProperty({
    description: 'The ID of the question being answered',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  questionId: number;

  @ApiProperty({
    description: "The index of the user's selected answer (0-3)",
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  chosenAnswer: number;
}

export class CreateAssessmentDto {
  @ApiProperty({
    description:
      'The ID of the course for which the assessment is being submitted',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  courseId: number;

  @ApiProperty({
    description: 'An array of answers to the questions in the assessment',
    type: [AnswerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
