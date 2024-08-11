import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';

@ApiTags('Question')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('question')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @ApiOperation({ summary: 'Generate multiple-choice questions' })
  @ApiCreatedResponse({ description: 'Questions successfully generated' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @Post('generate')
  async generateQuestions(
    @GetUser('id') userId: number,
    @Body() dto: GenerateQuestionsDto,
  ) {
    return this.questionService.generateQuestions(dto, userId);
  }

  @ApiOperation({ summary: 'Get all questions' })
  @ApiOkResponse({ description: 'Questions successfully retrieved' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @Get(':courseId')
  async getQuestions(
    @Param('courseId', ParseIntPipe) courseId: number,
    @GetUser('id') userId: number,
  ) {
    return this.questionService.getQuestions(courseId, userId);
  }
}
