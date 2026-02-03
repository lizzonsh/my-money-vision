import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { isDateUpToToday, isCurrentMonth } from '@/lib/dateUtils';
import { PiggyBank, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const SavingsActivity = () => {
  const { savings, currentMonth } = useFinance();

  // Filter savings for current month
  const monthlySavings = savings.filter((s) => s.month === currentMonth);
  
  // For current month, only count items up to today's date
  const shouldFilterByDate = isCurrentMonth(currentMonth);
  const savingsUpToDate = monthlySavings.filter(s => 
    !shouldFilterByDate || isDateUpToToday(s.updateDate)
  );

  // Calculate totals
  const deposits = savingsUpToDate.filter(s => s.action === 'deposit');
  const withdrawals = savingsUpToDate.filter(s => s.action === 'withdrawal');
  
  const totalDeposits = deposits.reduce((sum, s) => sum + (s.actionAmount || s.recurring?.monthlyDeposit || 0), 0);
  const totalWithdrawals = withdrawals.reduce((sum, s) => sum + (s.actionAmount || 0), 0);
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
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-success/10 text-center">
          <ArrowUpRight className="h-4 w-4 text-success mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Deposits</p>
          <p className="text-sm font-semibold text-success">+{formatCurrency(totalDeposits)}</p>
        </div>
        <div className="p-3 rounded-lg bg-destructive/10 text-center">
          <ArrowDownRight className="h-4 w-4 text-destructive mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Withdrawals</p>
          <p className="text-sm font-semibold text-destructive">-{formatCurrency(totalWithdrawals)}</p>
        </div>
        <div className={cn(
          "p-3 rounded-lg text-center",
          netSavings >= 0 ? "bg-primary/10" : "bg-warning/10"
        )}>
          <TrendingUp className={cn(
            "h-4 w-4 mx-auto mb-1",
            netSavings >= 0 ? "text-primary" : "text-warning"
          )} />
          <p className="text-xs text-muted-foreground">Net</p>
          <p className={cn(
            "text-sm font-semibold",
            netSavings >= 0 ? "text-primary" : "text-warning"
          )}>
            {netSavings >= 0 ? '+' : ''}{formatCurrency(netSavings)}
          </p>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {savingsUpToDate.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No savings activity this month
          </p>
        ) : (
          savingsUpToDate.slice(0, 5).map((saving) => (
            <div
              key={saving._id}
              className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-1.5 rounded-lg",
                  saving.action === 'withdrawal' 
                    ? "bg-destructive/20 text-destructive" 
                    : "bg-success/20 text-success"
                )}>
                  {saving.action === 'withdrawal' 
                    ? <ArrowDownRight className="h-3 w-3" />
                    : <ArrowUpRight className="h-3 w-3" />
                  }
                </div>
                <div>
                  <p className="text-sm font-medium">{saving.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {saving.updateDate ? formatDate(saving.updateDate) : ''}
                  </p>
                </div>
              </div>
              <p className={cn(
                "text-sm font-semibold",
                saving.action === 'withdrawal' ? "text-destructive" : "text-success"
              )}>
                {saving.action === 'withdrawal' ? '-' : '+'}
                {formatCurrency(saving.actionAmount || saving.recurring?.monthlyDeposit || 0)}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer info */}
      {(savingsUpToDate.length > 5 || futureSavings > 0) && (
        <div className="flex justify-between text-xs text-muted-foreground pt-3 mt-2 border-t border-border/50">
          {savingsUpToDate.length > 5 && (
            <span>+{savingsUpToDate.length - 5} more entries</span>
          )}
          {futureSavings > 0 && (
            <span className="text-warning">+{futureSavings} future</span>
          )}
        </div>
      )}
    </div>
  );
};

export default SavingsActivity;
