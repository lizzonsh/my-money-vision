import { Budget, Expense, Income, Savings, BigPurchaseGoal, BankAccount, RecurringPayment, RecurringSavingsTemplate, RecurringIncome } from '@/types/finance';

// Empty data - will be populated from Supabase
export const mockBudget: Budget = {
  _id: '',
  month: new Date().toISOString().slice(0, 7),
  totalBudget: 0,
  daysInMonth: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
  dailyLimit: 0,
  notes: ''
};

export const mockExpenses: Expense[] = [];
export const mockIncomes: Income[] = [];
export const mockSavings: Savings[] = [];
export const mockBigPurchases: BigPurchaseGoal[] = [];

export const mockBankAccount: BankAccount = {
  type: 'bank_account',
  name: '',
  currency: 'ILS',
  currentBalance: 0,
  lastUpdated: new Date().toISOString().split('T')[0]
};

export const mockMonthlyData: { month: string; monthKey: string; income: number; expenses: number; savings: number }[] = [];
export const mockSavingsGrowth: { month: string; monthKey: string; total: number }[] = [];
export const mockCategoryData: { name: string; value: number; color: string }[] = [];

export const mockRecurringPayments: RecurringPayment[] = [];
export const mockRecurringSavings: RecurringSavingsTemplate[] = [];
export const mockRecurringIncomes: RecurringIncome[] = [];
