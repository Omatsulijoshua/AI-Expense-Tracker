import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateBillDto, PayBillDto } from './dto/bill.dto';
import { BillStatus, Prisma, TransactionType } from '@prisma/client';

@Injectable()
export class BillsService {
  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
  ) {}

  async createBill(userId: string, dto: CreateBillDto) {
    const amountDecimal = new Prisma.Decimal(dto.amount);
    const due = new Date(dto.dueDate);

    return this.prisma.bill.create({
      data: {
        userId,
        name: dto.name,
        amount: amountDecimal,
        dueDate: due,
        frequency: dto.frequency || 'MONTHLY',
        status: BillStatus.UPCOMING,
      },
    });
  }

  async getBills(userId: string, status?: BillStatus) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const bills = await this.prisma.bill.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    // Dynamically evaluate status for upcoming vs overdue
    const evaluated = bills.map((b) => {
      let currentStatus = b.status;
      if (b.status !== BillStatus.PAID) {
        if (b.dueDate < now) {
          currentStatus = BillStatus.OVERDUE;
        } else if (b.dueDate.toDateString() === now.toDateString()) {
          currentStatus = BillStatus.DUE_TODAY;
        }
      }
      return {
        ...b,
        status: currentStatus,
      };
    });

    return evaluated;
  }

  async payBill(userId: string, workspaceId: string, billId: string, dto: PayBillDto) {
    const bill = await this.prisma.bill.findFirst({
      where: { id: billId, userId },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    // Mark as PAID
    const updatedBill = await this.prisma.bill.update({
      where: { id: billId },
      data: { status: BillStatus.PAID },
    });

    // If account provided, record EXPENSE transaction
    let expenseTx = null;
    if (dto.accountId) {
      expenseTx = await this.transactionsService.createTransaction(userId, workspaceId, {
        accountId: dto.accountId,
        type: TransactionType.EXPENSE as any,
        amount: Number(bill.amount),
        description: `Bill Payment: ${bill.name}`,
        merchant: bill.name,
      });
    }

    return {
      bill: updatedBill,
      expenseTransaction: expenseTx,
    };
  }
}
