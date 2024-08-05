import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { QuestionGenerationService } from './question-generation.service';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';

@ApiTags('Question Generation')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('question-generation')
export class QuestionGenerationController {
  constructor(
    private readonly questionGenerationService: QuestionGenerationService,
  ) {}

  @ApiOperation({ summary: 'Generate multiple-choice questions' })
  @ApiCreatedResponse({ description: 'Questions successfully generated' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @Post('generate')
  async generateQuestions(
    @GetUser('id') userId: number,
    @Body() dto: GenerateQuestionsDto,
  ) {
    return this.questionGenerationService.generateQuestions(dto, userId);
  }
}
