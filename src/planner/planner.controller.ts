import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PlannerService } from './planner.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';

@ApiTags('Planner')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('planner')
export class PlannerController {
  constructor(private plannerService: PlannerService) {}

  @ApiOperation({ summary: 'Generate study plan' })
  @ApiOkResponse({ description: 'Study plan successfully generated' })
  @ApiBadRequestResponse({ description: 'Bad request.' })
  @Post('generate')
  async generatePlan(
    @GetUser('id') userId: number,
    @Body() dto: GeneratePlanDto,
  ) {
    return this.plannerService.generatePlan(dto, userId);
  }
}
