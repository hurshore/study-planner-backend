import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { ResponseMessage } from './question-generation.constants';
import { AIService } from 'src/ai/ai.service';

type GeneratedQuestion = {
  question: string;
  options: [string, string, string, string];
  correctAnswer: '0' | '1' | '2' | '3';
};

type Topic = {
  name: string;
  questions: string[];
};

@Injectable()
export class QuestionGenerationService {
  constructor(
    private prisma: PrismaService,
    private fileUploadService: FileUploadService,
    private aiService: AIService,
  ) {}

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
        }
      5. Generate exactly ${dto.numQuestions} questions.
      6. After generating the questions, review your output to ensure:
        - Questions are clear and unambiguous
        - Distractors are plausible and of high quality
        - The JSON format is correct and valid
      Present your final output within <json_output> tags. Do not include any explanations or additional text outside of these tags.
    `;

    try {
      const content = await this.aiService.getChatCompletion(prompt, 2048);
      const jsonMatch = content.match(/<json_output>([\s\S]*)<\/json_output>/);

      if (!jsonMatch) {
        throw new BadRequestException(ResponseMessage.GENERATION_FAILED);
      }

      const generatedQuestions: GeneratedQuestion[] = JSON.parse(jsonMatch[1]);
      const generatedTopics = await this.generateTopics(generatedQuestions);
      const questionsWithTopics = await this.assignTopics(
        generatedQuestions,
        generatedTopics,
      );

      await this.prisma.question.createMany({
        data: questionsWithTopics.map((q) => ({
          ...q,
          courseId: course.id,
          answer: parseInt(q.answer),
        })),
      });

      const insertedQuestions = await this.prisma.question.findMany({
        where: { courseId: course.id },
      });

      return insertedQuestions;
    } catch (error) {
      console.error(ResponseMessage.GENERATION_FAILED, error);
      throw new BadRequestException(ResponseMessage.GENERATION_FAILED);
    }
  }

  private async generateTopics(
    questions: GeneratedQuestion[],
  ): Promise<Topic[]> {
    const questionList = questions.map((q) => ({
      question: q.question,
      options: q.options,
    }));

    const questionListJson = JSON.stringify(questionList, null, 2);

    const prompt = `You will be given a list of questions. Your task is to generate topics for these questions, ensuring that similar questions are grouped under the same topic. Here's how to approach this task:
      1. First, you will receive a list of questions:

      <questions>
      ${questionListJson}
      </questions>

      2. Read through all the questions carefully to get an understanding of the range of subjects covered.

      3. For each question, follow these steps:
        a. Identify the main subject or theme of the question.
        b. Check if this theme is similar to any topics you've already created.
        c. If it's similar to an existing topic, assign the question to that topic.
        d. If it's a new theme, create a new topic and assign the question to it.

      4. Your output should be in the following format:
        <topic>
        [Topic Name]
        - [Question 1]
        - [Question 2]
        ...
        </topic>

      5. When determining if a new question fits an existing topic:
        - Look for key words or concepts that are shared between the questions.
        - Consider if the questions could be answered using similar information or expertise.
        - If in doubt, err on the side of creating a new topic rather than forcing a question into an ill-fitting category.

      6. Here's an example of how your output might look:

      <example>
      <topic>
      Environmental Science
      - What are the main causes of deforestation?
      - How does climate change affect biodiversity?
      - What strategies can be implemented to reduce air pollution in cities?
      </topic>

      <topic>
      World History
      - Who were the key figures in the French Revolution?
      - What were the main causes of World War I?
      - How did the Industrial Revolution change society in the 19th century?
      </topic>
      </example>

      7. After processing all questions, provide your final output with all topics and their associated questions. Make sure each question is assigned to exactly one topic.

      Begin your analysis now and present your final output of topics and questions.
    `;

    try {
      const content = await this.aiService.getChatCompletion(prompt, 2048);
      const regex = /<topic>\s*([\s\S]*?)\s*<\/topic>/g;

      const topics = [...content.matchAll(regex)].map((match) => {
        const [, content] = match;
        const [name, ...questions] = content
          .split('\n')
          .filter((line) => line.trim());
        return {
          name,
          questions: questions.map((q) => q.replace(/^-\s*/, '').trim()),
        };
      });

      return topics;
    } catch (error) {
      console.error(ResponseMessage.TOPIC_GENERATION_FAILED);
      throw new BadRequestException(ResponseMessage.TOPIC_GENERATION_FAILED);
    }
  }

  private assignTopics(questions: GeneratedQuestion[], topics: Topic[]) {
    const questionsWithTopics = questions.map(function (q) {
      const topic = topics.find((t) => t.questions.includes(q.question))?.name;
      return {
        question: q.question,
        options: q.options,
        answer: q.correctAnswer,
        topic,
      };
    });

    return questionsWithTopics;
  }
}
