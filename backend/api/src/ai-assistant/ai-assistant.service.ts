import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatQueryDto, ChatResponseDto, ToolCallExecutedDto } from './dto/ai-assistant.dto';
import { TransactionType, BillStatus } from '@prisma/client';

@Injectable()
export class AiAssistantService {
  constructor(private readonly prisma: PrismaService) {}

  async getSuggestions() {
    return [
      'What is my total net worth across all accounts?',
      'How much did I spend on food and dining this month?',
      'Do I have any upcoming bills due soon?',
      'Check my current budget status and limits.',
    ];
  }

  async processChatQuery(userId: string, workspaceId: string, dto: ChatQueryDto): Promise<ChatResponseDto> {
    const prompt = dto.message.toLowerCase();
    const toolsExecuted: ToolCallExecutedDto[] = [];
    let reply = '';
    let evidenceData: any = null;

    if (prompt.includes('net worth') || prompt.includes('balance') || prompt.includes('total money')) {
      // TOOL 1: Net Worth Calculator
      const netWorthResult = await this.queryNetWorth(userId);
      toolsExecuted.push({
        toolName: 'query_net_worth',
        parameters: { userId },
        resultSummary: `Calculated net worth across ${netWorthResult.accountCount} accounts: ₦${netWorthResult.netWorth.toFixed(2)}`,
      });

      evidenceData = netWorthResult;
      reply = `Your total net worth across **${netWorthResult.accountCount} accounts** is **₦${netWorthResult.netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}**.\n\n` +
        `• **Bank Accounts & Cash Balance**: ₦${netWorthResult.netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n` +
        `• **Active Accounts**: ${netWorthResult.accounts.map((a) => `${a.name} (₦${Number(a.currentBalance).toFixed(2)})`).join(', ')}`;

    } else if (prompt.includes('bill') || prompt.includes('due') || prompt.includes('payment')) {
      // TOOL 2: Upcoming Bills Query
      const billsResult = await this.queryUpcomingBills(userId);
      toolsExecuted.push({
        toolName: 'query_upcoming_bills',
        parameters: { userId },
        resultSummary: `Found ${billsResult.length} bills`,
      });

      evidenceData = billsResult;
      if (billsResult.length === 0) {
        reply = 'You currently have no upcoming or overdue bills scheduled in your account!';
      } else {
        const totalDue = billsResult.reduce((sum, b) => sum + Number(b.amount), 0);
        reply = `You have **${billsResult.length} bill(s)** scheduled totaling **₦${totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}**:\n\n` +
          billsResult.map((b) => `• **${b.name}**: ₦${Number(b.amount).toFixed(2)} (Status: ${b.status}, Due: ${new Date(b.dueDate).toISOString().split('T')[0]})`).join('\n');
      }

    } else if (prompt.includes('budget') || prompt.includes('limit') || prompt.includes('afford')) {
      // TOOL 3: Budget Status Query
      const budgetResult = await this.queryBudgetStatus(userId, workspaceId);
      toolsExecuted.push({
        toolName: 'query_budget_status',
        parameters: { userId, workspaceId },
        resultSummary: `Found ${budgetResult.length} active budgets`,
      });

      evidenceData = budgetResult;
      if (budgetResult.length === 0) {
        reply = 'You have not set up any active monthly budgets yet. Would you like to create one under the Budgets tab?';
      } else {
        reply = `Here is your current budget status:\n\n` +
          budgetResult.map((b) => `• **${b.name}**: Spent ₦${b.spent.toFixed(2)} of ₦${b.allocated.toFixed(2)} allocated (${b.usagePercent.toFixed(1)}% used)`).join('\n');
      }

    } else {
      // TOOL 4: Category Spending Breakdown (Default Fallback Query)
      const spendingResult = await this.querySpendingByCategory(userId, workspaceId);
      toolsExecuted.push({
        toolName: 'query_spending_by_category',
        parameters: { userId, workspaceId },
        resultSummary: `Aggregated spending across ${spendingResult.breakdown.length} categories`,
      });

      evidenceData = spendingResult;
      reply = `Based on your recent transactions, your total expenses amount to **₦${spendingResult.totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}** across **${spendingResult.totalTransactions} transactions**.\n\n` +
        `**Top Spending Categories:**\n` +
        spendingResult.breakdown.map((item) => `• **${item.category}**: ₦${item.amount.toFixed(2)} (${item.percentage.toFixed(1)}%)`).join('\n') +
        `\n\n*Tip: Try asking "What is my total net worth?" or "Show my upcoming bills" for specific breakdown!*`;
    }

    return {
      reply,
      toolsExecuted,
      evidenceData,
    };
  }

  // --- Tool Implementations ---

  private async queryNetWorth(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId, isActive: true },
    });

    const netWorth = accounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0);

    return {
      netWorth,
      accountCount: accounts.length,
      accounts,
    };
  }

  private async queryUpcomingBills(userId: string) {
    return this.prisma.bill.findMany({
      where: {
        userId,
        status: { in: [BillStatus.UPCOMING, BillStatus.DUE_TODAY, BillStatus.OVERDUE] },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  private async queryBudgetStatus(userId: string, workspaceId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId, workspaceId },
      include: { categories: { include: { category: true } } },
    });

    const results = [];
    for (const b of budgets) {
      const allocated = Number(b.amount);

      // Find actual expenses in timeframe
      const expenses = await this.prisma.transaction.aggregate({
        where: {
          userId,
          workspaceId,
          type: TransactionType.EXPENSE,
          transactionDate: { gte: b.startDate, lte: b.endDate },
        },
        _sum: { amount: true },
      });

      const spent = Number(expenses._sum.amount || 0);
      const usagePercent = allocated > 0 ? (spent / allocated) * 100 : 0;

      results.push({
        id: b.id,
        name: b.name,
        allocated,
        spent,
        usagePercent,
      });
    }

    return results;
  }

  private async querySpendingByCategory(userId: string, workspaceId: string) {
    const txs = await this.prisma.transaction.findMany({
      where: { userId, workspaceId, type: TransactionType.EXPENSE },
      include: { category: true },
    });

    const categoryMap = new Map<string, number>();
    let totalExpense = 0;

    for (const tx of txs) {
      const amt = Number(tx.amount);
      const catName = tx.category?.name || 'Uncategorized';
      categoryMap.set(catName, (categoryMap.get(catName) || 0) + amt);
      totalExpense += amt;
    }

    const breakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);

    return {
      totalExpense,
      totalTransactions: txs.length,
      breakdown,
    };
  }
}
