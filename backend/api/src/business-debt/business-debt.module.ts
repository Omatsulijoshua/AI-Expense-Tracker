import { Module } from '@nestjs/common';
import { BusinessDebtService } from './business-debt.service';
import { BusinessDebtController } from './business-debt.controller';

@Module({
  controllers: [BusinessDebtController],
  providers: [BusinessDebtService],
  exports: [BusinessDebtService],
})
export class BusinessDebtModule {}
