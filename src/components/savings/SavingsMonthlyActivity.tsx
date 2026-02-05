import { useState } from 'react';
import { useFinance, Savings } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { convertToILS } from '@/lib/currencyUtils';
import { isDateUpToToday, isCurrentMonth } from '@/lib/dateUtils';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Minus, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
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
}

const SavingsMonthlyActivity = () => {
  const { savings, recurringSavings, currentMonth, addSavings, updateSavings, deleteSavings } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Savings | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    action: 'deposit',
    actionAmount: '',
    transferMethod: 'bank_account',
    cardId: '',
  });

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

  // Get names of savings that have already been recorded this month
  // (synced by edge function or manually added)
  const recordedSavingsNames = new Set(
    savingsUpToDate
      .filter(s => (s.action_amount && s.action_amount > 0) || (s.monthly_deposit && s.monthly_deposit > 0))
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
    const actionAmount = parseFloat(formData.actionAmount) || 0;
    const newAmount = formData.action === 'deposit' 
      ? currentAmount + actionAmount 
      : currentAmount - actionAmount;

    const activityData = {
      month: currentMonth,
      name: formData.name,
      amount: Math.max(0, newAmount),
      currency: accountCurrency,
      transfer_method: formData.transferMethod as 'bank_account' | 'credit_card',
      card_id: formData.cardId || null,
      action: formData.action as 'deposit' | 'withdrawal',
      action_amount: actionAmount,
      monthly_deposit: null,
      recurring_type: null,
      recurring_day_of_month: null,
      closed_at: null,
    };

    if (editingActivity) {
      updateSavings({ id: editingActivity.id, ...activityData });
    } else {
      addSavings(activityData);
    }
    resetForm();
    setIsOpen(false);
  };

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
                  <Label htmlFor="actionAmount">Amount (₪)</Label>
                  <Input
                    id="actionAmount"
                    type="number"
                    value={formData.actionAmount}
                    onChange={(e) => setFormData({ ...formData, actionAmount: e.target.value })}
                    placeholder="0"
                    required
                  />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {activityItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg group",
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
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium">{item.name}</p>
                      {item.isRecurring && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          <RotateCcw className="h-2.5 w-2.5" />
                          recurring
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.action}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-semibold",
                      item.action === 'withdrawal' ? "text-destructive" : "text-success"
                    )}>
                      {item.action === 'withdrawal' ? '-' : '+'}
                      {formatCurrency(item.amount, item.currency || 'ILS')}
                    </p>
                    {item.currency && item.currency !== 'ILS' && (
                      <p className="text-[10px] text-muted-foreground">
                        ≈ {formatCurrency(convertToILS(item.amount, item.currency))}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {item.isRecurring ? `Day ${item.dayOfMonth}` : new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                  {!item.isRecurring && item.originalSaving && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(item.originalSaving!)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-secondary rounded transition-all"
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteSavings(item.id)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </>
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