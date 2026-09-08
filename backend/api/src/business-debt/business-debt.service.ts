import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDebtDto, RecordDebtPaymentDto, CreateWorkspaceDto, AddWorkspaceMemberDto } from './dto/business-debt.dto';
import { Role, WorkspaceType } from '@prisma/client';

@Injectable()
export class BusinessDebtService {
  constructor(private readonly prisma: PrismaService) {}

  async createDebt(userId: string, dto: CreateDebtDto) {
    const amount = Math.abs(dto.amount);
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    return this.prisma.debt.create({
      data: {
        userId,
        person: dto.person,
        type: dto.type,
        amount,
        remaining: amount,
        dueDate,
      },
    });
  }

  async recordDebtPayment(userId: string, debtId: string, dto: RecordDebtPaymentDto) {
    const debt = await this.prisma.debt.findFirst({
      where: { id: debtId, userId },
    });

    if (!debt) {
      throw new NotFoundException('Debt record not found');
    }

    const paymentAmount = Math.abs(dto.amount);
    const currentRemaining = Number(debt.remaining);

    if (paymentAmount > currentRemaining) {
      throw new BadRequestException(`Payment amount (₦${paymentAmount}) exceeds remaining balance (₦${currentRemaining})`);
    }

    const newRemaining = Math.max(currentRemaining - paymentAmount, 0);

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.debtPayment.create({
        data: {
          debtId: debt.id,
          amount: paymentAmount,
        },
      });

      const updatedDebt = await tx.debt.update({
        where: { id: debt.id },
        data: { remaining: newRemaining },
      });

      return {
        message: 'Debt payment recorded successfully',
        payment,
        updatedDebt,
      };
    });
  }

  async getDebts(userId: string) {
    const debts = await this.prisma.debt.findMany({
      where: { userId },
      include: { payments: { orderBy: { paidAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });

    let totalIOwe = 0;
    let totalOwedToMe = 0;

    for (const d of debts) {
      const rem = Number(d.remaining);
      if (d.type === 'I_OWE') totalIOwe += rem;
      else totalOwedToMe += rem;
    }

    return {
      summary: {
        totalIOwe,
        totalOwedToMe,
        netDebtPosition: totalOwedToMe - totalIOwe,
      },
      debts,
    };
  }

  async getAssetsLiabilitiesSummary(userId: string, workspaceId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId, workspaceId, isActive: true },
    });

    const debts = await this.prisma.debt.findMany({
      where: { userId },
    });

    let liquidAccountsBalance = 0;
    let creditCardLiabilities = 0;

    for (const acc of accounts) {
      const bal = Number(acc.currentBalance);
      if (acc.type === 'CREDIT_CARD') {
        creditCardLiabilities += Math.abs(bal);
      } else {
        liquidAccountsBalance += bal;
      }
    }

    let debtReceivables = 0; // OWED_TO_ME (Asset)
    let debtPayables = 0;   // I_OWE (Liability)

    for (const d of debts) {
      const rem = Number(d.remaining);
      if (d.type === 'OWED_TO_ME') debtReceivables += rem;
      else debtPayables += rem;
    }

    const totalAssets = liquidAccountsBalance + debtReceivables;
    const totalLiabilities = creditCardLiabilities + debtPayables;
    const netWorth = totalAssets - totalLiabilities;

    return {
      netWorth,
      assets: {
        totalAssets,
        liquidAccounts: liquidAccountsBalance,
        receivables: debtReceivables,
      },
      liabilities: {
        totalLiabilities,
        creditCards: creditCardLiabilities,
        payables: debtPayables,
      },
    };
  }

  async createWorkspace(userId: string, dto: CreateWorkspaceDto) {
    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: dto.name,
          type: dto.type || WorkspaceType.BUSINESS,
          currency: dto.currency || 'NGN',
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: Role.OWNER,
        },
      });

      return workspace;
    });
  }

  async getWorkspaceMembers(userId: string, workspaceId: string) {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
    });

    if (!membership) {
      throw new NotFoundException('Workspace access denied');
    }

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return {
      currentRole: membership.role,
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
    };
  }

  async addWorkspaceMember(userId: string, dto: AddWorkspaceMemberDto) {
    const requester = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId: dto.workspaceId, userId },
    });

    if (!requester || (requester.role !== Role.OWNER && requester.role !== Role.ADMIN)) {
      throw new BadRequestException('Only workspace OWNER or ADMIN can invite team members');
    }

    return this.prisma.workspaceMember.create({
      data: {
        workspaceId: dto.workspaceId,
        userId: dto.targetUserId,
        role: dto.role,
      },
    });
  }
}
