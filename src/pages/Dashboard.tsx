import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency, formatMonth } from '@/lib/formatters';
import StatCard from '@/components/dashboard/StatCard';
import BudgetProgress from '@/components/dashboard/BudgetProgress';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import SavingsGoals from '@/components/dashboard/SavingsGoals';
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

const Dashboard = () => {
  const { incomes, expenses, savings, bankAccount, currentMonth } = useFinance();

  const monthlyIncome = incomes
    .filter((i) => i.month === currentMonth)
    .reduce((sum, i) => sum + i.amount, 0);

  const monthlyExpenses = expenses
    .filter((e) => e.month === currentMonth)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSavings = savings
    .filter((s) => s.type === 'savings')
    .reduce((sum, s) => sum + s.amount, 0);

  const netWorth = bankAccount.currentBalance + totalSavings;

  const netFlow = monthlyIncome - monthlyExpenses;

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
        <div className="glass rounded-lg px-4 py-2 flex items-center gap-3">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Bank Balance</p>
            <p className="font-semibold">{formatCurrency(bankAccount.currentBalance)}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Income"
          value={formatCurrency(monthlyIncome)}
          icon={<Wallet className="h-5 w-5" />}
          trend="up"
          trendValue="+2.5% vs last month"
          variant="success"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(monthlyExpenses)}
          icon={<CreditCard className="h-5 w-5" />}
          trend="down"
          trendValue="-5.2% vs last month"
        />
        <StatCard
          title="Total Savings"
          value={formatCurrency(totalSavings)}
          icon={<PiggyBank className="h-5 w-5" />}
          trend="up"
          trendValue="+₪3,500 this month"
        />
        <StatCard
          title="Net Worth"
          value={formatCurrency(netWorth)}
          icon={netFlow >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          subtitle={`Net flow: ${netFlow >= 0 ? '+' : ''}${formatCurrency(netFlow)}`}
          variant={netFlow >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeExpenseChart />
        <SpendingByCategoryChart />
      </div>

      {/* Middle Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <BudgetProgress />
        <RecentTransactions />
        <SavingsGoals />
      </div>

      {/* Savings Growth Chart */}
      <SavingsGrowthChart />
    </div>
  );
};

export default Dashboard;
