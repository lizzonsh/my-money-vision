import { Budget, Expense, Income, Savings, BigPurchaseGoal, BankAccount, RecurringPayment } from '@/types/finance';

export const mockBudget: Budget = {
  _id: '1',
  month: '2025-02',
  totalBudget: 1800,
  daysInMonth: 28,
  dailyLimit: 64,
  notes: 'February budget'
};

export const mockExpenses: Expense[] = [
  {
    _id: '1',
    expenseDate: '2025-02-01',
    month: '2025-02',
    amount: 1520,
    category: 'psychologist',
    kind: 'planned',
    recurring: { type: 'monthly', dayOfMonth: 1 },
    paymentMethod: 'bank_transfer',
    description: 'Monthly psychologist session'
  },
  {
    _id: '2',
    expenseDate: '2025-02-05',
    month: '2025-02',
    amount: 350,
    category: 'room',
    kind: 'payed',
    paymentMethod: 'credit_card',
    cardId: 'fly-card',
    description: 'Pilates membership'
  },
  {
    _id: '3',
    expenseDate: '2025-02-03',
    month: '2025-02',
    amount: 7663,
    category: 'debit_from_credit_card',
    kind: 'planned',
    recurring: { type: 'monthly', dayOfMonth: 3 },
    paymentMethod: 'bank_transfer',
    cardId: 'fly-card',
    description: 'Credit card debit - January expenses'
  },
  {
    _id: '4',
    expenseDate: '2025-02-10',
    month: '2025-02',
    amount: 250,
    category: 'gifts',
    kind: 'payed',
    paymentMethod: 'credit_card',
    cardId: 'hever',
    description: 'Birthday gift for friend'
  },
  {
    _id: '5',
    expenseDate: '2025-02-15',
    month: '2025-02',
    amount: 800,
    category: 'college',
    kind: 'predicted',
    paymentMethod: 'bank_transfer',
    description: 'Tuition payment'
  }
];

export const mockIncomes: Income[] = [
  {
    _id: '1',
    month: '2025-02',
    incomeDate: '2025-02-01',
    amount: 12500,
    name: 'work',
    description: 'Monthly salary'
  },
  {
    _id: '2',
    month: '2025-02',
    incomeDate: '2025-02-05',
    amount: 1500,
    name: 'bit',
    description: 'Freelance project'
  },
  {
    _id: '3',
    month: '2025-02',
    incomeDate: '2025-02-15',
    amount: 500,
    name: 'mom',
    description: 'Monthly support'
  }
];

export const mockSavings: Savings[] = [
  {
    _id: '1',
    month: '2025-02',
    name: 'Altshuler Investment',
    amount: 45000,
    currency: 'ILS',
    transferMethod: 'bank_account',
    type: 'savings',
    updateDate: '2025-02-01',
    recurring: { type: 'monthly', dayOfMonth: 21, monthlyDeposit: 2000 }
  },
  {
    _id: '2',
    month: '2025-02',
    name: 'Bank Savings',
    amount: 28000,
    currency: 'ILS',
    transferMethod: 'bank_account',
    type: 'savings',
    updateDate: '2025-02-01',
    recurring: { type: 'monthly', dayOfMonth: 15, monthlyDeposit: 1000 }
  },
  {
    _id: '3',
    month: '2025-02',
    name: 'Blink Emergency Fund',
    amount: 15000,
    currency: 'ILS',
    transferMethod: 'credit_card',
    cardId: 'visa',
    type: 'savings',
    updateDate: '2025-02-01',
    recurring: { type: 'monthly', dayOfMonth: 10, monthlyDeposit: 500 }
  }
];

