import { useState, useEffect, useRef } from 'react';
import { useFinance, Savings } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { convertToILS, convertFromILS, SUPPORTED_CURRENCIES } from '@/lib/currencyUtils';
import { isDateUpToToday, isCurrentMonth } from '@/lib/dateUtils';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Minus, Plus, Pencil, Trash2, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Combined activity item type
interface ActivityItem {
  id: string;
  name: string;
  action: 'deposit' | 'withdrawal';
  amount: number;
  date: string;
  isRecurring: boolean;
  dayOfMonth?: number;
  originalSaving?: Savings;
  currency?: string;
  isCompleted?: boolean;
}

const SavingsMonthlyActivity = ({ highlightId }: { highlightId?: string }) => {
  const { savings, recurringSavings, currentMonth, addSavings, updateSavings, deleteSavings } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Savings | null>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(highlightId || null);
  const [formData, setFormData] = useState({
    name: '',
    action: 'deposit',
    actionAmount: '',
    transferMethod: 'bank_account',
    cardId: '',
    inputCurrency: 'ILS',
  });

  // Auto-scroll and open edit for highlighted deposit
  useEffect(() => {
    if (highlightId) {
      setHighlightedId(highlightId);
      const saving = savings.find(s => s.id === highlightId);
      if (saving) {
        // Auto-open edit dialog
        setTimeout(() => {
          handleOpenEdit(saving);
          highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
      // Clear highlight after a few seconds
      const timer = setTimeout(() => setHighlightedId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightId]);

  // Filter savings for current month only
  const currentMonthDate = new Date(currentMonth + '-01');
  const monthlySavings = savings.filter(s => {
    if (s.month !== currentMonth) return false;
    if (!s.closed_at) return true;
    return new Date(s.closed_at) > currentMonthDate;
  });
  
  // For current month, only count items up to today's date
  const shouldFilterByDate = isCurrentMonth(currentMonth);
  const savingsUpToDate = monthlySavings.filter(s => 
    !shouldFilterByDate || isDateUpToToday(s.updated_at)
  );

  // Get active recurring savings
  const activeRecurringSavings = recurringSavings.filter(rs => rs.is_active);

  // Get names of savings that have already been recorded or dismissed this month
  const recordedSavingsNames = new Set(
    savingsUpToDate
      .filter(s => (s.action_amount && s.action_amount > 0) || (s.monthly_deposit && s.monthly_deposit > 0) || (s as any).is_completed)
      .map(s => s.name)
  );

  // Filter out recurring savings that have already been recorded
  const pendingRecurringSavings = activeRecurringSavings.filter(
    rs => !recordedSavingsNames.has(rs.name)
  );

  // Create combined activity list
  const activityItems: ActivityItem[] = [
    // Actual savings transactions - include entries with action_amount OR monthly_deposit
    ...savingsUpToDate
      .filter(s => (s.action_amount && s.action_amount > 0) || (s.monthly_deposit && s.monthly_deposit > 0))
      .map(s => {
        const hasActionAmount = s.action_amount && s.action_amount > 0;
        return {
          id: s.id,
          name: s.name,
          action: (s.action || 'deposit') as 'deposit' | 'withdrawal',
          amount: hasActionAmount ? Number(s.action_amount) : Number(s.monthly_deposit),
          date: s.updated_at,
          isRecurring: false,
          originalSaving: s,
          currency: s.currency || 'ILS',
          isCompleted: !!(s as any).is_completed,
        };
      }),
    // Only show recurring savings that haven't been recorded yet (pending)
    ...pendingRecurringSavings.map(rs => ({
      id: `recurring-${rs.id}`,
      name: rs.name,
      action: rs.action_type as 'deposit' | 'withdrawal',
      amount: Number(rs.default_amount),
      date: `${currentMonth}-${String(rs.day_of_month).padStart(2, '0')}`,
      isRecurring: true,
      dayOfMonth: rs.day_of_month,
      currency: rs.currency || 'ILS',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate totals in ILS
  const monthlyDepositsILS = activityItems
    .filter(item => item.action === 'deposit')
    .reduce((sum, item) => sum + convertToILS(item.amount, item.currency || 'ILS'), 0);

  const monthlyWithdrawalsILS = activityItems
    .filter(item => item.action === 'withdrawal')
    .reduce((sum, item) => sum + convertToILS(item.amount, item.currency || 'ILS'), 0);

  const netChangeILS = monthlyDepositsILS - monthlyWithdrawalsILS;

  // Get unique account names for the dropdown
  const accountNames = [...new Set(savings.filter(s => !s.closed_at).map(s => s.name))];

  // Format month for display
  const [year, month] = currentMonth.split('-');
  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const resetForm = () => {
    setFormData({
      name: '',
      action: 'deposit',
      actionAmount: '',
      transferMethod: 'bank_account',
      cardId: '',
      inputCurrency: 'ILS',
    });
    setEditingActivity(null);
  };

  const handleOpenEdit = (activity: Savings) => {
    setEditingActivity(activity);
    setFormData({
      name: activity.name,
      action: activity.action || 'deposit',
      actionAmount: (activity.action_amount || '').toString(),
      transferMethod: activity.transfer_method,
      cardId: activity.card_id || '',
      inputCurrency: activity.currency || 'ILS',
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find the latest balance for this account to calculate new amount
    const latestForAccount = savings
      .filter(s => s.name === formData.name && !s.closed_at)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
    
    const currentAmount = latestForAccount ? Number(latestForAccount.amount) : 0;
    const accountCurrency = latestForAccount?.currency || 'ILS';
    const inputAmount = parseFloat(formData.actionAmount) || 0;
    
    // Convert input amount to account currency if different
    let actionAmountInAccountCurrency = inputAmount;
    if (formData.inputCurrency !== accountCurrency) {
      // First convert input to ILS, then to account currency
      const amountInILS = convertToILS(inputAmount, formData.inputCurrency);
      actionAmountInAccountCurrency = convertFromILS(amountInILS, accountCurrency);
    }
    
    // Don't change balance on creation — balance updates only when crossed over
    const activityData = {
      month: currentMonth,
      name: formData.name,
      amount: currentAmount,
      currency: accountCurrency,
      transfer_method: formData.transferMethod as 'bank_account' | 'credit_card',
      card_id: formData.cardId || null,
      action: formData.action as 'deposit' | 'withdrawal',
      action_amount: actionAmountInAccountCurrency,
      monthly_deposit: null,
      recurring_type: null,
      recurring_day_of_month: null,
      closed_at: null,
      is_completed: false,
    };

    if (editingActivity) {
      updateSavings({ id: editingActivity.id, ...activityData });
    } else {
      addSavings(activityData);
    }
    resetForm();
    setIsOpen(false);
  };

  // Dismiss a recurring item for the current month (creates a zero-amount "skipped" record)
  const handleDismissRecurring = (item: ActivityItem) => {
    const latestForAccount = savings
      .filter(s => s.name === item.name && !s.closed_at)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

    addSavings({
      month: currentMonth,
      name: item.name,
      amount: latestForAccount ? Number(latestForAccount.amount) : 0,
      currency: item.currency || 'ILS',
      transfer_method: 'bank_account',
      card_id: null,
      action: item.action as 'deposit' | 'withdrawal',
      action_amount: 0,
      monthly_deposit: null,
      recurring_type: null,
      recurring_day_of_month: null,
      closed_at: null,
      is_completed: true,
    });
  };

  // Get selected account's currency for display
  const selectedAccountCurrency = formData.name 
    ? savings.find(s => s.name === formData.name && !s.closed_at)?.currency || 'ILS'
    : 'ILS';

  // Calculate converted amount preview
  const inputAmount = parseFloat(formData.actionAmount) || 0;
  const showConversion = formData.inputCurrency !== selectedAccountCurrency && inputAmount > 0 && formData.name;
  const convertedAmount = showConversion
    ? convertFromILS(convertToILS(inputAmount, formData.inputCurrency), selectedAccountCurrency)
    : 0;
  const ilsEquivalent = formData.inputCurrency !== 'ILS' && inputAmount > 0
    ? convertToILS(inputAmount, formData.inputCurrency)
    : inputAmount;

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Monthly Activity</h3>
          <p className="text-xs text-muted-foreground">{monthName}</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>{editingActivity ? 'Edit Activity' : 'Add Savings Activity'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Account</Label>
                <Select
                  value={formData.name}
                  onValueChange={(value) => setFormData({ ...formData, name: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountNames.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Action Type</Label>
                  <Select
                    value={formData.action}
                    onValueChange={(value) => setFormData({ ...formData, action: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actionAmount">Amount</Label>
                  <div className="flex gap-2">
                    <Input
                      id="actionAmount"
                      type="number"
                      value={formData.actionAmount}
                      onChange={(e) => setFormData({ ...formData, actionAmount: e.target.value })}
                      placeholder="0"
                      className="flex-1"
                      required
                    />
                    <Select
                      value={formData.inputCurrency}
                      onValueChange={(value) => setFormData({ ...formData, inputCurrency: value })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_CURRENCIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.symbol} {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Show conversion preview */}
                  {formData.name && inputAmount > 0 && (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {showConversion && (
                        <p>
                          → {formatCurrency(convertedAmount, selectedAccountCurrency)} to account
                        </p>
                      )}
                      {formData.inputCurrency !== 'ILS' && (
                        <p>≈ {formatCurrency(ilsEquivalent)} ILS</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Transfer Method</Label>
                  <Select
                    value={formData.transferMethod}
                    onValueChange={(value) => setFormData({ ...formData, transferMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_account">Bank Account</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.transferMethod === 'credit_card' && (
                  <div className="space-y-2">
                    <Label>Card</Label>
                    <Select
                      value={formData.cardId}
                      onValueChange={(value) => setFormData({ ...formData, cardId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select card" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fly-card">Fly Card</SelectItem>
                        <SelectItem value="hever">Hever</SelectItem>
                        <SelectItem value="visa">Visa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={!formData.name}>
                {editingActivity ? 'Save Changes' : 'Add Activity'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats - Full width horizontal layout */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center md:col-span-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ArrowUpRight className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">Deposits</span>
          </div>
          <p className="text-lg font-bold text-success">{formatCurrency(monthlyDepositsILS)}</p>
        </div>
        
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center md:col-span-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ArrowDownRight className="h-4 w-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Withdrawals</span>
          </div>
          <p className="text-lg font-bold text-destructive">{formatCurrency(monthlyWithdrawalsILS)}</p>
        </div>
        
        <div className={cn(
          "p-3 rounded-lg text-center border md:col-span-2",
          netChangeILS > 0 
            ? "bg-success/10 border-success/20" 
            : netChangeILS < 0 
              ? "bg-destructive/10 border-destructive/20"
              : "bg-muted/50 border-muted"
        )}>
          <div className="flex items-center justify-center gap-2 mb-1">
            {netChangeILS > 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : netChangeILS < 0 ? (
              <TrendingDown className="h-4 w-4 text-destructive" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">Net Change</span>
          </div>
          <p className={cn(
            "text-lg font-bold",
            netChangeILS > 0 ? "text-success" : netChangeILS < 0 ? "text-destructive" : "text-muted-foreground"
          )}>
            {netChangeILS > 0 ? '+' : ''}{formatCurrency(netChangeILS)}
          </p>
        </div>
      </div>

      {/* Activity List - Grid layout for full width */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">Transactions</p>
        {activityItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No savings activity this month
          </p>
        ) : (
          <div className="space-y-2">
            {activityItems.map((item) => (
              <div
                key={item.id}
                ref={item.id === highlightedId ? highlightRef : undefined}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg group transition-all",
                  item.isCompleted
                    ? "bg-muted/30 border border-muted/50 opacity-60"
                    : item.action === 'withdrawal'
                      ? "bg-destructive/10 border border-destructive/20"
                      : "bg-success/10 border border-success/20",
                  item.id === highlightedId && "ring-2 ring-primary animate-pulse"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Completion toggle for non-recurring items */}
                  {!item.isRecurring ? (
                    <button
                      onClick={() => {
                        const saving = item.originalSaving;
                        if (!saving) return;
                        
                        if (!item.isCompleted) {
                          // Crossing over — apply the transaction to the balance
                          const actionAmount = Number(saving.action_amount || saving.monthly_deposit || 0);
                          const currentAmount = Number(saving.amount);
                          const isDeposit = item.action === 'deposit';
                          const newAmount = isDeposit 
                            ? currentAmount + actionAmount 
                            : currentAmount - actionAmount;
                          
                          updateSavings({ 
                            id: item.id, 
                            is_completed: true,
                            amount: Math.max(0, newAmount),
                          } as any);
                        } else {
                          // Un-crossing — reverse the transaction from the balance
                          const actionAmount = Number(saving.action_amount || saving.monthly_deposit || 0);
                          const currentAmount = Number(saving.amount);
                          const isDeposit = item.action === 'deposit';
                          const newAmount = isDeposit 
                            ? currentAmount - actionAmount 
                            : currentAmount + actionAmount;
                          
                          updateSavings({ 
                            id: item.id, 
                            is_completed: false,
                            amount: Math.max(0, newAmount),
                          } as any);
                        }
                      }}
                      className={cn(
                        "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                        item.isCompleted
                          ? "bg-success border-success text-success-foreground"
                          : "border-muted-foreground/30 hover:border-success/60"
                      )}
                    >
                      {item.isCompleted && <Check className="h-4 w-4" />}
                    </button>
                  ) : (
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
                  )}
                  <p className={cn("text-sm font-medium", item.isCompleted && "line-through")}>{item.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className={cn(
                    "text-sm font-semibold",
                    item.isCompleted
                      ? "text-muted-foreground"
                      : item.action === 'withdrawal' ? "text-destructive" : "text-success"
                  )}>
                    {item.action === 'withdrawal' ? '-' : '+'}
                    {formatCurrency(item.amount, item.currency || 'ILS')}
                  </p>
                  {!item.isRecurring ? (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.originalSaving && (
                        <button
                          onClick={() => handleOpenEdit(item.originalSaving!)}
                          className="p-1.5 hover:bg-secondary rounded"
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteSavings(item.id)}
                        className="p-1.5 hover:bg-destructive/10 rounded"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDismissRecurring(item)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 rounded"
                      title="Skip this month"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  )}
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