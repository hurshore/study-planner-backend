import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ResponseMessage } from './assessment.constants';

@ApiTags('Assessment')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('assessments')
export class AssessmentController {
  constructor(private assessmentService: AssessmentService) {}

  @ApiOperation({ summary: 'Submit assessment answers' })
  @ApiBody({ type: CreateAssessmentDto })
  @ApiCreatedResponse({
    description: 'Assessment submitted successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        userId: { type: 'number' },
        courseId: { type: 'number' },
        score: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        answers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              questionId: { type: 'number' },
              userAnswer: { type: 'number' },
              isCorrect: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or course not found',
  })
  @Post()
  async submitAssessment(
    @Body() dto: CreateAssessmentDto,
    @GetUser('id') userId: number,
  ) {
    // TODO: determine whether to handle errors in the controller or service
    try {
      return await this.assessmentService.submitAssessment(dto, userId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(ResponseMessage.SUBMISSION_FAILED);
    }
  }

  @ApiOperation({ summary: 'Get assessment results' })
  @ApiParam({ name: 'id', type: 'number', description: 'Assessment ID' })
  @ApiOkResponse({
    description: 'Assessment results retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        userId: { type: 'number' },
        courseId: { type: 'number' },
        score: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        answers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              questionId: { type: 'number' },
              userAnswer: { type: 'number' },
              isCorrect: { type: 'boolean' },
              question: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  options: { type: 'array', items: { type: 'string' } },
                  answer: { type: 'number' },
                  topic: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Assessment not found',
  })
  @Get(':id')
  async getAssessmentResults(
    @Param('id', ParseIntPipe) assessmentId: number,
    @GetUser('id') userId: number,
  ) {
    // TODO: determine whether to handle errors in the controller or service
    try {
      return await this.assessmentService.getAssessmentResults(
        assessmentId,
        userId,
      );
    } catch (error) {
      console.error(error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(ResponseMessage.RETRIEVAL_FAILED);
    }
  }

  @ApiOperation({ summary: 'Generate suggestions' })
  @ApiParam({ name: 'id', type: 'number', description: 'Assessment ID' })
  @ApiOkResponse({ description: 'Suggestions generated successfully' })
  @ApiBadRequestResponse({
    description: 'Assessment not found or assessment already generated',
  })
  @Post(':id/suggestions')
  async generateSuggestions(
    @Param('id', ParseIntPipe) assessmentId: number,
    @GetUser('id') userId: number,
  ) {
    try {
      return await this.assessmentService.generateSuggestions(
        assessmentId,
        userId,
      );
    } catch (error) {
      console.error(error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(ResponseMessage.RETRIEVAL_FAILED);
    }
  }
}
