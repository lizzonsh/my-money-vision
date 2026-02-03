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
    !shouldFilterByDate || isDateUpToToday(s.updated_at)
  );

  // Calculate totals
  const deposits = savingsUpToDate.filter(s => s.action === 'deposit');
  const withdrawals = savingsUpToDate.filter(s => s.action === 'withdrawal');
  
  const totalDeposits = deposits.reduce((sum, s) => sum + Number(s.action_amount || s.monthly_deposit || 0), 0);
  const totalWithdrawals = withdrawals.reduce((sum, s) => sum + Number(s.action_amount || 0), 0);
  const netSavings = totalDeposits - totalWithdrawals;

  // Future savings not yet counted
  const futureSavings = monthlySavings.length - savingsUpToDate.length;

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Savings Activity</h3>
        <PiggyBank className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Summary Stats - Horizontal layout for full width */}
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

      {/* Recent Activity List - Grid layout for full width */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {savingsUpToDate.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 col-span-full">
            No savings activity this month
          </p>
        ) : (
          savingsUpToDate.map((saving) => (
            <div
              key={saving.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
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
                    {saving.updated_at ? formatDate(saving.updated_at.split('T')[0]) : ''}
                  </p>
                </div>
              </div>
              <p className={cn(
                "text-sm font-semibold",
                saving.action === 'withdrawal' ? "text-destructive" : "text-success"
              )}>
                {saving.action === 'withdrawal' ? '-' : '+'}
                {formatCurrency(Number(saving.action_amount || saving.monthly_deposit || 0))}
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