export const mockBigPurchases: BigPurchaseGoal[] = [
  {
    _id: '1',
    name: 'New Laptop',
    targetAmount: 8000,
    currentSaved: 3200,
    monthlyContribution: 800,
    targetDate: '2025-08',
    priority: 'high',
    category: 'electronics',
    notes: 'MacBook Pro for work'
  },
  {
    _id: '2',
    name: 'Living Room Furniture',
    targetAmount: 15000,
    currentSaved: 6000,
    monthlyContribution: 1500,
    targetDate: '2025-12',
    priority: 'medium',
    category: 'furniture',
    notes: 'Sofa, coffee table, TV stand'
  },
  {
    _id: '3',
    name: 'College Fund',
    targetAmount: 50000,
    currentSaved: 23000,
    monthlyContribution: 2000,
    targetDate: '2026-09',
    priority: 'high',
    category: 'education',
    notes: 'Masters degree tuition'
  },
  {
    _id: '4',
    name: 'Summer Vacation',
    targetAmount: 12000,
    currentSaved: 4000,
    monthlyContribution: 1000,
    targetDate: '2025-07',
    priority: 'low',
    category: 'vacation',
    notes: 'Trip to Europe'
  }
];

export const mockBankAccount: BankAccount = {
  type: 'bank_account',
  name: 'Main Bank Account',
  currency: 'ILS',
  currentBalance: 12850,
  lastUpdated: '2025-02-03'
};

// Historical data for charts
export const mockMonthlyData = [
  { month: 'Sep', income: 13500, expenses: 9800, savings: 3000 },
  { month: 'Oct', income: 14200, expenses: 10500, savings: 3200 },
  { month: 'Nov', income: 13800, expenses: 11200, savings: 2800 },
  { month: 'Dec', income: 15000, expenses: 12800, savings: 3500 },
  { month: 'Jan', income: 14500, expenses: 10200, savings: 3500 },
  { month: 'Feb', income: 14500, expenses: 10583, savings: 3500 },
];

export const mockCategoryData = [
  { name: 'Credit Card', value: 7663, color: 'hsl(var(--chart-1))' },
  { name: 'Psychologist', value: 1520, color: 'hsl(var(--chart-2))' },
  { name: 'College', value: 800, color: 'hsl(var(--chart-3))' },
  { name: 'Room/Pilates', value: 350, color: 'hsl(var(--chart-4))' },
  { name: 'Gifts', value: 250, color: 'hsl(var(--chart-5))' },
];

export const mockSavingsGrowth = [
  { month: 'Sep', total: 75000 },
  { month: 'Oct', total: 78500 },
  { month: 'Nov', total: 81200 },
  { month: 'Dec', total: 84800 },
  { month: 'Jan', total: 88000 },
  { month: 'Feb', total: 88000 },
];

export const mockRecurringPayments: RecurringPayment[] = [
  {
    _id: 'rec1',
    name: 'Pilates',
    defaultAmount: 350,
    category: 'room',
    paymentMethod: 'credit_card',
    cardId: 'fly-card',
    dayOfMonth: 5,
    isActive: true,
    notes: 'Monthly pilates membership'
  },
  {
    _id: 'rec2',
    name: 'Psychology',
    defaultAmount: 1520,
    category: 'psychologist',
    paymentMethod: 'bank_transfer',
    dayOfMonth: 1,
    isActive: true,
    notes: 'Monthly therapy session'
  },
  {
    _id: 'rec3',
    name: 'Saxophone Lessons',
    defaultAmount: 400,
    category: 'college',
    paymentMethod: 'credit_card',
    cardId: 'visa',
    dayOfMonth: 10,
    isActive: true,
    notes: 'Weekly saxophone lessons'
  },
  {
    _id: 'rec4',
    name: 'Spotify',
    defaultAmount: 35,
    category: 'other',
    paymentMethod: 'credit_card',
    cardId: 'fly-card',
    dayOfMonth: 15,
    isActive: true,
    notes: 'Premium subscription'
  },
  {
    _id: 'rec5',
    name: 'Apple Account',
    defaultAmount: 50,
    category: 'other',
    paymentMethod: 'credit_card',
    cardId: 'visa',
    dayOfMonth: 20,
    isActive: true,
    notes: 'iCloud + Apple Music'
  }
];
