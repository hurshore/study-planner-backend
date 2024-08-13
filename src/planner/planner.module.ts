import { Module } from '@nestjs/common';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';
import { AIModule } from 'src/ai/ai.module';

@Module({
  imports: [AIModule],
  controllers: [PlannerController],
  providers: [PlannerService],
})
export class PlannerModule {}
