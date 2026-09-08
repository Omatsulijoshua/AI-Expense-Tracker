import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillsService } from './bills.service';
import { CreateBillDto, PayBillDto } from './dto/bill.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUserContext } from '../auth/current-user.decorator';
import { BillStatus } from '@prisma/client';

@ApiTags('Bills')
@Controller('bills')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a bill entry' })
  @ApiResponse({ status: 201, description: 'Bill created' })
  async createBill(@CurrentUser() user: AuthUserContext, @Body() dto: CreateBillDto) {
    return this.billsService.createBill(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get bill calendar entries' })
  async getBills(@CurrentUser() user: AuthUserContext, @Query('status') status?: BillStatus) {
    return this.billsService.getBills(user.id, status);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Mark bill as paid and optional expense creation' })
  async payBill(@CurrentUser() user: AuthUserContext, @Param('id') billId: string, @Body() dto: PayBillDto) {
    const workspaceId = user.workspaceId || user.id;
    return this.billsService.payBill(user.id, workspaceId, billId, dto);
  }
}
