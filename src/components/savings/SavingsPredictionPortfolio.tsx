import { useMemo, useState } from 'react';
import { useFinance, Savings } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { convertToILS } from '@/lib/currencyUtils';
import { isDateUpToToday, isCurrentMonth } from '@/lib/dateUtils';
import { TrendingUp, PiggyBank, Plus, ArrowRightLeft, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePlannedSavingsActions } from '@/hooks/usePlannedSavingsActions';
import AddPlannedActionDialog from '@/components/savings/AddPlannedActionDialog';

const SavingsPredictionPortfolio = () => {
  const { savings, recurringSavings, currentMonth } = useFinance();
  const { plannedActions, addAction, deleteAction, markExecuted } = usePlannedSavingsActions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultFromAccount, setDefaultFromAccount] = useState<string | undefined>();

  const currentMonthDate = new Date(currentMonth + '-01');
  const shouldFilterByDate = isCurrentMonth(currentMonth);

  const monthPlannedActions = plannedActions.filter(a => a.month === currentMonth && !a.is_executed);

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

  const accountNames = Array.from(latestSavingsPerName.keys());

  // Get this month's activity items
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

  const uncompletedTransactions = savingsUpToDate.filter(s =>
    ((s.action_amount && s.action_amount > 0) || (s.monthly_deposit && s.monthly_deposit > 0)) &&
    !(s as any).is_completed
  );

  const pendingRecurring = activeRecurringSavings.filter(
    rs => !recordedSavingsNames.has(rs.name)
  );

  // Build predicted balance per account
  const predictedPerAccount = useMemo(() => {
    const accountMap = new Map<string, { current: number; predicted: number; currency: string; pendingItems: Array<{ action: string; amount: number; source?: string }> }>();

    latestSavingsPerName.forEach((saving, name) => {
      accountMap.set(name, {
        current: Number(saving.amount),
        predicted: Number(saving.amount),
        currency: saving.currency || 'ILS',
        pendingItems: [],
      });
    });

    // Add uncompleted manual/actual transactions
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

    // Add pending recurring savings
    pendingRecurring.forEach(rs => {
      const entry = accountMap.get(rs.name);
      if (entry) {
        const amount = Number(rs.default_amount);
        if (rs.action_type === 'deposit') {
          entry.predicted += amount;
          entry.pendingItems.push({ action: 'deposit', amount, source: 'recurring' });
        } else {
          entry.predicted -= amount;
          entry.pendingItems.push({ action: 'withdrawal', amount, source: 'recurring' });
        }
      }
    });

    // Add planned actions
    monthPlannedActions.forEach(pa => {
      const amount = Number(pa.amount);
      if (pa.action_type === 'transfer') {
        if (pa.from_account) {
          const fromEntry = accountMap.get(pa.from_account);
          if (fromEntry) {
            fromEntry.predicted -= amount;
            fromEntry.pendingItems.push({ action: 'transfer out', amount, source: 'planned' });
          }
        }
        if (pa.to_account) {
          const toEntry = accountMap.get(pa.to_account);
          if (toEntry) {
            toEntry.predicted += amount;
            toEntry.pendingItems.push({ action: 'transfer in', amount, source: 'planned' });
          }
        }
      } else if (pa.action_type === 'deposit' && pa.to_account) {
        const entry = accountMap.get(pa.to_account);
        if (entry) {
          entry.predicted += amount;
          entry.pendingItems.push({ action: 'planned deposit', amount, source: 'planned' });
        }
      } else if (pa.action_type === 'withdrawal' && pa.from_account) {
        const entry = accountMap.get(pa.from_account);
        if (entry) {
          entry.predicted -= amount;
          entry.pendingItems.push({ action: 'planned withdrawal', amount, source: 'planned' });
        }
      }
    });

    return accountMap;
  }, [latestSavingsPerName, uncompletedTransactions, pendingRecurring, monthPlannedActions]);

  const totalCurrentILS = Array.from(latestSavingsPerName.values())
    .reduce((sum, s) => sum + convertToILS(Number(s.amount), s.currency || 'ILS'), 0);

  const totalPredictedILS = Array.from(predictedPerAccount.values())
    .reduce((sum, entry) => sum + convertToILS(entry.predicted, entry.currency), 0);

  const difference = totalPredictedILS - totalCurrentILS;

  const handleAddFromAccount = (accountName: string) => {
    setDefaultFromAccount(accountName);
    setDialogOpen(true);
  };

  return (
    <div className="glass rounded-xl p-3 sm:p-5 shadow-card animate-slide-up">
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
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => { setDefaultFromAccount(undefined); setDialogOpen(true); }}>
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Plan
          </Button>
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Planned Actions Summary */}
      {monthPlannedActions.length > 0 && (
        <div className="mb-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs font-medium text-primary mb-1.5">📋 Planned Actions ({monthPlannedActions.length})</p>
          <div className="space-y-1">
            {monthPlannedActions.map(pa => (
              <div key={pa.id} className="flex items-center justify-between text-xs group">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="shrink-0">
                    {pa.action_type === 'transfer' ? '🔄' : pa.action_type === 'deposit' ? '📥' : '📤'}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {pa.action_type === 'transfer' 
                      ? `${pa.from_account} → ${pa.to_account}` 
                      : pa.action_type === 'deposit' 
                        ? `→ ${pa.to_account}` 
                        : `${pa.from_account} →`
                    }
                  </span>
                  <span className="font-medium shrink-0">{formatCurrency(pa.amount, pa.currency)}</span>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => markExecuted(pa.id)} className="p-1 hover:bg-success/10 rounded" title="Mark as done">
                    <Check className="h-3 w-3 text-success" />
                  </button>
                  <button onClick={() => deleteAction(pa.id)} className="p-1 hover:bg-destructive/10 rounded" title="Remove">
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {Array.from(predictedPerAccount.entries()).map(([name, entry]) => (
          <div
            key={name}
            className="p-2.5 sm:p-4 rounded-lg bg-secondary/30 group/card"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2.5 rounded-lg bg-primary/10 text-primary">
                  <PiggyBank className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">{name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
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
              <div className="flex items-center gap-1.5">
                <div className="text-right">
                  <p className="text-base sm:text-lg font-bold">
                    {formatCurrency(entry.predicted, entry.currency)}
                  </p>
                  {entry.current !== entry.predicted && (
                    <p className="text-xs text-muted-foreground line-through">
                      {formatCurrency(entry.current, entry.currency)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleAddFromAccount(name)}
                  className="p-1 opacity-0 group-hover/card:opacity-100 hover:bg-primary/10 rounded transition-all"
                  title="Plan action for this account"
                >
                  <Plus className="h-3.5 w-3.5 text-primary" />
                </button>
              </div>
            </div>
            {entry.pendingItems.length > 0 && (
              <div className="mt-2 pl-12 space-y-1">
                {entry.pendingItems.map((item, i) => (
                  <p key={i} className={cn(
                    "text-xs",
                    item.action.includes('deposit') || item.action === 'transfer in' ? "text-success" : "text-destructive"
                  )}>
                    {item.action.includes('deposit') || item.action === 'transfer in' ? '+' : '-'}
                    {formatCurrency(item.amount, entry.currency)} {item.action}
                    {item.source === 'planned' && <span className="text-primary ml-1">• planned</span>}
                    {item.source === 'recurring' && <span className="text-muted-foreground ml-1">• recurring</span>}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <AddPlannedActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        accountNames={accountNames}
        currentMonth={currentMonth}
        onSubmit={addAction}
        defaultFromAccount={defaultFromAccount}
      />
    </div>
  );
};

export default SavingsPredictionPortfolio;
