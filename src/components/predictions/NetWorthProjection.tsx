import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { TrendingUp, TrendingDown, AlertCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg p-3 shadow-lg border border-border/50">
        <p className="text-sm font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const NetWorthProjection = () => {
  const { 
    currentMonth, 
    savings, 
    bankAccount,
    recurringIncomes,
    recurringPayments,
    recurringSavings,
  } = useFinance();

  // Calculate current total net worth (savings + bank balance)
  const currentNetWorth = savings.reduce((sum, s) => sum + s.amount, 0) + bankAccount.currentBalance;

  // Calculate monthly projections
  const monthlyRecurringIncome = recurringIncomes
    .filter(i => i.isActive)
    .reduce((sum, i) => sum + i.defaultAmount, 0);

  const monthlyRecurringExpenses = recurringPayments
    .filter(p => p.isActive)
    .reduce((sum, p) => sum + p.defaultAmount, 0);

  const monthlyRecurringSavings = recurringSavings
    .filter(s => s.isActive && s.actionType === 'deposit')
    .reduce((sum, s) => sum + s.defaultAmount, 0);

  const monthlyRecurringWithdrawals = recurringSavings
    .filter(s => s.isActive && s.actionType === 'withdrawal')
    .reduce((sum, s) => sum + s.defaultAmount, 0);

  const netMonthlyCashFlow = monthlyRecurringIncome - monthlyRecurringExpenses - monthlyRecurringSavings + monthlyRecurringWithdrawals;
  const netMonthlySavingsGrowth = monthlyRecurringSavings - monthlyRecurringWithdrawals;

  // Generate projection data for next 12 months
  const generateProjections = () => {
    const projections = [];
    const [currentYear, currentMonthNum] = currentMonth.split('-').map(Number);
    
    let runningNetWorth = currentNetWorth;
    
    for (let i = 0; i <= 12; i++) {
      const date = new Date(currentYear, currentMonthNum - 1 + i, 1);
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const isCurrentMonth = monthKey === currentMonth;
      const isPast = new Date(monthKey) < new Date(currentMonth);
      
      projections.push({
        month: monthLabel,
        monthKey,
        netWorth: runningNetWorth,
        projectedIncome: monthlyRecurringIncome,
        projectedExpenses: monthlyRecurringExpenses,
        isProjection: !isCurrentMonth && !isPast,
        isCurrent: isCurrentMonth,
      });
      
      // Add monthly growth for future months
      if (!isCurrentMonth && !isPast) {
        runningNetWorth += netMonthlySavingsGrowth;
      }
    }
    
    return projections;
  };

  const projectionData = generateProjections();
  const futureProjections = projectionData.filter(p => p.isProjection);
  const finalProjectedNetWorth = futureProjections.length > 0 
    ? futureProjections[futureProjections.length - 1].netWorth 
    : currentNetWorth;
  const totalGrowth = finalProjectedNetWorth - currentNetWorth;
  const growthPercentage = currentNetWorth > 0 ? (totalGrowth / currentNetWorth) * 100 : 0;

  // Check if viewing a future month
  const viewingFutureMonth = new Date(currentMonth) > new Date(new Date().toISOString().slice(0, 7));
  const currentProjection = projectionData.find(p => p.monthKey === currentMonth);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Current Net Worth</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(currentNetWorth)}</p>
        </div>
        
        <div className="glass rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            {netMonthlySavingsGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <span className="text-sm text-muted-foreground">Monthly Savings Rate</span>
          </div>
          <p className={cn(
            "text-2xl font-bold",
            netMonthlySavingsGrowth >= 0 ? "text-success" : "text-destructive"
          )}>
            {netMonthlySavingsGrowth >= 0 ? '+' : ''}{formatCurrency(netMonthlySavingsGrowth)}
          </p>
        </div>
        
        <div className="glass rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">12-Month Projection</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(finalProjectedNetWorth)}</p>
          <p className={cn(
            "text-xs",
            totalGrowth >= 0 ? "text-success" : "text-destructive"
          )}>
            {totalGrowth >= 0 ? '+' : ''}{formatCurrency(totalGrowth)} ({growthPercentage.toFixed(1)}%)
          </p>
        </div>
      </div>

      {/* Future Month Alert */}
      {viewingFutureMonth && currentProjection && (
        <div className="glass rounded-xl p-5 shadow-card border-2 border-primary/30 animate-slide-up">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-primary mb-1">Future Month Projection</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Based on your recurring incomes and expenses, here's what we predict for this month:
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="bg-success/10 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Expected Income</p>
                  <p className="text-lg font-bold text-success">+{formatCurrency(monthlyRecurringIncome)}</p>
                </div>
                <div className="bg-destructive/10 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Expected Expenses</p>
                  <p className="text-lg font-bold text-destructive">-{formatCurrency(monthlyRecurringExpenses)}</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Projected Net Worth</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(currentProjection.netWorth)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projection Chart */}
      <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
        <h3 className="font-semibold mb-4">Net Worth Projection</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                x={projectionData.find(p => p.isCurrent)?.month} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="5 5"
                label={{ value: 'Today', position: 'top', fill: 'hsl(var(--primary))' }}
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                name="Net Worth"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#netWorthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Projection based on {recurringIncomes.filter(i => i.isActive).length} active income sources, 
          {' '}{recurringPayments.filter(p => p.isActive).length} recurring payments, 
          and {recurringSavings.filter(s => s.isActive).length} recurring savings
        </p>
      </div>

      {/* Monthly Breakdown */}
      <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
        <h3 className="font-semibold mb-4">Monthly Cash Flow Summary</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 rounded-lg bg-success/10">
            <p className="text-xs text-muted-foreground mb-1">Recurring Income</p>
            <p className="text-xl font-bold text-success">+{formatCurrency(monthlyRecurringIncome)}</p>
          </div>
          <div className="p-4 rounded-lg bg-destructive/10">
            <p className="text-xs text-muted-foreground mb-1">Recurring Expenses</p>
            <p className="text-xl font-bold text-destructive">-{formatCurrency(monthlyRecurringExpenses)}</p>
          </div>
          <div className="p-4 rounded-lg bg-primary/10">
            <p className="text-xs text-muted-foreground mb-1">Savings Deposits</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(monthlyRecurringSavings)}</p>
          </div>
          <div className={cn(
            "p-4 rounded-lg",
            netMonthlyCashFlow >= 0 ? "bg-success/10" : "bg-destructive/10"
          )}>
            <p className="text-xs text-muted-foreground mb-1">Net Cash Flow</p>
            <p className={cn(
              "text-xl font-bold",
              netMonthlyCashFlow >= 0 ? "text-success" : "text-destructive"
            )}>
              {netMonthlyCashFlow >= 0 ? '+' : ''}{formatCurrency(netMonthlyCashFlow)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetWorthProjection;
