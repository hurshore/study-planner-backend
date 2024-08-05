import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { ResponseMessage } from './question-generation.constants';

type GeneratedQuestion = {
  question: string;
  options: [string, string, string, string];
  correctAnswer: '0' | '1' | '2' | '3';
  topic: string;
};

@Injectable()
export class QuestionGenerationService {
  private openaiClient: OpenAIClient;

  constructor(
    private prisma: PrismaService,
    private fileUploadService: FileUploadService,
  ) {
    this.openaiClient = new OpenAIClient(
      process.env.AZURE_OPENAI_ENDPOINT,
      new AzureKeyCredential(process.env.AZURE_OPENAI_KEY),
    );
  }

  async generateQuestions(
    dto: GenerateQuestionsDto,
    userId: number,
  ): Promise<any> {
    const course = await this.prisma.course.findFirst({
      where: { id: dto.courseId, userId: userId },
    });

    if (!course) {
      throw new NotFoundException(ResponseMessage.NO_COURSE);
    }

    const courseContent = await this.fileUploadService.extractTextFromPdf(
      course.fileName,
    );

    const prompt = `You are tasked with generating multiple-choice questions based on the following course material:
      <course_material>
      ${courseContent}
      </course_material>
      Your goal is to create ${dto.numQuestions} multiple-choice questions, each with four options containing one correct answer and three distractors. Follow these guidelines:
      1. Carefully read and analyze the course material.
      2. Identify key concepts, facts, and ideas that would be suitable for multiple-choice questions.
      3. For each question:
        a. Formulate a clear and concise question stem.
        b. Create one correct answer and three plausible distractors.
        c. Ensure that the distractors are high-quality and not easily distinguishable from the correct answer.
        d. Assign a relevant topic to the question based on the course material.
      4. Format your output as a JSON array of objects, where each object represents a question and has the following structure:
        {
          "question": "Question stem goes here",
          "options": [
            "Option A",
            "Option B",
            "Option C",
            "Option D"
          ],
          "correctAnswer": "Index of the correct answer (0-3)",
          "topic": "Relevant topic from the course material"
        }
      5. Generate exactly ${dto.numQuestions} questions.
      6. After generating the questions, review your output to ensure:
        - Questions are clear and unambiguous
        - Distractors are plausible and of high quality
        - Topics are accurately assigned
        - The JSON format is correct and valid
      Present your final output within <json_output> tags. Do not include any explanations or additional text outside of these tags.
    `;

    try {
      const response = await this.openaiClient.getChatCompletions(
        process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        [{ role: 'user', content: prompt }],
        { temperature: 0.7, maxTokens: 2048 },
      );

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/<json_output>([\s\S]*)<\/json_output>/);

      if (!jsonMatch) {
        throw new BadRequestException(ResponseMessage.GENERATION_FAILED);
      }

      const genratedQuestions: GeneratedQuestion[] = JSON.parse(jsonMatch[1]);
      await this.prisma.question.createMany({
        data: genratedQuestions.map((q) => ({
          courseId: course.id,
          question: q.question,
          options: q.options,
          answer: parseInt(q.correctAnswer),
          topic: q.topic,
        })),
      });

      const insertedQuestios = await this.prisma.question.findMany({
        where: { courseId: course.id },
      });

      return insertedQuestios;
    } catch (error) {
      throw new BadRequestException(ResponseMessage.GENERATION_FAILED);
    }
  }
}
