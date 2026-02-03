import {
  IncomeExpenseChart,
  SpendingByCategoryChart,
  SavingsGrowthChart,
} from '@/components/charts/FinanceCharts';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { mockMonthlyData } from '@/lib/mockData';

const AnalyticsPage = () => {
  const { incomes, expenses, savings, currentMonth } = useFinance();

  const monthlyIncome = incomes
    .filter((i) => i.month === currentMonth)
    .reduce((sum, i) => sum + i.amount, 0);

  const monthlyExpenses = expenses
    .filter((e) => e.month === currentMonth)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSavings = savings
    .filter((s) => s.type === 'savings')
    .reduce((sum, s) => sum + s.amount, 0);

  const savingsRate = monthlyIncome > 0 
    ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) 
    : 0;

  // Calculate averages
  const avgIncome = mockMonthlyData.reduce((sum, m) => sum + m.income, 0) / mockMonthlyData.length;
  const avgExpenses = mockMonthlyData.reduce((sum, m) => sum + m.expenses, 0) / mockMonthlyData.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Deep dive into your financial data
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="glass rounded-xl p-4 text-center animate-slide-up">
          <p className="text-sm text-muted-foreground mb-1">Savings Rate</p>
          <p className="text-2xl font-bold text-primary">{savingsRate.toFixed(1)}%</p>
        </div>
        <div className="glass rounded-xl p-4 text-center animate-slide-up">
          <p className="text-sm text-muted-foreground mb-1">Avg. Income</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(avgIncome)}</p>
        </div>
        <div className="glass rounded-xl p-4 text-center animate-slide-up">
          <p className="text-sm text-muted-foreground mb-1">Avg. Expenses</p>
          <p className="text-2xl font-bold text-destructive">{formatCurrency(avgExpenses)}</p>
        </div>
        <div className="glass rounded-xl p-4 text-center animate-slide-up">
          <p className="text-sm text-muted-foreground mb-1">Total Saved</p>
          <p className="text-2xl font-bold">{formatCurrency(totalSavings)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeExpenseChart />
        <SpendingByCategoryChart />
      </div>

      <SavingsGrowthChart />

      {/* Insights */}
      <div className="glass rounded-xl p-6 animate-slide-up">
        <h3 className="font-semibold mb-4">💡 Insights</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
            <span className="text-lg">📈</span>
            <div>
              <p className="font-medium text-success">Great savings rate!</p>
              <p className="text-sm text-muted-foreground">
                You're saving {savingsRate.toFixed(1)}% of your income. Keep it up!
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <span className="text-lg">💳</span>
            <div>
              <p className="font-medium text-warning">Credit card spending</p>
              <p className="text-sm text-muted-foreground">
                Your credit card debit makes up a significant portion of expenses. Consider reviewing recurring charges.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-lg">🎯</span>
            <div>
              <p className="font-medium text-primary">On track for goals</p>
              <p className="text-sm text-muted-foreground">
                At your current savings rate, you'll reach your laptop goal in approximately 6 months.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
