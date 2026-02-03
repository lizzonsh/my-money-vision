export interface Budget {
  _id: string;
  month: string;
  totalBudget: number;
  daysInMonth: number;
  dailyLimit: number;
  notes?: string;
}

export interface Expense {
  _id: string;
  expenseDate: string;
  month: string;
  amount: number;
  category: 'room' | 'gifts' | 'psychologist' | 'college' | 'vacation' | 'total' | 'debit_from_credit_card' | 'other';
  kind: 'planned' | 'payed' | 'predicted';
  recurring?: {
    type: 'monthly' | 'weekly';
    dayOfMonth?: number;
  };
  paymentMethod: 'bank_transfer' | 'credit_card';
  cardId?: 'fly-card' | 'hever' | 'visa';
  description: string;
  expenseMonth?: string;
  monthOfExpense?: string;
  updateDate?: string;
  type?: string;
}

export interface Income {
  _id: string;
  month: string;
  incomeDate: string;
  amount: number;
  name: 'work' | 'bit' | 'mom' | 'other';
  description: string;
}

export interface Savings {
  _id: string;
  month: string;
  name: string;
  amount: number;
  currency: string;
  transferMethod: 'bank_account' | 'credit_card';
  cardId?: string;
  type: 'savings' | 'withdrawal';
  updateDate: string;
  recurring?: {
    type: 'monthly';
    dayOfMonth: number;
    monthlyDeposit: number;
  };
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
