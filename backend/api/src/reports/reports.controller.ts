import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportsQueryDto } from './dto/reports.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUserContext } from '../auth/current-user.decorator';
import { TransactionType } from '@prisma/client';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('cash-flow')
  @ApiOperation({ summary: 'Get cash flow summary and time-series trend data' })
  @ApiResponse({ status: 200, description: 'Cash flow summary returned' })
  async getCashFlowSummary(@CurrentUser() user: AuthUserContext, @Query() query: ReportsQueryDto) {
    return this.reportsService.getCashFlowSummary(user.id, query);
  }

  @Get('category-breakdown')
  @ApiOperation({ summary: 'Get category spending or income breakdown' })
  @ApiResponse({ status: 200, description: 'Category breakdown returned' })
  async getCategoryBreakdown(
    @CurrentUser() user: AuthUserContext,
    @Query() query: ReportsQueryDto,
    @Query('type') type?: TransactionType,
  ) {
    return this.reportsService.getCategoryBreakdown(user.id, query, type || TransactionType.EXPENSE);
  }
}
