export const formatCurrency = (amount: number, currency: string = 'ILS'): string => {
  return new Intl.NumberFormat('en-IL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('he-IL').format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatMonth = (monthString: string): string => {
  const [year, month] = monthString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getDaysRemainingInMonth = (): number => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
};

export const calculateMonthsToGoal = (remaining: number, monthlyContribution: number): number => {
  if (monthlyContribution <= 0) return Infinity;
  return Math.ceil(remaining / monthlyContribution);
};

export const getProgressPercentage = (current: number, target: number): number => {
  if (target <= 0) return 0;
  return Math.min((current / target) * 100, 100);
};

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    room: 'hsl(var(--chart-1))',
    gifts: 'hsl(var(--chart-2))',
    psychologist: 'hsl(var(--chart-3))',
    college: 'hsl(var(--chart-4))',
    vacation: 'hsl(var(--chart-5))',
    total: 'hsl(var(--primary))',
    debit_from_credit_card: 'hsl(var(--warning))',
    budget: 'hsl(var(--accent))',
    other: 'hsl(var(--muted-foreground))',
  };
  return colors[category] || colors.other;
};

export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    high: 'hsl(var(--destructive))',
    medium: 'hsl(var(--warning))',
    low: 'hsl(var(--success))',
  };
  return colors[priority] || colors.low;
};
