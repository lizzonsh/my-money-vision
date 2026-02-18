import { useMemo } from 'react';
import { useFinance, Savings } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { convertToILS } from '@/lib/currencyUtils';
import { isDateUpToToday, isCurrentMonth } from '@/lib/dateUtils';
import { TrendingUp, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';

const SavingsPredictionPortfolio = () => {
  const { savings, recurringSavings, currentMonth } = useFinance();

  const currentMonthDate = new Date(currentMonth + '-01');
  const shouldFilterByDate = isCurrentMonth(currentMonth);

  // Get latest balance per account (same logic as SavingsCurrentStatus)
  const latestSavingsPerName = useMemo(() => {
    return savings
      .filter(s => s.month <= currentMonth)
      .filter(s => {
        if (!s.closed_at) return true;
        return new Date(s.closed_at) > currentMonthDate;
      })
      .reduce((acc, saving) => {
        const existing = acc.get(saving.name);
        if (!existing || new Date(saving.updated_at) > new Date(existing.updated_at)) {
          acc.set(saving.name, saving);
        }
        return acc;
      }, new Map<string, Savings>());
  }, [savings, currentMonth]);

  // Get this month's activity items (same logic as SavingsMonthlyActivity)
  const monthlySavings = savings.filter(s => {
    if (s.month !== currentMonth) return false;
    if (!s.closed_at) return true;
    return new Date(s.closed_at) > currentMonthDate;
  });

  const savingsUpToDate = monthlySavings.filter(s =>
    !shouldFilterByDate || isDateUpToToday(s.updated_at)
  );

  const activeRecurringSavings = recurringSavings.filter(rs => rs.is_active);

  const recordedSavingsNames = new Set(
    savingsUpToDate
      .filter(s => (s.action_amount && s.action_amount > 0) || (s.monthly_deposit && s.monthly_deposit > 0) || (s as any).is_completed)
      .map(s => s.name)
  );

  // Find uncompleted (not crossed over) actual transactions
  const uncompletedTransactions = savingsUpToDate.filter(s =>
    ((s.action_amount && s.action_amount > 0) || (s.monthly_deposit && s.monthly_deposit > 0)) &&
    !(s as any).is_completed
  );

  // Find pending recurring (not yet recorded at all)
  const pendingRecurring = activeRecurringSavings.filter(
    rs => !recordedSavingsNames.has(rs.name)
  );

  // Build predicted balance per account
  const predictedPerAccount = useMemo(() => {
    const accountMap = new Map<string, { current: number; predicted: number; currency: string; pendingItems: Array<{ action: string; amount: number }> }>();

    // Initialize with current balances (only includes already crossed-over transactions)
    latestSavingsPerName.forEach((saving, name) => {
      accountMap.set(name, {
        current: Number(saving.amount),
        predicted: Number(saving.amount),
        currency: saving.currency || 'ILS',
        pendingItems: [],
      });
    });

    // Add uncompleted manual/actual transactions (not yet crossed over, so not in balance yet)
    uncompletedTransactions.forEach(s => {
      const entry = accountMap.get(s.name);
      if (entry) {
        const amount = Number(s.action_amount || s.monthly_deposit || 0);
        const action = s.action || 'deposit';
        if (action === 'deposit') {
          entry.predicted += amount;
          entry.pendingItems.push({ action: 'deposit', amount });
        } else {
          entry.predicted -= amount;
          entry.pendingItems.push({ action: 'withdrawal', amount });
        }
      }
    });

    // Add pending recurring savings (no record at all yet for this month)
    pendingRecurring.forEach(rs => {
      const entry = accountMap.get(rs.name);
      if (entry) {
        const amount = Number(rs.default_amount);
        if (rs.action_type === 'deposit') {
          entry.predicted += amount;
          entry.pendingItems.push({ action: 'deposit', amount });
        } else {
          entry.predicted -= amount;
          entry.pendingItems.push({ action: 'withdrawal', amount });
        }
      }
    });

    return accountMap;
  }, [latestSavingsPerName, uncompletedTransactions, pendingRecurring]);

  const totalCurrentILS = Array.from(latestSavingsPerName.values())
    .reduce((sum, s) => sum + convertToILS(Number(s.amount), s.currency || 'ILS'), 0);

  const totalPredictedILS = Array.from(predictedPerAccount.values())
    .reduce((sum, entry) => sum + convertToILS(entry.predicted, entry.currency), 0);

  const difference = totalPredictedILS - totalCurrentILS;

  const accountsWithPending = Array.from(predictedPerAccount.entries())
    .filter(([_, entry]) => entry.pendingItems.length > 0);

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Predicted Portfolio</h3>
          <p className="text-lg font-bold">{formatCurrency(totalPredictedILS)}</p>
          {difference !== 0 && (
            <p className={cn("text-xs mt-1", difference > 0 ? "text-success" : "text-destructive")}>
              {difference > 0 ? '+' : ''}{formatCurrency(difference)} from pending
            </p>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-3">
        {Array.from(predictedPerAccount.entries()).map(([name, entry]) => (
          <div
            key={name}
            className="p-4 rounded-lg bg-secondary/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <PiggyBank className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.currency}
                    {entry.currency !== 'ILS' && (
                      <span className="ml-1">
                        ≈ {formatCurrency(convertToILS(entry.predicted, entry.currency))}
                      </span>
                    )}
                    {entry.pendingItems.length > 0 && (
                      <span className="ml-1 text-primary">
                        • {entry.pendingItems.length} pending
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {formatCurrency(entry.predicted, entry.currency)}
                </p>
                {entry.current !== entry.predicted && (
                  <p className="text-xs text-muted-foreground line-through">
                    {formatCurrency(entry.current, entry.currency)}
                  </p>
                )}
              </div>
            </div>
            {entry.pendingItems.length > 0 && (
              <div className="mt-2 pl-12 space-y-1">
                {entry.pendingItems.map((item, i) => (
                  <p key={i} className={cn(
                    "text-xs",
                    item.action === 'deposit' ? "text-success" : "text-destructive"
                  )}>
                    {item.action === 'deposit' ? '+' : '-'}{formatCurrency(item.amount, entry.currency)} {item.action}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavingsPredictionPortfolio;
