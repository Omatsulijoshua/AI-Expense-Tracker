import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { AccountType, Prisma } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async createAccount(userId: string, workspaceId: string, dto: CreateAccountDto) {
    const openingBal = new Prisma.Decimal(dto.openingBalance || 0);

    return this.prisma.account.create({
      data: {
        userId,
        workspaceId,
        name: dto.name,
        type: dto.type as AccountType,
        institution: dto.institution,
        currency: dto.currency || 'NGN',
        openingBalance: openingBal,
        currentBalance: openingBal,
        availableBalance: openingBal,
      },
    });
  }

  async getAccounts(userId: string, workspaceId?: string) {
    const where: any = { userId };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const accounts = await this.prisma.account.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    const netWorth = accounts.reduce((acc, account) => acc + Number(account.currentBalance), 0);

    return {
      netWorth,
      count: accounts.length,
      accounts,
    };
  }

  async getAccountById(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
      include: {
        transactions: {
          take: 10,
          orderBy: { transactionDate: 'desc' },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async updateAccount(userId: string, accountId: string, dto: UpdateAccountDto) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return this.prisma.account.update({
      where: { id: accountId },
      data: dto,
    });
  }

  async deleteAccount(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    await this.prisma.account.delete({
      where: { id: accountId },
    });

    return { message: 'Account deleted successfully' };
  }
}
