import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsQueryDto, ReportPeriodDto } from './dto/reports.dto';
import { TransactionType } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getCashFlowSummary(userId: string, query: ReportsQueryDto) {
    const { startDate, endDate } = this.resolvePeriodDates(query);

    const where: any = {
      userId,
      transactionDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (query.accountId) {
      where.accountId = query.accountId;
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      select: {
        amount: true,
        type: true,
        transactionDate: true,
      },
      orderBy: { transactionDate: 'asc' },
    });

    let totalInflow = 0;
    let totalOutflow = 0;

    const timeSeriesMap = new Map<string, { label: string; inflow: number; outflow: number }>();

    for (const tx of transactions) {
      const amt = Number(tx.amount);
      const dateKey = tx.transactionDate.toISOString().split('T')[0];

      if (!timeSeriesMap.has(dateKey)) {
        timeSeriesMap.set(dateKey, { label: dateKey, inflow: 0, outflow: 0 });
      }

      const point = timeSeriesMap.get(dateKey)!;

      if (tx.type === TransactionType.INCOME) {
        totalInflow += amt;
        point.inflow += amt;
      } else if (tx.type === TransactionType.EXPENSE) {
        totalOutflow += amt;
        point.outflow += amt;
      }
    }

    const netCashFlow = totalInflow - totalOutflow;
    const timeSeries = Array.from(timeSeriesMap.values());

    return {
      period: query.period || ReportPeriodDto.THIS_MONTH,
      startDate,
      endDate,
      totalInflow,
      totalOutflow,
      netCashFlow,
      timeSeries,
    };
  }

  async getCategoryBreakdown(userId: string, query: ReportsQueryDto, type: TransactionType = TransactionType.EXPENSE) {
    const { startDate, endDate } = this.resolvePeriodDates(query);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    });

    let grandTotal = 0;
    const categoryMap = new Map<string, { id: string; name: string; icon: string; color: string; amount: number; count: number }>();

    for (const tx of transactions) {
      const amt = Number(tx.amount);
      grandTotal += amt;

      const catId = tx.categoryId || 'uncategorized';
      const catName = tx.category?.name || 'Uncategorized';
      const catIcon = tx.category?.icon || 'category';
      const catColor = tx.category?.color || '#9E9E9E';

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          id: catId,
          name: catName,
          icon: catIcon,
          color: catColor,
          amount: 0,
          count: 0,
        });
      }

      const cat = categoryMap.get(catId)!;
      cat.amount += amt;
      cat.count += 1;
    }

    const items = Array.from(categoryMap.values()).map((cat) => ({
      ...cat,
      percentage: grandTotal > 0 ? Number(((cat.amount / grandTotal) * 100).toFixed(2)) : 0,
    }));

    items.sort((a, b) => b.amount - a.amount);

    return {
      type,
      grandTotal,
      categoriesCount: items.length,
      items,
    };
  }

  private resolvePeriodDates(query: ReportsQueryDto): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (query.startDate && query.endDate) {
      return {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      };
    }

    switch (query.period) {
      case ReportPeriodDto.LAST_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;

      case ReportPeriodDto.THIS_YEAR:
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;

      case ReportPeriodDto.THIS_MONTH:
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
    }

    return { startDate, endDate };
  }
}
