import { Budget, Expense, Income, Savings, BigPurchaseGoal, BankAccount, RecurringPayment, RecurringSavingsTemplate, RecurringIncome } from '@/types/finance';
import { 
  generateHistoricalExpenses, 
  generateHistoricalIncomes, 
  generateHistoricalSavings,
  generateMonthlyChartData,
  generateSavingsGrowthData,
  generateCategoryData
} from './mockDataGenerator';

export const mockBudget: Budget = {
  _id: '1',
  month: '2025-02',
  totalBudget: 1800,
  daysInMonth: 28,
  dailyLimit: 64,
  notes: 'February budget'
};

// Generate realistic historical data with fallbacks
let generatedExpenses: Expense[] = [];
let generatedIncomes: Income[] = [];
let generatedSavings: Savings[] = [];

try {
  generatedExpenses = generateHistoricalExpenses();
  generatedIncomes = generateHistoricalIncomes();
  generatedSavings = generateHistoricalSavings();
} catch (error) {
  console.error('Error generating mock data:', error);
  // Fallback to minimal data
  generatedExpenses = [
    {
      _id: '1',
      expenseDate: '2025-02-01',
      month: '2025-02',
      amount: 1520,
      category: 'psychologist',
      kind: 'payed',
      paymentMethod: 'bank_transfer',
      description: 'Monthly psychologist session'
    }
  ];
  generatedIncomes = [
    {
      _id: '1',
      month: '2025-02',
      incomeDate: '2025-02-01',
      amount: 12500,
      name: 'work',
      description: 'Monthly salary'
    }
  ];
  generatedSavings = [
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
    }
  ];
}

export const mockExpenses: Expense[] = generatedExpenses;
export const mockIncomes: Income[] = generatedIncomes;
export const mockSavings: Savings[] = generatedSavings;

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

// Generate chart data from historical data with fallbacks
export const mockMonthlyData = mockExpenses.length > 0 
  ? generateMonthlyChartData(mockExpenses, mockIncomes, mockSavings)
  : [{ month: 'Feb', monthKey: '2025-02', income: 12500, expenses: 1520, savings: 2000 }];

export const mockSavingsGrowth = mockSavings.length > 0 
  ? generateSavingsGrowthData(mockSavings)
  : [{ month: 'Feb', monthKey: '2025-02', total: 45000 }];

export const mockCategoryData = mockExpenses.length > 0 
  ? generateCategoryData(mockExpenses, '2025-02')
  : [{ name: 'Psychologist', value: 1520, color: 'hsl(var(--chart-1))' }];

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

export const mockRecurringSavings: RecurringSavingsTemplate[] = [
  {
    _id: 'rsav1',
    name: 'Altshuler Investment',
    defaultAmount: 2000,
    actionType: 'deposit',
    transferMethod: 'bank_account',
    dayOfMonth: 21,
    isActive: true,
    notes: 'Monthly investment deposit'
  },
  {
    _id: 'rsav2',
    name: 'Bank Savings',
    defaultAmount: 1000,
    actionType: 'deposit',
    transferMethod: 'bank_account',
    dayOfMonth: 15,
    isActive: true,
    notes: 'Monthly bank savings'
  },
  {
    _id: 'rsav3',
    name: 'Blink Emergency Fund',
    defaultAmount: 500,
    actionType: 'deposit',
    transferMethod: 'credit_card',
    cardId: 'visa',
    dayOfMonth: 10,
    isActive: true,
    notes: 'Emergency fund contribution'
  },
  {
    _id: 'rsav4',
    name: 'Emergency Withdrawal',
    defaultAmount: 1000,
    actionType: 'withdrawal',
    transferMethod: 'bank_account',
    dayOfMonth: 1,
    isActive: false,
    notes: 'For unexpected expenses'
  }
];

export const mockRecurringIncomes: RecurringIncome[] = [
  {
    _id: 'rinc1',
    name: 'Monthly Salary',
    defaultAmount: 12500,
    source: 'work',
    dayOfMonth: 1,
    isActive: true,
    notes: 'Main job salary'
  },
  {
    _id: 'rinc2',
    name: 'Freelance Projects',
    defaultAmount: 1500,
    source: 'bit',
    dayOfMonth: 5,
    isActive: true,
    notes: 'Average freelance income'
  },
  {
    _id: 'rinc3',
    name: 'Family Support',
    defaultAmount: 500,
    source: 'mom',
    dayOfMonth: 15,
    isActive: true,
    notes: 'Monthly support from mom'
  }
];
