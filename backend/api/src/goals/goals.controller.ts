import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { CreateGoalDto, ContributeGoalDto } from './dto/goal.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUserContext } from '../auth/current-user.decorator';

@ApiTags('Goals')
@Controller('goals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create savings goal' })
  @ApiResponse({ status: 201, description: 'Savings goal created' })
  async createGoal(@CurrentUser() user: AuthUserContext, @Body() dto: CreateGoalDto) {
    return this.goalsService.createGoal(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user savings goals and percentage progress' })
  async getGoals(@CurrentUser() user: AuthUserContext) {
    return this.goalsService.getGoals(user.id);
  }

  @Post(':id/contribute')
  @ApiOperation({ summary: 'Log contribution towards savings goal' })
  async contributeGoal(@CurrentUser() user: AuthUserContext, @Param('id') goalId: string, @Body() dto: ContributeGoalDto) {
    return this.goalsService.contributeGoal(user.id, goalId, dto);
  }
}
