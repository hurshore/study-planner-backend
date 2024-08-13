import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { ResponseMessage } from './question.constants';
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
export class QuestionService {
  constructor(
    private prisma: PrismaService,
    private fileUploadService: FileUploadService,
    private aiService: AIService,
  ) {}

  async getQuestions(courseId: number, userId: number) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, userId: userId },
    });

    if (!course) {
      throw new NotFoundException(ResponseMessage.NO_COURSE);
    }

    return this.prisma.question.findMany({
      where: { courseId: course.id },
    });
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

    const existingQuestions = await this.prisma.question.findMany({
      where: { courseId: course.id },
    });

    if (existingQuestions.length > 0) {
      return existingQuestions;
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
        d. Avoid making the correct answer always the first option; randomize the order of options.
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
      const content = await this.aiService.getChatCompletion(prompt, 2048); // TODO: implement retry mechanism
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

      this.assignDifficulty(course.id); // TODO: implement retry mechanism

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
      const content = await this.aiService.getChatCompletion(prompt, 2048); // TODO: implement retry mechanism
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

  async assignDifficulty(courseId: number) {
    const questions = await this.prisma.question.findMany({
      where: { courseId },
    });

    if (questions.length === 0) {
      throw new NotFoundException(ResponseMessage.NO_QUESTIONS);
    }

    const questionList = questions.map((q) => ({
      question: q.question,
      options: q.options,
      answer: q.answer,
      topic: q.topic,
    }));

    const prompt = `You will be given a list of questions. Your task is to assign a difficulty level to each question on a scale of 1 to 5, where 1 is the easiest and 5 is the most difficult. Here's how to approach this task:

      1. First, you will receive a list of questions:
      <questions>
      ${JSON.stringify(questionList)}
      </questions>
      
      2. Read through all the questions carefully to get an understanding of the range of complexity and depth of knowledge required.
      
      3. For each question, follow these steps:
        a. Analyze the question's content, structure, and required knowledge.
        b. Consider the following factors when assigning a difficulty level:
            - Complexity of the concept being asked about
            - Amount of prior knowledge required
            - Number of steps or pieces of information needed to answer
            - Level of critical thinking or analysis required
            - Specificity or technicality of the subject matter
      
      4. Use the following guidelines for assigning difficulty levels:
        - Level 1: Basic recall of simple facts or concepts. Straightforward questions with obvious answers.
        - Level 2: Understanding of fundamental concepts. May require simple application of knowledge.
        - Level 3: Application of knowledge to new situations. May involve comparing or contrasting ideas.
        - Level 4: Analysis and synthesis of information. Requires deeper understanding and critical thinking.
        - Level 5: Complex problem-solving, evaluation of multiple factors, or highly specialized knowledge.
      
      5. Your output should be in the following format:
        <difficulty_levels>
        [Question 1 (exact text as given)]: [Difficulty Level]
        [Question 2 (exact text as given)]: [Difficulty Level]
        ...
        </difficulty_levels>
      
      6. Here's an example of how your output might look:
        <example>
        <difficulty_levels>
        What is the capital of France?: 1
        Explain the process of photosynthesis in plants: 3
        Analyze the impacts of the Industrial Revolution on modern society: 4
        Describe the fundamental principles of quantum mechanics: 5
        </difficulty_levels>
        </example>
      
      7. Consider the target audience or educational level when assigning difficulty. A question that might be level 3 for a high school student could be level 1 for a university student in that field.
      
      8. Be consistent in your difficulty assignments. Questions of similar complexity should receive the same difficulty level.
      
      9. After processing all questions, provide your final output with all questions and their assigned difficulty levels. Ensure each question has exactly one difficulty level assigned.
      
      Begin your analysis now and present your final output of questions with their assigned difficulty levels.
    `;

    try {
      const content = await this.aiService.getChatCompletion(prompt, 2048); // TODO: implement retry mechanism
      const regex = /<difficulty_levels>\s*([\s\S]*?)\s*<\/difficulty_levels>/g;

      const difficultyLevels = [...content.matchAll(regex)].map((match) => {
        const [, content] = match;
        return content
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => {
            const [question, level] = line.split(':').map((s) => s.trim());
            return { question, level: parseInt(level) };
          });
      });

      const questionMap = questions.reduce((map, q) => {
        map[q.question] = q.id;
        return map;
      }, {});

      const difficultyLevelsMap = difficultyLevels.reduce((map, levels) => {
        levels.forEach((level) => {
          const questionId = questionMap[level.question];
          map[questionId] = level.level;
        });
        return map;
      }, {});

      const updatePromises = Object.entries(difficultyLevelsMap).map(
        ([id, difficultyLevel]) =>
          this.prisma.question.updateMany({
            where: {
              id: parseInt(id),
            },
            data: {
              difficultyLevel,
            },
          }),
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error(ResponseMessage.DIFFICULTY_ASSIGNMENT_FAILED, error);
      throw new BadRequestException(
        ResponseMessage.DIFFICULTY_ASSIGNMENT_FAILED,
      );
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
