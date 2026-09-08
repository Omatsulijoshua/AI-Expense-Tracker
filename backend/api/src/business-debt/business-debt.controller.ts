import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { BusinessDebtService } from './business-debt.service';
import { CreateDebtDto, RecordDebtPaymentDto, CreateWorkspaceDto, AddWorkspaceMemberDto } from './dto/business-debt.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class BusinessDebtController {
  constructor(private readonly service: BusinessDebtService) {}

  @Get('debts')
  async getDebts(@CurrentUser('id') userId: string) {
    return this.service.getDebts(userId);
  }

  @Post('debts')
  async createDebt(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDebtDto,
  ) {
    return this.service.createDebt(userId, dto);
  }

  @Post('debts/:id/payment')
  async recordPayment(
    @CurrentUser('id') userId: string,
    @Param('id') debtId: string,
    @Body() dto: RecordDebtPaymentDto,
  ) {
    return this.service.recordDebtPayment(userId, debtId, dto);
  }

  @Get('net-worth/assets-liabilities')
  async getAssetsLiabilitiesSummary(
    @CurrentUser('id') userId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.service.getAssetsLiabilitiesSummary(userId, workspaceId);
  }

  @Post('workspaces')
  async createWorkspace(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.service.createWorkspace(userId, dto);
  }

  @Get('workspaces/members')
  async getWorkspaceMembers(
    @CurrentUser('id') userId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.service.getWorkspaceMembers(userId, workspaceId);
  }

  @Post('workspaces/members')
  async addWorkspaceMember(
    @CurrentUser('id') userId: string,
    @Body() dto: AddWorkspaceMemberDto,
  ) {
    return this.service.addWorkspaceMember(userId, dto);
  }
}
