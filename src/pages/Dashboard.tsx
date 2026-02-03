import { useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency, formatMonth } from '@/lib/formatters';
import { isDateUpToToday, isCurrentMonth } from '@/lib/dateUtils';
import StatCard from '@/components/dashboard/StatCard';
import BudgetProgress from '@/components/dashboard/BudgetProgress';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import SavingsGoals from '@/components/dashboard/SavingsGoals';
import SavingsActivity from '@/components/dashboard/SavingsActivity';
import MonthNavigation from '@/components/navigation/MonthNavigation';
import {
  IncomeExpenseChart,
  SpendingByCategoryChart,
  SavingsGrowthChart,
} from '@/components/charts/FinanceCharts';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  CreditCard,
  Building2,
} from 'lucide-react';

// Helper to get previous month string
const getPreviousMonth = (month: string): string => {
  const [year, monthNum] = month.split('-').map(Number);
  const prevDate = new Date(year, monthNum - 2, 1);
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
};

// Calculate percentage change
const calcPercentChange = (current: number, previous: number): { value: number; trend: 'up' | 'down' | 'neutral' } => {
  if (previous === 0) return { value: 0, trend: 'neutral' };
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(change),
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
  };
};

const Dashboard = () => {
  const { incomes, expenses, savings, totalBankBalance, currentMonth, isLoading } = useFinance();

  const stats = useMemo(() => {
    // For current month, only count items up to today's date
    const shouldFilterByDate = isCurrentMonth(currentMonth);
    const prevMonth = getPreviousMonth(currentMonth);

    // Current month income (filtered by date for current month)
    const monthlyIncome = incomes
      .filter((i) => i.month === currentMonth)
      .filter((i) => !shouldFilterByDate || isDateUpToToday(i.income_date || ''))
      .reduce((sum, i) => sum + Number(i.amount), 0);

    // Previous month income (full month)
    const prevMonthIncome = incomes
      .filter((i) => i.month === prevMonth)
      .reduce((sum, i) => sum + Number(i.amount), 0);

    // Current month expenses (filtered by date for current month)
    const monthlyExpenses = expenses
      .filter((e) => e.month === currentMonth)
      .filter((e) => !shouldFilterByDate || isDateUpToToday(e.expense_date))
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Previous month expenses (full month)
    const prevMonthExpenses = expenses
      .filter((e) => e.month === prevMonth)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Current month savings deposits (filtered by date for current month)
    const monthlySavingsDeposits = savings
      .filter((s) => s.month === currentMonth && s.action === 'deposit')
      .filter((s) => !shouldFilterByDate || isDateUpToToday(s.updated_at))
      .reduce((sum, s) => sum + Number(s.action_amount || s.monthly_deposit || 0), 0);

    // Previous month savings deposits
    const prevMonthSavingsDeposits = savings
      .filter((s) => s.month === prevMonth && s.action === 'deposit')
      .reduce((sum, s) => sum + Number(s.action_amount || s.monthly_deposit || 0), 0);

    // Total savings balance (current amounts, filtered by date for current month entries)
    const totalSavings = savings
      .filter((s) => s.action !== 'withdrawal')
      .filter((s) => !isCurrentMonth(s.month) || !shouldFilterByDate || isDateUpToToday(s.updated_at))
      .reduce((sum, s) => sum + Number(s.amount), 0);

    const netWorth = totalBankBalance + totalSavings;
    const netFlow = monthlyIncome - monthlyExpenses;

    // Calculate trends
    const incomeTrend = calcPercentChange(monthlyIncome, prevMonthIncome);
    const expenseTrend = calcPercentChange(monthlyExpenses, prevMonthExpenses);
    const savingsTrend = calcPercentChange(monthlySavingsDeposits, prevMonthSavingsDeposits);

    return {
      monthlyIncome,
      monthlyExpenses,
      totalSavings,
      monthlySavingsDeposits,
      netWorth,
      netFlow,
      incomeTrend,
      expenseTrend,
      savingsTrend,
    };
  }, [incomes, expenses, savings, totalBankBalance, currentMonth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {formatMonth(currentMonth)} Overview
          </p>
        </div>
        <div className="flex items-center gap-4">
          <MonthNavigation />
          <div className="glass rounded-lg px-4 py-2 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Bank Balance</p>
              <p className="font-semibold">{formatCurrency(totalBankBalance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Income"
          value={formatCurrency(stats.monthlyIncome)}
          icon={<Wallet className="h-5 w-5" />}
          trend={stats.incomeTrend.trend}
          trendValue={stats.incomeTrend.value > 0 
            ? `${stats.incomeTrend.trend === 'up' ? '+' : '-'}${stats.incomeTrend.value.toFixed(1)}% vs last month` 
            : 'No change'}
          variant="success"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(stats.monthlyExpenses)}
          icon={<CreditCard className="h-5 w-5" />}
          trend={stats.expenseTrend.trend === 'up' ? 'down' : stats.expenseTrend.trend === 'down' ? 'up' : 'neutral'}
          trendValue={stats.expenseTrend.value > 0 
            ? `${stats.expenseTrend.trend === 'up' ? '+' : '-'}${stats.expenseTrend.value.toFixed(1)}% vs last month` 
            : 'No change'}
        />
        <StatCard
          title="Total Savings"
          value={formatCurrency(stats.totalSavings)}
          icon={<PiggyBank className="h-5 w-5" />}
          trend={stats.savingsTrend.trend}
          trendValue={stats.monthlySavingsDeposits > 0 
            ? `+${formatCurrency(stats.monthlySavingsDeposits)} this month` 
            : 'No deposits yet'}
        />
        <StatCard
          title="Net Worth"
          value={formatCurrency(stats.netWorth)}
          icon={stats.netFlow >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          subtitle={`Net flow: ${stats.netFlow >= 0 ? '+' : ''}${formatCurrency(stats.netFlow)}`}
          variant={stats.netFlow >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeExpenseChart />
        <SpendingByCategoryChart />
      </div>

      {/* Middle Section */}
      <div className="grid gap-6 lg:grid-cols-4">
        <BudgetProgress />
        <RecentTransactions />
        <SavingsActivity />
        <SavingsGoals />
      </div>

      {/* Savings Growth Chart */}
      <SavingsGrowthChart />
    </div>
  );
};

export default Dashboard;
