import { useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency, formatMonth } from '@/lib/formatters';
import { isDateUpToToday, isCurrentMonth } from '@/lib/dateUtils';
import { convertToILS } from '@/lib/currencyUtils';
import StatCard from '@/components/dashboard/StatCard';
import BudgetProgress from '@/components/dashboard/BudgetProgress';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import SavingsGoals from '@/components/dashboard/SavingsGoals';
import SavingsActivity from '@/components/dashboard/SavingsActivity';
import MonthNavigation from '@/components/navigation/MonthNavigation';
import BankBalanceCard from '@/components/dashboard/BankBalanceCard';
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
  const { incomes, expenses, savings, recurringSavings, totalBankBalance, currentMonth, isLoading, getTotalBalanceForMonth } = useFinance();
  
  // Get bank balance for the selected month (from history or current)
  const monthlyBankBalance = getTotalBalanceForMonth(currentMonth) || totalBankBalance;

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
    // Match ExpensesList logic: exclude planned credit card expenses to avoid double-counting
    // (they will be counted when they appear as debit_from_credit_card)
    const expensesUpToDate = expenses
      .filter((e) => e.month === currentMonth)
      .filter((e) => !shouldFilterByDate || isDateUpToToday(e.expense_date));
    
    // Regular expenses excluding planned credit card (to avoid double-counting)
    const regularExpenses = expensesUpToDate.filter(e => 
      e.category !== 'debit_from_credit_card' && 
      !(e.payment_method === 'credit_card' && e.kind === 'planned')
    );
    
    // Credit card debits (actual withdrawals from bank)
    const creditCardDebitTotal = expensesUpToDate
      .filter(e => e.category === 'debit_from_credit_card')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    // Bank transfers + credit card paid + credit card debits = effective total
    const monthlyExpenses = regularExpenses.reduce((sum, e) => sum + Number(e.amount), 0) + creditCardDebitTotal;

    // Previous month expenses (full month)
    const prevMonthExpenses = expenses
      .filter((e) => e.month === prevMonth)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Current month savings deposits - sync with SavingsActivity/SavingsMonthlyActivity logic
    // Include actual deposits + pending recurring deposits
    const currentMonthDate = new Date(currentMonth + '-01');
    const monthlySavingsFiltered = savings.filter(s => {
      if (s.month !== currentMonth) return false;
      if (!s.closed_at) return true;
      return new Date(s.closed_at) > currentMonthDate;
    });
    const savingsUpToDate = monthlySavingsFiltered.filter(s => 
      !shouldFilterByDate || isDateUpToToday(s.updated_at)
    );
    
    // Get active recurring savings
    const activeRecurringSavingsItems = recurringSavings.filter(rs => rs.is_active);
    const recordedSavingsNames = new Set(
      savingsUpToDate
        .filter(s => (s.action_amount && s.action_amount > 0) || (s.monthly_deposit && s.monthly_deposit > 0))
        .map(s => s.name)
    );
    const pendingRecurringSavingsItems = activeRecurringSavingsItems.filter(
      rs => !recordedSavingsNames.has(rs.name)
    );
    
    // Total deposits = actual + pending recurring
    const actualDeposits = savingsUpToDate
      .filter(s => (s.action === 'deposit') && ((s.action_amount && s.action_amount > 0) || (s.monthly_deposit && s.monthly_deposit > 0)))
      .reduce((sum, s) => sum + convertToILS(Number(s.action_amount || s.monthly_deposit || 0), s.currency || 'ILS'), 0);
    
    const pendingDeposits = pendingRecurringSavingsItems
      .filter(rs => rs.action_type === 'deposit')
      .reduce((sum, rs) => sum + convertToILS(Number(rs.default_amount), rs.currency || 'ILS'), 0);
    
    const monthlySavingsDeposits = actualDeposits + pendingDeposits;

    // Previous month savings deposits - convert to ILS
    const prevMonthSavingsDeposits = savings
      .filter((s) => s.month === prevMonth && s.action === 'deposit')
      .reduce((sum, s) => sum + convertToILS(Number(s.action_amount || s.monthly_deposit || 0), s.currency || 'ILS'), 0);

    // Total savings portfolio - get latest record per account name UP TO selected month
    // Match the same logic as SavingsCurrentStatus for consistency
    const portfolioMonthDate = new Date(currentMonth + '-01');
    const latestSavingsPerName = savings
      .filter(s => s.month <= currentMonth) // Only include entries up to selected month
      .filter(s => {
        // Show if not closed, OR if closed after the selected month
        if (!s.closed_at) return true;
        const closedDate = new Date(s.closed_at);
        return closedDate > portfolioMonthDate;
      })
      .reduce((acc, saving) => {
        const existing = acc.get(saving.name);
        if (!existing || new Date(saving.updated_at) > new Date(existing.updated_at)) {
          acc.set(saving.name, saving);
        }
        return acc;
      }, new Map<string, typeof savings[0]>());
    
    const totalSavings = Array.from(latestSavingsPerName.values())
      .reduce((sum, s) => sum + convertToILS(Number(s.amount), s.currency || 'ILS'), 0);

    // Net worth = savings + incomes + bank balance - monthly expenses
    const netWorth = totalSavings + monthlyIncome + monthlyBankBalance - monthlyExpenses;
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
  }, [incomes, expenses, savings, recurringSavings, monthlyBankBalance, currentMonth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-xs sm:text-base text-muted-foreground">
              {formatMonth(currentMonth)} Overview
            </p>
          </div>
          <BankBalanceCard />
        </div>
        <MonthNavigation />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Income"
          value={formatCurrency(stats.monthlyIncome)}
          icon={<Wallet className="h-5 w-5" />}
          trend={stats.incomeTrend.trend}
          trendValue={stats.incomeTrend.value > 0 
            ? `${stats.incomeTrend.trend === 'up' ? '+' : '-'}${stats.incomeTrend.value.toFixed(1)}% vs last month` 
            : 'No change'}
          variant="success"
          href="/income"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(stats.monthlyExpenses)}
          icon={<CreditCard className="h-5 w-5" />}
          trend={stats.expenseTrend.trend === 'up' ? 'down' : stats.expenseTrend.trend === 'down' ? 'up' : 'neutral'}
          trendValue={stats.expenseTrend.value > 0 
            ? `${stats.expenseTrend.trend === 'up' ? '+' : '-'}${stats.expenseTrend.value.toFixed(1)}% vs last month` 
            : 'No change'}
          href="/expenses"
        />
        <StatCard
          title="Total Savings"
          value={formatCurrency(stats.totalSavings)}
          icon={<PiggyBank className="h-5 w-5" />}
          trend={stats.savingsTrend.trend}
          trendValue={stats.monthlySavingsDeposits > 0 
            ? `+${formatCurrency(stats.monthlySavingsDeposits)} this month` 
            : 'No deposits yet'}
          href="/savings"
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
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <IncomeExpenseChart />
        <SpendingByCategoryChart />
      </div>

      {/* Middle Section */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <BudgetProgress />
        <RecentTransactions />
        <SavingsGoals />
      </div>

      {/* Savings Activity - Full Width */}
      <SavingsActivity />

      {/* Savings Growth Chart */}
      <SavingsGrowthChart />
    </div>
  );
};

export default Dashboard;
