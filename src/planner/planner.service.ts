import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AIService } from 'src/ai/ai.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseMessage } from './planner.constants';
import { GeneratePlanDto } from './dto/generate-plan.dto';

@Injectable()
export class PlannerService {
  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
  ) {}

  async generatePlan(dto: GeneratePlanDto, userId: number): Promise<any> {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: dto.assessmentId, userId: userId },
    });

    if (!assessment) {
      throw new NotFoundException(ResponseMessage.NO_ASSESSMENT);
    }

    if (assessment.userId !== userId) {
      throw new ForbiddenException(ResponseMessage.FORBIDDEN);
    }

    const studyPlan = await this.prisma.plan.findFirst({
      where: { assessmentId: dto.assessmentId },
    });

    if (studyPlan) {
      const data = this.extractStudyPlanInfo(studyPlan.plan);
      return {
        data: {
          ...data,
          startDate: studyPlan.startDate,
          endDate: studyPlan.endDate,
        },
        message: ResponseMessage.PLAN_EXISTS,
      }; // TODO: determine whether to return the data or throw an error
    }

    const assessmentData = {
      strengths: assessment.strengths,
      weaknesses: assessment.weaknesses,
      aiSuggestions: assessment.suggestions,
      userGoals: dto.studyGoals,
    };

    const studyParameters = {
      startDate: dto.startDate,
      endDate: dto.endDate,
      weeklyHours: dto.weeklyHours,
      availableDays: dto.availableDays,
    };

    const prompt = `You are tasked with creating a personalized study plan for a student based on their information and study parameters. The plan should be tailored to their needs, goals, and schedule.

      First, you will be presented with the student's information:
      
      <student_info>
      ${JSON.stringify(assessmentData)}
      </student_info>
      
      This information includes the student's strengths, weaknesses, AI-generated suggestions, and personal study goals.
      
      Next, you will receive the study parameters:
      
      <study_parameters>
      ${JSON.stringify(studyParameters)}
      </study_parameters>
      
      These parameters include the start and end dates of the plan, the number of hours the student can study per week, and the days of the week they are available to study.
      
      To create the personalized study plan:
      
      1. Analyze the student's strengths, weaknesses, and goals.
      2. Incorporate relevant AI-generated suggestions into the student's goals.
      3. Create a weekly schedule based on the provided study parameters.
      4. Develop learning objectives for each week of the study plan.
      
      Structure your output as follows:
      
      1. List of Goals:
        - Combine the student's personal goals with selected AI-generated suggestions.
        - Present these as a numbered list.
      
      2. Weekly Schedule:
        - Create a table showing the study hours for each day the student is available.
        - Include the total hours per week.
        - Do not create a schedule for each week; use the same schedule for the entire plan.
        - Follow the format:
        <weekly_schedule>
          <day>
            <name>Monday</name>
            <hours>3.5</hours>
          </day>
          <day>
            <name>Wednesday</name>
            <hours>3.5</hours>
          </day>
          <day>
            <name>Friday</name>
            <hours>3</hours>
          </day>
          <total_hours>10</total_hours>
        </weekly_schedule> 
      
      3. Weekly Learning Objectives:
        - For each week of the study plan, create 3-5 specific, measurable learning objectives.
        - Ensure these objectives align with the student's goals and address their weaknesses.
      
      When creating learning objectives, follow these guidelines:
      •⁠  Make them specific and measurable
      •⁠  Align them with the student's goals and weaknesses
      •⁠  Ensure they are achievable within the given time frame
      •⁠  Use action verbs (e.g., "Solve", "Explain", "Analyze")
      
      Format your final output using the following XML tags:
      
      <study_plan>
        <goals>
          [List the combined goals here]
        </goals>
        
        <weekly_schedule>
          [Present the weekly schedule table here]
        </weekly_schedule>
        
        <learning_objectives>
          [List the weekly learning objectives here]
        </learning_objectives>
      </study_plan>
      
      Ensure that your study plan is coherent, well-structured, and tailored to the specific needs and schedule of the student.
    `;

    try {
      const plan = await this.aiService.getChatCompletion(prompt); // TODO: implement a retry mechanism
      const data = this.extractStudyPlanInfo(plan);
      await this.prisma.plan.create({
        data: {
          plan,
          userId,
          assessmentId: dto.assessmentId,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          weeklyHours: dto.weeklyHours,
          goals: data.goals,
        },
      });

      return { ...data, startDate: dto.startDate, endDate: dto.endDate };
    } catch (error) {
      console.error('Error generating study plan:', error);
      // throw new BadRequestException(ResponseMessage.PLAN_GENERATION_FAILED);
    }
  }

  private extractStudyPlanInfo(xmlString: string) {
    // extract goals
    const goalsRegex = /<goal>(.*?)<\/goal>/g;
    const goals = [...xmlString.matchAll(goalsRegex)].map((match) => match[1]);

    // extract weekly schedule
    const weeklyScheduleRegex =
      /<weekly_schedule>([\s\S]*?)<\/weekly_schedule>/;
    const dayRegex =
      /<day>\s*<name>(.*?)<\/name>\s*<hours>(.*?)<\/hours>\s*<\/day>/g;

    const weeklyScheduleMatch = xmlString.match(weeklyScheduleRegex);
    const weeklySchedule = weeklyScheduleMatch
      ? [...weeklyScheduleMatch[1].matchAll(dayRegex)].reduce(
          (acc, dayMatch) => {
            acc[dayMatch[1]] = parseFloat(dayMatch[2]);
            return acc;
          },
          {} as Record<string, number>,
        )
      : {};

    // extract learning objectives
    const objectivesRegex =
      /<learning_objectives>([\s\S]*?)<\/learning_objectives>/;
    const weekObjectivesRegex = /<week>([\s\S]*?)<\/week>/g;
    const objectiveRegex = /<objective>(.*?)<\/objective>/g;

    const objectivesMatch = xmlString.match(objectivesRegex);
    const learningObjectives = objectivesMatch
      ? [...objectivesMatch[1].matchAll(weekObjectivesRegex)].map(
          (weekMatch, index) => {
            const weekContent = weekMatch[1];
            const objectives = [...weekContent.matchAll(objectiveRegex)].map(
              (match) => match[1],
            );
            return { week: index + 1, objectives };
          },
        )
      : [];

    return { goals, weeklySchedule, learningObjectives };
  }
}
