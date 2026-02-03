import { useState } from 'react';
import { useFinance, Savings } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { Plus, Trash2, PiggyBank, TrendingUp, Pencil } from 'lucide-react';
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

const SavingsCurrentStatus = () => {
  const { savings, recurringSavings, addSavings, updateSavings, closeSavingsAccount, currentMonth } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [editingSaving, setEditingSaving] = useState<Savings | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    actionAmount: '',
    transferMethod: 'bank_account',
    cardId: '',
    action: 'deposit',
  });

  // Get the latest record per savings account name UP TO the selected month
  // For closed accounts: show them if they were closed AFTER the selected month (history preserved)
  const currentMonthDate = new Date(currentMonth + '-01');
  
  const latestSavingsPerName = savings
    .filter(s => s.month <= currentMonth) // Only include entries up to selected month
    .filter(s => {
      // Show if not closed, OR if closed after the selected month (so history is visible)
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
    }, new Map<string, Savings>());

  const uniqueSavings = Array.from(latestSavingsPerName.values());

  // Total portfolio value (sum of latest values per account)
  const totalPortfolioValue = uniqueSavings.reduce((sum, s) => sum + Number(s.amount), 0);

  // Total monthly deposits from recurring savings templates (active ones)
  const activeRecurringSavings = recurringSavings.filter(rs => rs.is_active);
  const totalRecurringDeposits = activeRecurringSavings
    .filter(rs => rs.action_type === 'deposit')
    .reduce((sum, rs) => sum + Number(rs.default_amount), 0);
  const totalRecurringWithdrawals = activeRecurringSavings
    .filter(rs => rs.action_type === 'withdrawal')
    .reduce((sum, rs) => sum + Number(rs.default_amount), 0);
  const netRecurringMonthly = totalRecurringDeposits - totalRecurringWithdrawals;

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      actionAmount: '',
      transferMethod: 'bank_account',
      cardId: '',
      action: 'deposit',
    });
    setEditingSaving(null);
  };

  const handleOpenEdit = (saving: Savings) => {
    setEditingSaving(saving);
    setFormData({
      name: saving.name,
      amount: saving.amount.toString(),
      actionAmount: (saving.action_amount || saving.monthly_deposit || '').toString(),
      transferMethod: saving.transfer_method,
      cardId: saving.card_id || '',
      action: saving.action || 'deposit',
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Use the selected month from context instead of today's date
    const savingData = {
      month: currentMonth,
      name: formData.name,
      amount: parseFloat(formData.amount),
      currency: 'ILS',
      transfer_method: formData.transferMethod as 'bank_account' | 'credit_card',
      card_id: formData.cardId || null,
      action: formData.action as 'deposit' | 'withdrawal',
      action_amount: formData.actionAmount ? parseFloat(formData.actionAmount) : null,
      monthly_deposit: formData.action === 'deposit' && formData.actionAmount ? parseFloat(formData.actionAmount) : null,
      recurring_type: formData.action === 'deposit' && formData.actionAmount ? 'monthly' as const : null,
      recurring_day_of_month: formData.action === 'deposit' && formData.actionAmount ? 15 : null,
      closed_at: null,
    };

    if (editingSaving) {
      updateSavings({ id: editingSaving.id, ...savingData });
    } else {
      addSavings(savingData);
    }
    resetForm();
    setIsOpen(false);
  };

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Current Portfolio</h3>
          <p className="text-lg font-bold">{formatCurrency(totalPortfolioValue)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {uniqueSavings.length} account{uniqueSavings.length !== 1 ? 's' : ''}
            {netRecurringMonthly !== 0 && (
              <span className={netRecurringMonthly > 0 ? "text-success ml-2" : "text-destructive ml-2"}>
                {netRecurringMonthly > 0 ? '+' : ''}{formatCurrency(netRecurringMonthly)}/mo recurring
              </span>
            )}
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>{editingSaving ? 'Edit Savings' : 'Add Savings Account'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Account Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Altshuler Investment"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Current Amount (₪)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                  required
                />
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
                  <Label htmlFor="actionAmount">
                    {formData.action === 'deposit' ? 'Monthly Deposit' : 'Withdrawal Amount'} (₪)
                  </Label>
                  <Input
                    id="actionAmount"
                    type="number"
                    value={formData.actionAmount}
                    onChange={(e) => setFormData({ ...formData, actionAmount: e.target.value })}
                    placeholder="0"
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
              <Button type="submit" className="w-full">
                {editingSaving ? 'Save Changes' : 'Add Savings'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {uniqueSavings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No savings accounts
          </p>
        ) : (
          uniqueSavings.map((saving) => (
            <div
              key={saving.id}
              className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                    <PiggyBank className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{saving.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {saving.currency} • Updated {new Date(saving.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(Number(saving.amount))}</p>
                    {saving.monthly_deposit && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3 text-success" />
                        <span>+{formatCurrency(Number(saving.monthly_deposit))}/mo</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenEdit(saving)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-secondary rounded transition-all"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => closeSavingsAccount(saving.name, currentMonth)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"
                    title="Close account from this month (preserves history)"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SavingsCurrentStatus;
