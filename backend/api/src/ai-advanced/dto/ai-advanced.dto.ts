export class AnomalyItemDto {
  transactionId: string;
  amount: number;
  description: string;
  merchant: string;
  transactionDate: Date;
  reason: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class SubscriptionItemDto {
  merchant: string;
  averageAmount: number;
  frequency: 'MONTHLY' | 'WEEKLY' | 'ANNUAL';
  lastBilledDate: Date;
  nextExpectedDate: Date;
  categoryName: string;
}

export class ForecastPointDto {
  date: string;
  projectedInflow: number;
  projectedOutflow: number;
  projectedBalance: number;
}

export class HealthScoreDto {
  score: number; // 0 - 100
  rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_ATTENTION';
  savingsRateScore: number;
  budgetDisciplineScore: number;
  liquidityScore: number;
  billTimelinessScore: number;
  recommendations: string[];
}
