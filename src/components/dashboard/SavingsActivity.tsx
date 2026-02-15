import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { convertToILS } from '@/lib/currencyUtils';
import { isDateUpToToday, isCurrentMonth } from '@/lib/dateUtils';
import { PiggyBank, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const SavingsActivity = () => {
  const { savings, recurringSavings, currentMonth } = useFinance();

  // Filter savings for current month (same logic as SavingsMonthlyActivity)
  const currentMonthDate = new Date(currentMonth + '-01');
  const monthlySavings = savings.filter(s => {
    if (s.month !== currentMonth) return false;
    if (!s.closed_at) return true;
    return new Date(s.closed_at) > currentMonthDate;
  });
  
  const shouldFilterByDate = isCurrentMonth(currentMonth);
  const savingsUpToDate = monthlySavings.filter(s => 
    !shouldFilterByDate || isDateUpToToday(s.updated_at)
  );

  // Get active recurring savings
  const activeRecurringSavings = recurringSavings.filter(rs => rs.is_active);

  // Get names already recorded this month
  const recordedSavingsNames = new Set(
    savingsUpToDate
      .filter(s => (s.action_amount && s.action_amount > 0) || (s.monthly_deposit && s.monthly_deposit > 0) || (s as any).is_completed)
      .map(s => s.name)
  );

  // Pending recurring savings not yet recorded
  const pendingRecurringSavings = activeRecurringSavings.filter(
    rs => !recordedSavingsNames.has(rs.name)
  );

  // Build combined activity items (same as SavingsMonthlyActivity)
  const activityItems = [
    ...savingsUpToDate
      .filter(s => (s.action_amount && s.action_amount > 0) || (s.monthly_deposit && s.monthly_deposit > 0))
      .map(s => ({
        id: s.id,
        name: s.name,
        action: (s.action || 'deposit') as 'deposit' | 'withdrawal',
        amount: (s.action_amount && s.action_amount > 0) ? Number(s.action_amount) : Number(s.monthly_deposit),
        date: s.updated_at,
        currency: s.currency || 'ILS',
        isRecurring: false,
      })),
    ...pendingRecurringSavings.map(rs => ({
      id: `recurring-${rs.id}`,
      name: rs.name,
      action: rs.action_type as 'deposit' | 'withdrawal',
      amount: Number(rs.default_amount),
      date: `${currentMonth}-${String(rs.day_of_month).padStart(2, '0')}`,
      currency: rs.currency || 'ILS',
      isRecurring: true,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate totals in ILS (matching SavingsMonthlyActivity)
  const totalDeposits = activityItems
    .filter(item => item.action === 'deposit')
    .reduce((sum, item) => sum + convertToILS(item.amount, item.currency), 0);

  const totalWithdrawals = activityItems
    .filter(item => item.action === 'withdrawal')
    .reduce((sum, item) => sum + convertToILS(item.amount, item.currency), 0);

  const netSavings = totalDeposits - totalWithdrawals;

  // Future savings not yet counted
  const futureSavings = monthlySavings.length - savingsUpToDate.length;

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Savings Activity</h3>
        <PiggyBank className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-success/10 text-center md:col-span-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ArrowUpRight className="h-4 w-4 text-success" />
            <p className="text-xs text-muted-foreground">Deposits</p>
          </div>
          <p className="text-lg font-bold text-success">+{formatCurrency(totalDeposits)}</p>
        </div>
        <div className="p-3 rounded-lg bg-destructive/10 text-center md:col-span-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ArrowDownRight className="h-4 w-4 text-destructive" />
            <p className="text-xs text-muted-foreground">Withdrawals</p>
          </div>
          <p className="text-lg font-bold text-destructive">-{formatCurrency(totalWithdrawals)}</p>
        </div>
        <div className={cn(
          "p-3 rounded-lg text-center md:col-span-2",
          netSavings >= 0 ? "bg-primary/10" : "bg-warning/10"
        )}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingUp className={cn(
              "h-4 w-4",
              netSavings >= 0 ? "text-primary" : "text-warning"
            )} />
            <p className="text-xs text-muted-foreground">Net Change</p>
          </div>
          <p className={cn(
            "text-lg font-bold",
            netSavings >= 0 ? "text-primary" : "text-warning"
          )}>
            {netSavings >= 0 ? '+' : ''}{formatCurrency(netSavings)}
          </p>
        </div>
      </div>

      {/* Activity List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {activityItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 col-span-full">
            No savings activity this month
          </p>
        ) : (
          activityItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-1.5 rounded-lg",
                  item.action === 'withdrawal' 
                    ? "bg-destructive/20 text-destructive" 
                    : "bg-success/20 text-success"
                )}>
                  {item.action === 'withdrawal' 
                    ? <ArrowDownRight className="h-3 w-3" />
                    : <ArrowUpRight className="h-3 w-3" />
                  }
                </div>
                <p className="text-sm font-medium">{item.name}</p>
              </div>
              <p className={cn(
                "text-sm font-semibold",
                item.action === 'withdrawal' ? "text-destructive" : "text-success"
              )}>
                {item.action === 'withdrawal' ? '-' : '+'}
                {formatCurrency(item.amount, item.currency)}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer info */}
      {futureSavings > 0 && (
        <div className="text-xs text-muted-foreground pt-3 mt-2 border-t border-border/50">
          <span className="text-warning">+{futureSavings} future entries pending</span>
        </div>
      )}
    </div>
  );
};

export default SavingsActivity;
