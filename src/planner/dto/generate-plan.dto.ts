import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';

export class GeneratePlanDto {
  @ApiProperty({
    description:
      'The ID of the assessment for which the plan is being generated',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  assessmentId: number;

  @ApiProperty({
    description: 'The study goals for the plan',
    example: ['Improve vocabulary', 'Practice reading comprehension'],
  })
  @IsNotEmpty()
  @IsArray()
  studyGoals: string[];

  @ApiProperty({
    description: 'The start date of the plan',
    example: '2022-01-01',
  })
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'The end date of the plan',
    example: '2022-01-31',
  })
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({
    description: 'The total study hours per week',
    example: 10,
  })
  @IsNumber()
  @IsNotEmpty()
  weeklyHours: number;

  @ApiProperty({
    description: 'The list of days of the week on which the user is available',
    example: ['Monday', 'Wednesday', 'Friday'],
  })
  @IsNotEmpty()
  @IsArray()
  availableDays: string[];
}
