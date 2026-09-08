import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, CreateTransferDto, TransactionQueryDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUserContext } from '../auth/current-user.decorator';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Record Income or Expense transaction' })
  @ApiResponse({ status: 201, description: 'Transaction recorded and account balance updated' })
  async createTransaction(@CurrentUser() user: AuthUserContext, @Body() dto: CreateTransactionDto) {
    const workspaceId = user.workspaceId || user.id;
    return this.transactionsService.createTransaction(user.id, workspaceId, dto);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Execute money transfer between owned accounts' })
  @ApiResponse({ status: 201, description: 'Linked transfer executed, both account balances updated' })
  async createTransfer(@CurrentUser() user: AuthUserContext, @Body() dto: CreateTransferDto) {
    const workspaceId = user.workspaceId || user.id;
    return this.transactionsService.createTransfer(user.id, workspaceId, dto);
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Get chronological financial timeline' })
  async getTimeline(@CurrentUser() user: AuthUserContext, @Query() query: TransactionQueryDto) {
    return this.transactionsService.getTimeline(user.id, query);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Batch sync offline client-queued transaction changes' })
  async syncTransactions(
    @CurrentUser() user: AuthUserContext,
    @Body() body: { items: Array<{ clientTempId: string; action: 'CREATE' | 'DELETE'; data?: any }> },
  ) {
    const workspaceId = user.workspaceId || user.id;
    return this.transactionsService.syncTransactions(user.id, workspaceId, body.items || []);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete transaction and revert account balance' })
  async deleteTransaction(@CurrentUser() user: AuthUserContext, @Param('id') transactionId: string) {
    return this.transactionsService.deleteTransaction(user.id, transactionId);
  }
}
