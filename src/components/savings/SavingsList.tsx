import { useState } from 'react';
import { useFinance, Savings } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { isDateUpToToday, isCurrentMonth } from '@/lib/dateUtils';
import { Plus, Trash2, PiggyBank, TrendingUp, ArrowDownRight, Pencil } from 'lucide-react';
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

const SavingsList = () => {
  const { savings, currentMonth, addSavings, updateSavings, deleteSavings } = useFinance();
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

  // For current month, only count items up to today's date
  const shouldFilterByDate = isCurrentMonth(currentMonth);
  const savingsUpToDate = savings.filter(s => 
    !isCurrentMonth(s.month) || !shouldFilterByDate || isDateUpToToday(s.updated_at)
  );

  const totalSavings = savingsUpToDate
    .filter(s => s.action !== 'withdrawal')
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const totalWithdrawals = savingsUpToDate
    .filter(s => s.action === 'withdrawal')
    .reduce((sum, s) => sum + Number(s.action_amount || 0), 0);

  const monthlyDeposits = savingsUpToDate
    .filter(s => s.monthly_deposit)
    .reduce((sum, s) => sum + Number(s.monthly_deposit || 0), 0);

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
    const today = new Date();
    const savingData = {
      month: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
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
          <h3 className="font-semibold">Savings Accounts</h3>
          <p className="text-lg font-bold">{formatCurrency(totalSavings)}</p>
          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
            <span className="text-success">+{formatCurrency(monthlyDeposits)}/mo</span>
            {totalWithdrawals > 0 && (
              <span className="text-destructive">Withdrawn: {formatCurrency(totalWithdrawals)}</span>
            )}
          </div>
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
        {savings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No savings accounts
          </p>
        ) : (
          savings.map((saving) => (
            <div
              key={saving.id}
              className={cn(
                'p-4 rounded-lg transition-colors group',
                saving.action === 'withdrawal'
                  ? 'bg-destructive/10 border border-destructive/20'
                  : 'bg-secondary/30 hover:bg-secondary/50'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2.5 rounded-lg',
                      saving.action === 'withdrawal'
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-primary/10 text-primary'
                    )}
                  >
                    {saving.action === 'withdrawal' ? (
                      <ArrowDownRight className="h-5 w-5" />
                    ) : (
                      <PiggyBank className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{saving.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {saving.currency}
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
                    {saving.action === 'withdrawal' && saving.action_amount && (
                      <p className="text-xs text-destructive">
                        -{formatCurrency(Number(saving.action_amount))}
                      </p>
                    )}
                    {saving.action === 'deposit' && saving.action_amount && (
                      <p className="text-xs text-success">
                        +{formatCurrency(Number(saving.action_amount))}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenEdit(saving)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-secondary rounded transition-all"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteSavings(saving.id)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"
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

export default SavingsList;
