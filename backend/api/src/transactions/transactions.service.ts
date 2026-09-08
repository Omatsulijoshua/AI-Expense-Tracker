import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto, CreateTransferDto, TransactionQueryDto } from './dto/transaction.dto';
import { TransactionType, TransactionSource, Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async createTransaction(userId: string, workspaceId: string, dto: CreateTransactionDto) {
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const amountDecimal = new Prisma.Decimal(dto.amount);
    const txDate = dto.transactionDate ? new Date(dto.transactionDate) : new Date();

    return this.prisma.$transaction(async (tx) => {
      // Create ledger transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          workspaceId,
          accountId: dto.accountId,
          type: dto.type as TransactionType,
          amount: amountDecimal,
          currency: dto.currency || account.currency,
          categoryId: dto.categoryId,
          merchant: dto.merchant,
          description: dto.description,
          transactionDate: txDate,
          paymentMethod: dto.paymentMethod,
          reference: dto.reference,
          source: (dto.source as TransactionSource) || TransactionSource.MANUAL,
          notes: dto.notes,
        },
      });

      // Update account balance deterministically
      let balanceAdjustment = amountDecimal;
      if (dto.type === TransactionType.EXPENSE) {
        balanceAdjustment = amountDecimal.negated();
      }

      const updatedAccount = await tx.account.update({
        where: { id: dto.accountId },
        data: {
          currentBalance: { increment: balanceAdjustment },
          availableBalance: { increment: balanceAdjustment },
        },
      });

      return {
        transaction,
        updatedAccountBalance: updatedAccount.currentBalance,
      };
    });
  }

  async createTransfer(userId: string, workspaceId: string, dto: CreateTransferDto) {
    if (dto.sourceAccountId === dto.destinationAccountId) {
      throw new BadRequestException('Source and destination accounts must be different');
    }

    const sourceAccount = await this.prisma.account.findFirst({
      where: { id: dto.sourceAccountId, userId },
    });
    const destAccount = await this.prisma.account.findFirst({
      where: { id: dto.destinationAccountId, userId },
    });

    if (!sourceAccount || !destAccount) {
      throw new NotFoundException('One or both accounts were not found');
    }

    const amountDecimal = new Prisma.Decimal(dto.amount);
    const txDate = dto.transactionDate ? new Date(dto.transactionDate) : new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Outflow transaction on Source Account
      const outflow = await tx.transaction.create({
        data: {
          userId,
          workspaceId,
          accountId: dto.sourceAccountId,
          type: TransactionType.TRANSFER,
          amount: amountDecimal,
          currency: dto.currency || sourceAccount.currency,
          description: dto.description || `Transfer to ${destAccount.name}`,
          transactionDate: txDate,
          source: TransactionSource.MANUAL,
        },
      });

      // 2. Create Inflow transaction on Destination Account
      const inflow = await tx.transaction.create({
        data: {
          userId,
          workspaceId,
          accountId: dto.destinationAccountId,
          type: TransactionType.TRANSFER,
          amount: amountDecimal,
          currency: dto.currency || destAccount.currency,
          description: dto.description || `Transfer from ${sourceAccount.name}`,
          transactionDate: txDate,
          source: TransactionSource.MANUAL,
        },
      });

      // 3. Create linked transfer relationship
      const transferLink = await tx.transactionTransfer.create({
        data: {
          sourceTransactionId: outflow.id,
          destinationTransactionId: inflow.id,
        },
      });

      // 4. Update balances: Decrease Source, Increase Destination
      const updatedSource = await tx.account.update({
        where: { id: dto.sourceAccountId },
        data: {
          currentBalance: { decrement: amountDecimal },
          availableBalance: { decrement: amountDecimal },
        },
      });

      const updatedDest = await tx.account.update({
        where: { id: dto.destinationAccountId },
        data: {
          currentBalance: { increment: amountDecimal },
          availableBalance: { increment: amountDecimal },
        },
      });

      return {
        transferLink,
        outflowTransaction: outflow,
        inflowTransaction: inflow,
        sourceBalance: updatedSource.currentBalance,
        destinationBalance: updatedDest.currentBalance,
      };
    });
  }

  async getTimeline(userId: string, query: TransactionQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (query.type) {
      where.type = query.type as TransactionType;
    }
    if (query.accountId) {
      where.accountId = query.accountId;
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.startDate || query.endDate) {
      where.transactionDate = {};
      if (query.startDate) where.transactionDate.gte = new Date(query.startDate);
      if (query.endDate) where.transactionDate.lte = new Date(query.endDate);
    }

    const [total, transactions] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        include: {
          account: { select: { id: true, name: true, type: true, currency: true } },
          category: { select: { id: true, name: true, icon: true, color: true } },
        },
        orderBy: { transactionDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Revert account balance impact
      let revertAdjustment = transaction.amount;
      if (transaction.type === TransactionType.EXPENSE) {
        // Expense decreased balance, so deleting expense INCREMENTs balance
        revertAdjustment = transaction.amount;
      } else if (transaction.type === TransactionType.INCOME) {
        // Income increased balance, so deleting income DECREMENTs balance
        revertAdjustment = transaction.amount.negated();
      } else {
        revertAdjustment = new Prisma.Decimal(0);
      }

      if (!revertAdjustment.isZero()) {
        await tx.account.update({
          where: { id: transaction.accountId },
          data: {
            currentBalance: { increment: revertAdjustment },
            availableBalance: { increment: revertAdjustment },
          },
        });
      }

      await tx.transaction.delete({
        where: { id: transactionId },
      });

      return { message: 'Transaction deleted successfully' };
    });
  }
}
