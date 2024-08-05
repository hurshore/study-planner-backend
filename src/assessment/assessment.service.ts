import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { ResponseMessage } from './assessment.constants';

@Injectable()
export class AssessmentService {
  constructor(private prisma: PrismaService) {}

  async submitAssessment(
    dto: CreateAssessmentDto,
    userId: number,
  ): Promise<any> {
    return this.prisma.$transaction(async (prisma) => {
      const course = await prisma.course.findFirst({
        where: { id: dto.courseId, userId: userId },
        include: { Question: true },
      });

      if (!course) {
        throw new NotFoundException(ResponseMessage.NO_COURSE);
      }

      if (dto.answers.length > course.Question.length) {
        throw new BadRequestException(ResponseMessage.TOO_MANY_ANSWERS);
      }

      let correctAnswers = 0;
      const answerData = [];

      for (const answer of dto.answers) {
        const question = course.Question.find(
          (q) => q.id === answer.questionId,
        );
        if (!question) {
          throw new BadRequestException(ResponseMessage.INVALID_QUESTION);
        }

        const isCorrect = question.answer === answer.chosenAnswer;
        if (isCorrect) {
          correctAnswers++;
        }

        answerData.push({
          questionId: answer.questionId,
          chosenAnswer: answer.chosenAnswer,
          isCorrect,
        });
      }

      const assessment = await prisma.assessment.create({
        data: {
          userId: userId,
          courseId: dto.courseId,
          score: correctAnswers,
          total: course.Question.length,
          answers: {
            create: answerData,
          },
        },
      });

      return { data: assessment, message: ResponseMessage.SUBMISSION_SUCCESS };
    });
  }

  async getAssessmentResults(
    assessmentId: number,
    userId: number,
  ): Promise<any> {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, userId: userId },
      include: {
        answers: {
          include: {
            question: {
              select: {
                question: true,
                options: true,
                answer: true,
                topic: true,
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(ResponseMessage.NO_ASSESSMENT);
    }

    return assessment;
  }
}
