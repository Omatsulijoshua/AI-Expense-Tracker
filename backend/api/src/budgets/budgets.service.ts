import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBudgetDto } from './dto/budget.dto';
import { Prisma, TransactionType } from '@prisma/client';

@Injectable()
export class BudgetsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createBudget(userId: string, workspaceId: string, dto: CreateBudgetDto) {
    const totalAmount = new Prisma.Decimal(dto.amount);
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    const budget = await this.prisma.budget.create({
      data: {
        userId,
        workspaceId,
        name: dto.name,
        amount: totalAmount,
        startDate: start,
        endDate: end,
        categories: {
          create: dto.categories.map((c) => ({
            categoryId: c.categoryId,
            allocated: new Prisma.Decimal(c.allocated),
          })),
        },
      },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    return budget;
  }

  async getBudgets(userId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
      include: {
        categories: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results = [];
    for (const budget of budgets) {
      const status = await this.evaluateBudgetStatus(userId, budget.id);
      results.push(status);
    }

    return results;
  }

  async evaluateBudgetStatus(userId: string, budgetId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    // Fetch all expenses within budget timeframe
    const expenses = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        transactionDate: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
    });

    let totalSpent = 0;
    const categorySpentMap = new Map<string, number>();

    for (const exp of expenses) {
      const amt = Number(exp.amount);
      totalSpent += amt;
      const catId = exp.categoryId || 'uncategorized';
      categorySpentMap.set(catId, (categorySpentMap.get(catId) || 0) + amt);
    }

    const totalAllocated = Number(budget.amount);
    const overallPercentage = totalAllocated > 0 ? Number(((totalSpent / totalAllocated) * 100).toFixed(2)) : 0;

    const categoryAllocations = budget.categories.map((bc) => {
      const allocated = Number(bc.allocated);
      const spent = categorySpentMap.get(bc.categoryId) || 0;
      const percentage = allocated > 0 ? Number(((spent / allocated) * 100).toFixed(2)) : 0;

      // Check alert thresholds
      if (percentage >= 90) {
        this.notificationsService.dispatchNotification(
          userId,
          'Budget Alert: 90% Threshold Reached',
          `You have spent ${percentage}% (₦${spent}) of your ${bc.category.name} budget.`,
          'BUDGET_WARNING',
        );
      }

      return {
        categoryId: bc.categoryId,
        categoryName: bc.category.name,
        categoryIcon: bc.category.icon,
        allocated,
        spent,
        percentage,
      };
    });

    return {
      budgetId: budget.id,
      name: budget.name,
      startDate: budget.startDate,
      endDate: budget.endDate,
      totalAllocated,
      totalSpent,
      overallPercentage,
      categoryAllocations,
    };
  }
}
