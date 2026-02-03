import { Expense, Income, Savings } from '@/types/finance';

// Generate historical data for the past 12 months
const generateHistoricalMonths = (): string[] => {
  const months: string[] = [];
  const now = new Date(2025, 1, 1); // February 2025
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
};

// Expense categories with realistic amounts and variance
const expenseTemplates = [
  { category: 'psychologist', baseAmount: 1520, variance: 0, description: 'Monthly psychologist session' },
  { category: 'room', baseAmount: 350, variance: 0, description: 'Pilates membership' },
  { category: 'college', baseAmount: 800, variance: 200, description: 'Tuition/Education' },
  { category: 'debit_from_credit_card', baseAmount: 7500, variance: 1500, description: 'Credit card debit' },
  { category: 'groceries', baseAmount: 1200, variance: 400, description: 'Monthly groceries' },
  { category: 'transportation', baseAmount: 450, variance: 150, description: 'Transportation costs' },
  { category: 'utilities', baseAmount: 380, variance: 120, description: 'Electricity & Water' },
  { category: 'internet', baseAmount: 120, variance: 0, description: 'Internet subscription' },
  { category: 'phone', baseAmount: 80, variance: 20, description: 'Phone bill' },
];

// One-time expense categories that appear randomly
const randomExpenseTemplates = [
  { category: 'gifts', baseAmount: 250, variance: 150, description: 'Gift purchase' },
  { category: 'entertainment', baseAmount: 180, variance: 100, description: 'Entertainment' },
  { category: 'clothing', baseAmount: 350, variance: 200, description: 'Clothing purchase' },
  { category: 'health', baseAmount: 200, variance: 150, description: 'Health expenses' },
  { category: 'dining', baseAmount: 280, variance: 120, description: 'Dining out' },
  { category: 'vacation', baseAmount: 1500, variance: 1000, description: 'Travel/Vacation' },
];

// Income templates
const incomeTemplates = [
  { name: 'work', baseAmount: 12500, variance: 0, description: 'Monthly salary' },
  { name: 'bit', baseAmount: 1500, variance: 800, description: 'Freelance project', probability: 0.7 },
  { name: 'mom', baseAmount: 500, variance: 0, description: 'Monthly support' },
];

// Bonus income that appears randomly
const bonusIncomeTemplates = [
  { name: 'bonus', baseAmount: 3000, variance: 2000, description: 'Work bonus', probability: 0.15 },
  { name: 'refund', baseAmount: 400, variance: 300, description: 'Tax refund', probability: 0.1 },
  { name: 'gift', baseAmount: 500, variance: 300, description: 'Gift received', probability: 0.1 },
];

// Savings growth per month
const savingsAccounts = [
  { name: 'Altshuler Investment', startAmount: 31000, monthlyDeposit: 2000, growthRate: 0.005 },
  { name: 'Bank Savings', startAmount: 18000, monthlyDeposit: 1000, growthRate: 0.002 },
  { name: 'Blink Emergency Fund', startAmount: 9000, monthlyDeposit: 500, growthRate: 0.003 },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const randomVariance = (base: number, variance: number): number => {
  return Math.round(base + (Math.random() - 0.5) * 2 * variance);
};

const randomDay = (max: number = 28): number => {
  return Math.floor(Math.random() * max) + 1;
};

export const generateHistoricalExpenses = (): Expense[] => {
  const months = generateHistoricalMonths();
  const expenses: Expense[] = [];

  months.forEach((month, monthIndex) => {
    const [year, monthNum] = month.split('-');
    
    // Regular monthly expenses
    expenseTemplates.forEach((template) => {
      const day = randomDay();
      expenses.push({
        _id: generateId(),
        expenseDate: `${month}-${String(day).padStart(2, '0')}`,
        month,
        amount: randomVariance(template.baseAmount, template.variance),
        category: template.category,
        kind: 'payed',
        paymentMethod: template.category === 'debit_from_credit_card' ? 'bank_transfer' : 
                       Math.random() > 0.5 ? 'credit_card' : 'bank_transfer',
        cardId: Math.random() > 0.5 ? 'fly-card' : Math.random() > 0.5 ? 'hever' : 'visa',
        description: template.description,
      });
    });

    // Random one-time expenses (2-4 per month)
    const numRandomExpenses = Math.floor(Math.random() * 3) + 2;
    const shuffledRandom = [...randomExpenseTemplates].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numRandomExpenses; i++) {
      const template = shuffledRandom[i % shuffledRandom.length];
      const day = randomDay();
      expenses.push({
        _id: generateId(),
        expenseDate: `${month}-${String(day).padStart(2, '0')}`,
        month,
        amount: randomVariance(template.baseAmount, template.variance),
        category: template.category,
        kind: 'payed',
        paymentMethod: 'credit_card',
        cardId: Math.random() > 0.5 ? 'fly-card' : Math.random() > 0.5 ? 'hever' : 'visa',
        description: template.description,
      });
    }

    // December has extra holiday spending
    if (monthNum === '12') {
      expenses.push({
        _id: generateId(),
        expenseDate: `${month}-20`,
        month,
        amount: randomVariance(800, 300),
        category: 'gifts',
        kind: 'payed',
        paymentMethod: 'credit_card',
        cardId: 'fly-card',
        description: 'Holiday gifts',
      });
    }
  });

  return expenses;
};

