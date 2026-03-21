import { useState } from 'react';
import { useFinance, Savings } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { convertToILS, SUPPORTED_CURRENCIES } from '@/lib/currencyUtils';
import { Plus, Trash2, PiggyBank, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

const SavingsCurrentStatus = () => {
  const { savings, addSavings, updateSavings, closeSavingsAccount, currentMonth } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [editingSaving, setEditingSaving] = useState<Savings | null>(null);
  const [formData, setFormData] = useState({
    name: '', amount: '', transferMethod: 'bank_account', cardId: '', currency: 'ILS', riskLevel: 'medium',
  });

  const currentMonthDate = new Date(currentMonth + '-01');

  const latestSavingsPerName = savings
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

  const uniqueSavings = Array.from(latestSavingsPerName.values());

  const totalPortfolioValue = uniqueSavings.reduce(
    (sum, s) => sum + convertToILS(Number(s.amount), s.currency || 'ILS'), 0
  );

  const resetForm = () => {
    setFormData({ name: '', amount: '', transferMethod: 'bank_account', cardId: '', currency: 'ILS', riskLevel: 'medium' });
    setEditingSaving(null);
  };

  const handleOpenEdit = (saving: Savings) => {
    setEditingSaving(saving);
    setFormData({
      name: saving.name, amount: saving.amount.toString(), transferMethod: saving.transfer_method,
      cardId: saving.card_id || '', currency: saving.currency || 'ILS', riskLevel: (saving as any).risk_level || 'medium',
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSaving) {
      // Only update portfolio-level fields, preserve activity fields
      updateSavings({
        id: editingSaving.id,
        month: currentMonth, name: formData.name, amount: parseFloat(formData.amount), currency: formData.currency,
        transfer_method: formData.transferMethod as 'bank_account' | 'credit_card', card_id: formData.cardId || null,
        risk_level: formData.riskLevel,
      });
    } else {
      addSavings({
        month: currentMonth, name: formData.name, amount: parseFloat(formData.amount), currency: formData.currency,
        transfer_method: formData.transferMethod as 'bank_account' | 'credit_card', card_id: formData.cardId || null,
        action: null, action_amount: null, monthly_deposit: null, recurring_type: null, recurring_day_of_month: null,
        closed_at: null, is_completed: false, risk_level: formData.riskLevel,
      });
    }
    resetForm();
    setIsOpen(false);
  };

  return (
    <div className="glass rounded-xl p-3 sm:p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h3 className="font-semibold">Current Portfolio</h3>
          <p className="text-lg font-bold">{formatCurrency(totalPortfolioValue)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {uniqueSavings.length} account{uniqueSavings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" />Add</Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>{editingSaving ? 'Edit Savings' : 'Add Savings Account'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Account Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Altshuler Investment" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Current Amount</Label>
                  <Input id="amount" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0" required />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Transfer Method</Label>
                  <Select value={formData.transferMethod} onValueChange={(value) => setFormData({ ...formData, transferMethod: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_account">Bank Account</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Risk Level</Label>
                  <Select value={formData.riskLevel} onValueChange={(value) => setFormData({ ...formData, riskLevel: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Low Risk</SelectItem>
                      <SelectItem value="medium">🟡 Medium Risk</SelectItem>
                      <SelectItem value="high">🔴 High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.transferMethod === 'credit_card' && (
                <div className="space-y-2">
                  <Label>Card</Label>
                  <Select value={formData.cardId} onValueChange={(value) => setFormData({ ...formData, cardId: value })}>
                    <SelectTrigger><SelectValue placeholder="Select card" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fly-card">Fly Card</SelectItem>
                      <SelectItem value="hever">Hever</SelectItem>
                      <SelectItem value="visa">Visa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full">{editingSaving ? 'Save Changes' : 'Add Savings'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {uniqueSavings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No savings accounts</p>
        ) : (
          uniqueSavings.map((saving) => (
              <div key={saving.id} className="p-2.5 sm:p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2.5 rounded-lg bg-primary/10 text-primary">
                      <PiggyBank className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm sm:text-base">{saving.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {saving.currency || 'ILS'}
                        {saving.currency && saving.currency !== 'ILS' && (
                          <span className="ml-1">≈ {formatCurrency(convertToILS(Number(saving.amount), saving.currency))}</span>
                        )}
                        <span className="mx-1">•</span>
                        Updated {new Date(saving.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(Number(saving.amount), saving.currency || 'ILS')}</p>
                    </div>
                    <button onClick={() => handleOpenEdit(saving)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-secondary rounded transition-all">
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => closeSavingsAccount(saving.name, currentMonth)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all" title="Close account">
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
