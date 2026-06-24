export type ExpenseCategory = "Food" | "Transport" | "Hotel" | "Activities" | "Shopping" | "Emergency";

export interface Expense {
  id: string;
  tripId: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  spentAt: string; // ISO date string
  createdAt: string;
}

export interface ExpenseAnalytics {
  totalSpent: number;
  remainingBudget: number;
  burnRatePercentage: number; // percentage of budget consumed so far
  dailyBurnRate: number;       // average spent per day
  projectedOverrun: number;    // estimated excess over budget at current rates
}
