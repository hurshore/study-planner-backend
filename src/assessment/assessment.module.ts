import { Module } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';
import { AIModule } from 'src/ai/ai.module';

@Module({
  imports: [AIModule],
  providers: [AssessmentService],
  controllers: [AssessmentController],
})
export class AssessmentModule {}
