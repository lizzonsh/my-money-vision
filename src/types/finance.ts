export interface Budget {
  _id: string;
  month: string;
  totalBudget: number | string; // MongoDB may store as string
  spentBudget?: number;
  leftBudget?: number;
  daysInMonth?: number;
  dailyLimit: number;
  updateDate?: string;
  currency?: string;
  type?: string;
  status?: string;
  notes?: string;
}

export interface Expense {
  _id: string;
  expenseDate: string;
  month: string;
  amount: number;
  category: string; // Flexible to handle "TEMP" and other custom categories
  kind: 'planned' | 'payed' | 'predicted';
  recurring?: {
    type: 'monthly' | 'weekly';
    dayOfMonth?: number;
  };
  paymentMethod: 'bank_transfer' | 'credit_card';
  cardId?: string; // Flexible to handle "TEMP_CARD_ID" and custom cards
  description: string;
  expenseMonth?: string;
  monthOfExpense?: string;
  updateDate?: string;
  type?: string;
}

export interface Income {
  _id: string;
  month: string;
  incomeDate?: string; // Optional - not always present in MongoDB
  updateDate?: string;
  amount: number;
  name: string; // Flexible to handle various income sources
  description?: string; // Optional - not always present
  type?: string;
  recurring?: {
    type: 'monthly';
    dayOfMonth: number;
  };
}

export interface Savings {
  _id: string;
  month: string;
  name: string;
  amount: number;
  currency: string;
  transferMethod: 'bank_account' | 'credit_card';
  cardId?: string;
  type?: string; // "savings" collection type marker
  action?: 'deposit' | 'withdrawal'; // Action type from MongoDB
  actionAmount?: number; // Amount for deposit/withdrawal
  updateDate: string;
  recurring?: {
    type: 'monthly';
    dayOfMonth: number;
    monthlyDeposit?: number;
  };
  // Legacy fields for backwards compatibility
  deposit?: number;
  withdrawalAmount?: number;
}

export interface SavingsGrowth {
  _id: string;
  savingsId: string;
  month: string;
  valueAfterGrowth: number;
  notes?: string;
}

export interface BankAccount {
  type: 'bank_account';
  name: string;
  currency: string;
  currentBalance: number;
  lastUpdated: string;
}

export interface BigPurchaseGoal {
  _id: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  monthlyContribution: number;
  targetDate?: string;
  priority: 'high' | 'medium' | 'low';
  category: 'furniture' | 'electronics' | 'education' | 'vehicle' | 'property' | 'vacation' | 'other';
  notes?: string;
}

export interface MonthlyOverview {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  netWorth: number;
  remainingBudget: number;
  dailyLimit: number;
}