export const generateHistoricalIncomes = (): Income[] => {
  const months = generateHistoricalMonths();
  const incomes: Income[] = [];

  months.forEach((month) => {
    // Regular monthly incomes
    incomeTemplates.forEach((template) => {
      if (template.probability && Math.random() > template.probability) return;
      
      incomes.push({
        _id: generateId(),
        month,
        incomeDate: `${month}-${String(template.name === 'work' ? 1 : randomDay()).padStart(2, '0')}`,
        amount: randomVariance(template.baseAmount, template.variance),
        name: template.name,
        description: template.description,
      });
    });

    // Random bonus incomes
    bonusIncomeTemplates.forEach((template) => {
      if (Math.random() < template.probability) {
        incomes.push({
          _id: generateId(),
          month,
          incomeDate: `${month}-${String(randomDay()).padStart(2, '0')}`,
          amount: randomVariance(template.baseAmount, template.variance),
          name: template.name,
          description: template.description,
        });
      }
    });
  });

  return incomes;
};

export const generateHistoricalSavings = (): Savings[] => {
  const months = generateHistoricalMonths();
  const allSavings: Savings[] = [];

  savingsAccounts.forEach((account) => {
    let currentAmount = account.startAmount;
    
    months.forEach((month, index) => {
      // Apply monthly deposit and growth
      currentAmount += account.monthlyDeposit;
      currentAmount *= (1 + account.growthRate);
      
      allSavings.push({
        _id: generateId(),
        month,
        name: account.name,
        amount: Math.round(currentAmount),
        currency: 'ILS',
        transferMethod: 'bank_account',
        type: 'savings',
        updateDate: `${month}-01`,
        recurring: {
          type: 'monthly',
          dayOfMonth: account.name.includes('Altshuler') ? 21 : 
                      account.name.includes('Bank') ? 15 : 10,
          monthlyDeposit: account.monthlyDeposit,
        },
      });
    });
  });

  return allSavings;
};

// Generate chart data from actual historical data
export const generateMonthlyChartData = (
  expenses: Expense[], 
  incomes: Income[], 
  savings: Savings[]
) => {
  const months = generateHistoricalMonths();
  
  return months.map((month) => {
    const monthExpenses = expenses.filter(e => e.month === month);
    const monthIncomes = incomes.filter(i => i.month === month);
    const monthSavings = savings.filter(s => s.month === month);
    
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalSavings = monthSavings.reduce((sum, s) => sum + (s.recurring?.monthlyDeposit || 0), 0);
    
    const date = new Date(month + '-01');
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
    
    return {
      month: monthLabel,
      monthKey: month,
      income: totalIncome,
      expenses: totalExpenses,
      savings: totalSavings,
    };
  });
};

export const generateSavingsGrowthData = (savings: Savings[]) => {
  const months = generateHistoricalMonths();
  
  return months.map((month) => {
    const monthSavings = savings.filter(s => s.month === month);
    const total = monthSavings.reduce((sum, s) => sum + s.amount, 0);
    
    const date = new Date(month + '-01');
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
    
    return {
      month: monthLabel,
      monthKey: month,
      total,
    };
  });
};

export const generateCategoryData = (expenses: Expense[], month: string) => {
  const monthExpenses = expenses.filter(e => e.month === month);
  
  const categoryTotals: Record<string, number> = {};
  monthExpenses.forEach((expense) => {
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
  });
  
  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];
  
  const categoryNames: Record<string, string> = {
    psychologist: 'Psychologist',
    room: 'Room/Pilates',
    college: 'Education',
    debit_from_credit_card: 'Credit Card',
    groceries: 'Groceries',
    transportation: 'Transport',
    utilities: 'Utilities',
    internet: 'Internet',
    phone: 'Phone',
    gifts: 'Gifts',
    entertainment: 'Entertainment',
    clothing: 'Clothing',
    health: 'Health',
    dining: 'Dining',
    vacation: 'Vacation',
    other: 'Other',
  };
  
  return Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, value], index) => ({
      name: categoryNames[category] || category,
      value,
      color: colors[index % colors.length],
    }));
};
