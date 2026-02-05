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

// Conversion rates to ILS
const CURRENCY_RATES: Record<string, number> = {
  ILS: 1,
  USD: 3.65,
  EUR: 4.0,
  GBP: 4.6,
};

const convertToILS = (amount: number, currency: string): number => {
  return amount * (CURRENCY_RATES[currency] || 1);
};

const formatWithSymbol = (amount: number, currency: string): string => {
  const symbols: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€', GBP: '£' };
  const symbol = symbols[currency] || '₪';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const SavingsList = () => {
  const { savings, recurringSavings, currentMonth, addSavings, updateSavings, deleteSavings, closeSavingsAccount, addRecurringSavings, updateRecurringSavings } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [editingSaving, setEditingSaving] = useState<Savings | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    actionAmount: '',
    transferMethod: 'bank_account',
    cardId: '',
    action: 'deposit',
    currency: 'ILS',
  });

  // Filter savings for current month only
  // Show closed accounts if they were closed after the selected month
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

  // Get only the latest record per savings account name for the current month
  const latestSavingsPerName = savingsUpToDate.reduce((acc, saving) => {
    const existing = acc.get(saving.name);
    if (!existing || new Date(saving.updated_at) > new Date(existing.updated_at)) {
      acc.set(saving.name, saving);
    }
    return acc;
  }, new Map<string, Savings>());

  const uniqueSavings = Array.from(latestSavingsPerName.values());

  // Calculate total in ILS (converting foreign currencies)
  const totalSavingsILS = uniqueSavings
    .filter(s => s.action !== 'withdrawal')
    .reduce((sum, s) => sum + convertToILS(Number(s.amount), s.currency || 'ILS'), 0);

  const totalWithdrawals = savingsUpToDate
    .filter(s => s.action === 'withdrawal')
    .reduce((sum, s) => sum + Number(s.action_amount || 0), 0);

  const monthlyDeposits = uniqueSavings
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
      currency: 'ILS',
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
      currency: saving.currency || 'ILS',
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date();
    const actionAmount = formData.actionAmount ? parseFloat(formData.actionAmount) : null;
    const isDeposit = formData.action === 'deposit';
    
    const savingData = {
      month: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
      name: formData.name,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      transfer_method: formData.transferMethod as 'bank_account' | 'credit_card',
      card_id: formData.cardId || null,
      action: formData.action as 'deposit' | 'withdrawal',
      action_amount: actionAmount,
      monthly_deposit: isDeposit && actionAmount ? actionAmount : null,
      recurring_type: isDeposit && actionAmount ? 'monthly' as const : null,
      recurring_day_of_month: isDeposit && actionAmount ? 15 : null,
      closed_at: null,
    };

    if (editingSaving) {
      updateSavings({ id: editingSaving.id, ...savingData });
    } else {
      addSavings(savingData);
    }

    // Sync with recurring savings template if a monthly deposit is set
    if (actionAmount && actionAmount > 0) {
      const existingRecurring = recurringSavings.find(rs => rs.name === formData.name);
      
      if (existingRecurring) {
        // Update existing recurring savings template
        updateRecurringSavings({
          id: existingRecurring.id,
          default_amount: actionAmount,
          action_type: formData.action as 'deposit' | 'withdrawal',
          transfer_method: formData.transferMethod as 'bank_account' | 'credit_card',
          card_id: formData.cardId || null,
          is_active: true,
        });
      } else {
        // Create new recurring savings template
        addRecurringSavings({
          name: formData.name,
          default_amount: actionAmount,
          action_type: formData.action as 'deposit' | 'withdrawal',
          transfer_method: formData.transferMethod as 'bank_account' | 'credit_card',
          card_id: formData.cardId || null,
          day_of_month: 15,
          is_active: true,
          notes: null,
          end_date: null,
        });
      }
    }

    resetForm();
    setIsOpen(false);
  };

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Savings Accounts</h3>
          <p className="text-lg font-bold">{formatCurrency(totalSavingsILS)}</p>
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
                <Label htmlFor="amount">Current Amount</Label>
                <div className="flex gap-2">
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0"
                    className="flex-1"
                    required
                  />
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ILS">₪ ILS</SelectItem>
                      <SelectItem value="USD">$ USD</SelectItem>
                      <SelectItem value="EUR">€ EUR</SelectItem>
                      <SelectItem value="GBP">£ GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
          uniqueSavings.map((saving) => {
            const currency = saving.currency || 'ILS';
            const isNonILS = currency !== 'ILS';
            
            return (
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
                        {currency}
                        {isNonILS && (
                          <span className="ml-1">
                            ≈ {formatCurrency(convertToILS(Number(saving.amount), currency))}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatWithSymbol(Number(saving.amount), currency)}</p>
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
                      title="Delete this savings record"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SavingsList;
