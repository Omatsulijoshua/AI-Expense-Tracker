import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/category.dto';
import { TransactionType } from '@prisma/client';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultCategories();
  }

  async seedDefaultCategories() {
    const count = await this.prisma.category.count({ where: { isSystem: true } });
    if (count > 0) return;

    const defaultExpenseCategories = [
      { name: 'Food & Dining', icon: 'restaurant', color: '#FF5722' },
      { name: 'Transportation', icon: 'directions_car', color: '#2196F3' },
      { name: 'Housing & Rent', icon: 'home', color: '#9C27B0' },
      { name: 'Utilities', icon: 'bolt', color: '#FFC107' },
      { name: 'Shopping', icon: 'shopping_bag', color: '#E91E63' },
      { name: 'Healthcare', icon: 'local_hospital', color: '#4CAF50' },
      { name: 'Education', icon: 'school', color: '#3F51B5' },
      { name: 'Entertainment', icon: 'movie', color: '#00BCD4' },
      { name: 'Subscriptions', icon: 'subscriptions', color: '#673AB7' },
      { name: 'Personal Care', icon: 'spa', color: '#EC407A' },
      { name: 'Travel', icon: 'flight', color: '#009688' },
      { name: 'Insurance', icon: 'security', color: '#607D8B' },
      { name: 'Taxes', icon: 'receipt_long', color: '#795548' },
      { name: 'Business Expense', icon: 'business_center', color: '#3F51B5' },
      { name: 'Other Expenses', icon: 'more_horiz', color: '#9E9E9E' },
    ];

    const defaultIncomeCategories = [
      { name: 'Salary', icon: 'payments', color: '#4CAF50' },
      { name: 'Business Income', icon: 'storefront', color: '#2196F3' },
      { name: 'Freelance & Consulting', icon: 'work', color: '#9C27B0' },
      { name: 'Investments', icon: 'trending_up', color: '#00BCD4' },
      { name: 'Interest & Dividends', icon: 'account_balance', color: '#FF9800' },
      { name: 'Gifts & Grants', icon: 'card_giftcard', color: '#E91E63' },
      { name: 'Refunds', icon: 'replay', color: '#009688' },
      { name: 'Other Income', icon: 'attach_money', color: '#8BC34A' },
    ];

    for (const cat of defaultExpenseCategories) {
      await this.prisma.category.create({
        data: {
          name: cat.name,
          type: TransactionType.EXPENSE,
          icon: cat.icon,
          color: cat.color,
          isSystem: true,
        },
      });
    }

    for (const cat of defaultIncomeCategories) {
      await this.prisma.category.create({
        data: {
          name: cat.name,
          type: TransactionType.INCOME,
          icon: cat.icon,
          color: cat.color,
          isSystem: true,
        },
      });
    }
  }

  async getCategories(userId?: string) {
    return this.prisma.category.findMany({
      where: {
        OR: [
          { isSystem: true },
          { userId: userId || undefined },
        ],
      },
      include: {
        subcategories: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(userId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type as TransactionType,
        icon: dto.icon || 'category',
        color: dto.color || '#0F62FE',
        parentId: dto.parentId,
        isSystem: false,
      },
    });
  }
}
