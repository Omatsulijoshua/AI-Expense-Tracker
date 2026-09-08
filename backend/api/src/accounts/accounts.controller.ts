import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUserContext } from '../auth/current-user.decorator';

@ApiTags('Accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new financial account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  async createAccount(@CurrentUser() user: AuthUserContext, @Body() dto: CreateAccountDto) {
    const workspaceId = user.workspaceId || user.id;
    return this.accountsService.createAccount(user.id, workspaceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user financial accounts and net balance' })
  @ApiResponse({ status: 200, description: 'List of accounts and total net worth' })
  async getAccounts(@CurrentUser() user: AuthUserContext, @Query('workspaceId') workspaceId?: string) {
    return this.accountsService.getAccounts(user.id, workspaceId || user.workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account details by ID' })
  async getAccountById(@CurrentUser() user: AuthUserContext, @Param('id') accountId: string) {
    return this.accountsService.getAccountById(user.id, accountId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update account details' })
  async updateAccount(@CurrentUser() user: AuthUserContext, @Param('id') accountId: string, @Body() dto: UpdateAccountDto) {
    return this.accountsService.updateAccount(user.id, accountId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete account' })
  async deleteAccount(@CurrentUser() user: AuthUserContext, @Param('id') accountId: string) {
    return this.accountsService.deleteAccount(user.id, accountId);
  }
}
