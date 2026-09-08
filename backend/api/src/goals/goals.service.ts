import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateGoalDto, ContributeGoalDto } from './dto/goal.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GoalsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createGoal(userId: string, dto: CreateGoalDto) {
    const targetDecimal = new Prisma.Decimal(dto.targetAmount);

    return this.prisma.savingsGoal.create({
      data: {
        userId,
        name: dto.name,
        targetAmount: targetDecimal,
        currentAmount: new Prisma.Decimal(0),
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
      },
    });
  }

  async getGoals(userId: string) {
    const goals = await this.prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((g) => {
      const target = Number(g.targetAmount);
      const current = Number(g.currentAmount);
      const percentage = target > 0 ? Number(((current / target) * 100).toFixed(2)) : 0;
      return {
        ...g,
        targetAmount: target,
        currentAmount: current,
        percentage,
        isCompleted: current >= target,
      };
    });
  }

  async contributeGoal(userId: string, goalId: string, dto: ContributeGoalDto) {
    const goal = await this.prisma.savingsGoal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new NotFoundException('Savings goal not found');
    }

    const contributionDecimal = new Prisma.Decimal(dto.amount);
    const updated = await this.prisma.savingsGoal.update({
      where: { id: goalId },
      data: {
        currentAmount: { increment: contributionDecimal },
      },
    });

    const target = Number(updated.targetAmount);
    const current = Number(updated.currentAmount);
    const percentage = target > 0 ? Number(((current / target) * 100).toFixed(2)) : 0;

    if (current >= target) {
      this.notificationsService.dispatchNotification(
        userId,
        'Savings Goal Achieved! 🎉',
        `Congratulations! You reached 100% of your savings goal for "${updated.name}".`,
        'GOAL_MILESTONE',
      );
    }

    return {
      goal: updated,
      percentage,
      isCompleted: current >= target,
    };
  }
}
