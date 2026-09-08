import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ReportsModule } from './reports/reports.module';
import { BudgetsModule } from './budgets/budgets.module';
import { BillsModule } from './bills/bills.module';
import { GoalsModule } from './goals/goals.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ImportsModule } from './imports/imports.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { DocumentsModule } from './documents/documents.module';
import { VoiceModule } from './voice/voice.module';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module';
import { AiAdvancedModule } from './ai-advanced/ai-advanced.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    AccountsModule,
    TransactionsModule,
    ReportsModule,
    BudgetsModule,
    BillsModule,
    GoalsModule,
    NotificationsModule,
    ImportsModule,
    IntegrationsModule,
    DocumentsModule,
    VoiceModule,
    AiAssistantModule,
    AiAdvancedModule,
  ],
})
export class AppModule {}
