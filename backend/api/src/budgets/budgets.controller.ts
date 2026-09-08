import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/budget.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUserContext } from '../auth/current-user.decorator';

@ApiTags('Budgets')
@Controller('budgets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create category spending budget' })
  @ApiResponse({ status: 201, description: 'Budget created' })
  async createBudget(@CurrentUser() user: AuthUserContext, @Body() dto: CreateBudgetDto) {
    const workspaceId = user.workspaceId || user.id;
    return this.budgetsService.createBudget(user.id, workspaceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user budgets with adherence status' })
  @ApiResponse({ status: 200, description: 'List of budgets with spending progress' })
  async getBudgets(@CurrentUser() user: AuthUserContext) {
    return this.budgetsService.getBudgets(user.id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Evaluate specific budget adherence status' })
  async evaluateBudgetStatus(@CurrentUser() user: AuthUserContext, @Param('id') budgetId: string) {
    return this.budgetsService.evaluateBudgetStatus(user.id, budgetId);
  }
}
