import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { ResponseMessage } from './assessment.constants';
import { AIService } from 'src/ai/ai.service';

@Injectable()
export class AssessmentService {
  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
  ) {}

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

  async generateSuggestions(
    assessmentId: number,
    userId: number,
  ): Promise<any> {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId },
      include: {
        answers: true,
        course: {
          select: {
            id: true,
            Question: {
              select: {
                id: true,
                question: true,
                options: true,
                answer: true,
                topic: true,
                difficultyLevel: true,
              },
            },
          },
        },
      },
    });

    if (assessment.userId !== userId) {
      throw new BadRequestException(ResponseMessage.NOT_AUTHORIZED);
    }

    if (!assessment) {
      throw new NotFoundException(ResponseMessage.NO_ASSESSMENT);
    }

    if (
      assessment.suggestions.length > 0 &&
      assessment.strengths.length > 0 &&
      assessment.weaknesses.length > 0
    ) {
      throw new BadRequestException(
        ResponseMessage.SUGGESTIONS_ALREADY_GENERATED,
      );
    }

    const questions = assessment.course.Question.map((q) => q.question);

    const studentAnswers = assessment.answers.map((a) => ({
      questionId: a.questionId,
      userAnswer: a.chosenAnswer,
      isCorrect: a.isCorrect,
    }));

    const correctAnswers = assessment.course.Question.map((q) => ({
      questionId: q.id,
      answer: q.answer,
    }));

    const difficultyLevels = assessment.course.Question.map((q) => ({
      questionId: q.id,
      difficultyLevel: q.difficultyLevel,
    }));

    const prompt = `You are an AI assistant tasked with analyzing a student's performance on a set of questions. You will be provided with the questions, the student's answers, the correct answers, and the difficulty levels of the questions. Your goal is to identify the student's strengths and weaknesses by focusing on the overall topics or subject areas, and provide suggestions for improvement.

      Here are the questions:
      <questions>
      ${JSON.stringify(questions)}
      </questions>
      
      Here are the student's answers:
      <student_answers>
      ${JSON.stringify(studentAnswers)}
      </student_answers>
      
      Here are the correct answers:
      <correct_answers>
      ${JSON.stringify(correctAnswers)}
      </correct_answers>
      
      Here are the difficulty levels of the questions (on a scale of 1 to 5):
      <difficulty_levels>
      ${JSON.stringify(difficultyLevels)}
      </difficulty_levels>
      
      Compare the student's answers to the correct answers. Keep track of which questions the student answered correctly and incorrectly, considering the difficulty levels of those questions. However, focus your analysis on identifying strengths and weaknesses based on the overall topics or subject areas rather than individual questions.
      
      Based on your comparison, analyze the student's performance to identify their strengths and weaknesses in the broader context of topics or subject areas. Consider the following:
      
      1. Which topics or subject areas did the student perform well in, particularly on higher-difficulty questions?
      2. Which topics or subject areas did the student struggle with, especially on lower-difficulty questions?
      3. Are there any patterns in the types of questions the student got right or wrong, especially in relation to their difficulty levels?
      Prepare a list of topics where the student showed strength and topics where they showed weakness. Highlight if the student succeeded in more difficult questions or struggled with easier ones.
      
      Then, provide suggestions for improvement. For each suggestion:
      
      1. Provide a brief title for the suggestion (e.g., "Master the fundamentals of algebra")
      2. Under each title, provide 2-3 specific, actionable tips that could help the student improve in that area
      Present your analysis and suggestions in the following format:
      
      <analysis>
      <strengths>
      [List the topics or areas where the student performed well, with consideration of the difficulty levels]
      </strengths>
      <weaknesses>
      [List the topics or areas where the student needs improvement, taking into account the difficulty levels]
      </weaknesses>
      <suggestions>
      <suggestion>
      <title>[Brief title for the suggestion]</title>
      <tips>
      - [Specific tip 1]
      - [Specific tip 2]
      - [Specific tip 3 (if applicable)]
      </tips>
      </suggestion>
      [Repeat the suggestion structure for each area of improvement]
      </suggestions>
      </analysis>
      Ensure that your analysis is constructive and encouraging. Focus on providing actionable advice that can help the student improve their performance in future assessments.
    `;

    const response = await this.aiService.getChatCompletion(prompt);

    const extractTitles = (text: string): string[] =>
      text
        .trim()
        .split('\n')
        .map((item) => item.match(/-\s\*\*(.*?)\*\*/)?.[1]?.replace(/:$/, ''))
        .filter(Boolean);

    let remainingText = response;

    // extract strengths
    const strengthsRegex =
      /<strengths>\s*((?:(?!<\/strengths>)[\s\S])*)\s*<\/strengths>/;
    const strengthsMatch = remainingText.match(strengthsRegex);
    const strengths = strengthsMatch ? extractTitles(strengthsMatch[1]) : [];
    remainingText = remainingText.replace(strengthsRegex, '');

    // extract weaknesses
    const weaknessesRegex =
      /<weaknesses>\s*((?:(?!<\/weaknesses>)[\s\S])*)\s*<\/weaknesses>/;
    const weaknessesMatch = remainingText.match(weaknessesRegex);
    const weaknesses = weaknessesMatch ? extractTitles(weaknessesMatch[1]) : [];
    remainingText = remainingText.replace(weaknessesRegex, '');

    // extract suggestions
    const suggestionsRegex =
      /<suggestion>\s*<title>((?:(?!<\/title>).*?))<\/title>[\s\S]*?<\/suggestion>/g;
    const suggestionsMatch: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = suggestionsRegex.exec(remainingText)) !== null) {
      suggestionsMatch.push(match[1]);
    }

    return this.prisma.assessment.update({
      where: { id: assessmentId },
      data: { strengths, weaknesses, suggestions: suggestionsMatch },
    });
  }
}
