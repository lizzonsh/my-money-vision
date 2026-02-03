import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { isDateUpToToday, isCurrentMonth } from '@/lib/dateUtils';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const SavingsMonthlyActivity = () => {
  const { savings, currentMonth } = useFinance();

  // Filter savings for current month only
  const monthlySavings = savings.filter(s => s.month === currentMonth);
  
  // For current month, only count items up to today's date
  const shouldFilterByDate = isCurrentMonth(currentMonth);
  const savingsUpToDate = monthlySavings.filter(s => 
    !shouldFilterByDate || isDateUpToToday(s.updated_at)
  );

  // Calculate deposits for this month (action_amount where action is deposit)
  const monthlyDeposits = savingsUpToDate
    .filter(s => s.action === 'deposit' && s.action_amount)
    .reduce((sum, s) => sum + Number(s.action_amount || 0), 0);

  // Calculate withdrawals for this month
  const monthlyWithdrawals = savingsUpToDate
    .filter(s => s.action === 'withdrawal' && s.action_amount)
    .reduce((sum, s) => sum + Number(s.action_amount || 0), 0);

  // Net change
  const netChange = monthlyDeposits - monthlyWithdrawals;

  // Get activity items for display
  const activityItems = savingsUpToDate
    .filter(s => s.action_amount && s.action_amount > 0)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  // Format month for display
  const [year, month] = currentMonth.split('-');
  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="mb-4">
        <h3 className="font-semibold">Monthly Activity</h3>
        <p className="text-xs text-muted-foreground">{monthName}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ArrowUpRight className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">Deposits</span>
          </div>
          <p className="text-lg font-bold text-success">{formatCurrency(monthlyDeposits)}</p>
        </div>
        
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ArrowDownRight className="h-4 w-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Withdrawals</span>
          </div>
          <p className="text-lg font-bold text-destructive">{formatCurrency(monthlyWithdrawals)}</p>
        </div>
        
        <div className={cn(
          "p-3 rounded-lg text-center border",
          netChange > 0 
            ? "bg-success/10 border-success/20" 
            : netChange < 0 
              ? "bg-destructive/10 border-destructive/20"
              : "bg-muted/50 border-muted"
        )}>
          <div className="flex items-center justify-center gap-1 mb-1">
            {netChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : netChange < 0 ? (
              <TrendingDown className="h-4 w-4 text-destructive" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">Net</span>
          </div>
          <p className={cn(
            "text-lg font-bold",
            netChange > 0 ? "text-success" : netChange < 0 ? "text-destructive" : "text-muted-foreground"
          )}>
            {netChange > 0 ? '+' : ''}{formatCurrency(netChange)}
          </p>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Transactions</p>
        {activityItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No savings activity this month
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activityItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  item.action === 'withdrawal'
                    ? "bg-destructive/10 border border-destructive/20"
                    : "bg-success/10 border border-success/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    item.action === 'withdrawal'
                      ? "bg-destructive/20 text-destructive"
                      : "bg-success/20 text-success"
                  )}>
                    {item.action === 'withdrawal' ? (
                      <ArrowDownRight className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.action}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-semibold",
                    item.action === 'withdrawal' ? "text-destructive" : "text-success"
                  )}>
                    {item.action === 'withdrawal' ? '-' : '+'}{formatCurrency(Number(item.action_amount))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavingsMonthlyActivity;
