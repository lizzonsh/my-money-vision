import { useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg p-3 shadow-lg border border-border/50">
        <p className="text-sm font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>{entry.name}: {formatCurrency(entry.value)}</p>
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
    totalBankBalance, 
    getTotalBalanceForMonth,
    recurringIncomes, 
    recurringPayments, 
    recurringSavings 
  } = useFinance();

  // Calculate current net worth properly - deduplicate savings by name, get latest per account
  const currentNetWorth = useMemo(() => {
    const currentMonthDate = new Date(currentMonth + '-01');
    
    // Get latest savings per account name up to current month
    const latestSavingsPerName = savings
      .filter(s => s.month <= currentMonth)
      .filter(s => {
        if (!s.closed_at) return true;
        const closedDate = new Date(s.closed_at);
        return closedDate > currentMonthDate;
      })
      .reduce((acc, saving) => {
        const existing = acc.get(saving.name);
        if (!existing || new Date(saving.updated_at) > new Date(existing.updated_at)) {
          acc.set(saving.name, saving);
        }
        return acc;
      }, new Map<string, typeof savings[0]>());
    
    const totalSavings = Array.from(latestSavingsPerName.values())
      .reduce((sum, s) => sum + Number(s.amount), 0);
    
    // Get bank balance for current month
    const bankBalance = getTotalBalanceForMonth(currentMonth) || totalBankBalance;
    
    return totalSavings + bankBalance;
  }, [savings, currentMonth, totalBankBalance, getTotalBalanceForMonth]);

  // Calculate monthly recurring flows
  const monthlyRecurringIncome = recurringIncomes
    .filter(i => i.is_active)
    .reduce((sum, i) => sum + Number(i.default_amount), 0);
  
  const monthlyRecurringExpenses = recurringPayments
    .filter(p => p.is_active)
    .reduce((sum, p) => sum + Number(p.default_amount), 0);
  
  const monthlyRecurringSavings = recurringSavings
    .filter(s => s.is_active && s.action_type === 'deposit')
    .reduce((sum, s) => sum + Number(s.default_amount), 0);
  
  const monthlyRecurringWithdrawals = recurringSavings
    .filter(s => s.is_active && s.action_type === 'withdrawal')
    .reduce((sum, s) => sum + Number(s.default_amount), 0);

  // Net monthly growth = income - expenses (what stays in the system)
  // Savings deposits/withdrawals just move money between bank and savings, they don't change net worth
  const netMonthlyGrowth = monthlyRecurringIncome - monthlyRecurringExpenses;
  
  // Net cash flow for bank account (after savings movements)
  const netMonthlyCashFlow = monthlyRecurringIncome - monthlyRecurringExpenses - monthlyRecurringSavings + monthlyRecurringWithdrawals;

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
        isProjection: !isCurrentMonth && !isPast, 
        isCurrent: isCurrentMonth 
      });
      
      // Add net growth for future months
      if (!isCurrentMonth && !isPast) {
        runningNetWorth += netMonthlyGrowth;
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Current Net Worth</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(currentNetWorth)}</p>
          <p className="text-xs text-muted-foreground">Savings + Bank Balance</p>
        </div>
        <div className="glass rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            {netMonthlyGrowth >= 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
            <span className="text-sm text-muted-foreground">Monthly Net Growth</span>
          </div>
          <p className={cn("text-2xl font-bold", netMonthlyGrowth >= 0 ? "text-success" : "text-destructive")}>
            {netMonthlyGrowth >= 0 ? '+' : ''}{formatCurrency(netMonthlyGrowth)}
          </p>
          <p className="text-xs text-muted-foreground">Income - Expenses</p>
        </div>
        <div className="glass rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">12-Month Projection</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(finalProjectedNetWorth)}</p>
          <p className={cn("text-xs", totalGrowth >= 0 ? "text-success" : "text-destructive")}>
            {totalGrowth >= 0 ? '+' : ''}{formatCurrency(totalGrowth)} ({growthPercentage.toFixed(1)}%)
          </p>
        </div>
      </div>

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
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={projectionData.find(p => p.isCurrent)?.month} stroke="hsl(var(--primary))" strokeDasharray="5 5" />
              <Area type="monotone" dataKey="netWorth" name="Net Worth" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#netWorthGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

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
          <div className={cn("p-4 rounded-lg", netMonthlyCashFlow >= 0 ? "bg-success/10" : "bg-destructive/10")}>
            <p className="text-xs text-muted-foreground mb-1">Net Cash Flow</p>
            <p className={cn("text-xl font-bold", netMonthlyCashFlow >= 0 ? "text-success" : "text-destructive")}>
              {netMonthlyCashFlow >= 0 ? '+' : ''}{formatCurrency(netMonthlyCashFlow)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetWorthProjection;
