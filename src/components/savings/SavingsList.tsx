import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { Plus, Trash2, PiggyBank, TrendingUp, ArrowDownRight } from 'lucide-react';
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
  const { savings, addSavings, deleteSavings } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [newSaving, setNewSaving] = useState({
    name: '',
    amount: '',
    monthlyDeposit: '',
    transferMethod: 'bank_account',
    cardId: '',
    type: 'savings',
  });

  const totalSavings = savings
    .filter(s => s.type === 'savings')
    .reduce((sum, s) => sum + s.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date();
    addSavings({
      month: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
      name: newSaving.name,
      amount: parseFloat(newSaving.amount),
      currency: 'ILS',
      transferMethod: newSaving.transferMethod as any,
      cardId: newSaving.cardId || undefined,
      type: newSaving.type as any,
      updateDate: today.toISOString().split('T')[0],
      recurring: newSaving.monthlyDeposit
        ? { type: 'monthly', dayOfMonth: 15, monthlyDeposit: parseFloat(newSaving.monthlyDeposit) }
        : undefined,
    });
    setNewSaving({
      name: '',
      amount: '',
      monthlyDeposit: '',
      transferMethod: 'bank_account',
      cardId: '',
      type: 'savings',
    });
    setIsOpen(false);
  };

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Savings Accounts</h3>
          <p className="text-sm text-muted-foreground">
            Total: {formatCurrency(totalSavings)}
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>Add Savings Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Account Name</Label>
                <Input
                  id="name"
                  value={newSaving.name}
                  onChange={(e) =>
                    setNewSaving({ ...newSaving, name: e.target.value })
                  }
                  placeholder="e.g., Altshuler Investment"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Current Amount (₪)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newSaving.amount}
                  onChange={(e) =>
                    setNewSaving({ ...newSaving, amount: e.target.value })
                  }
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyDeposit">Monthly Deposit (₪)</Label>
                <Input
                  id="monthlyDeposit"
                  type="number"
                  value={newSaving.monthlyDeposit}
                  onChange={(e) =>
                    setNewSaving({ ...newSaving, monthlyDeposit: e.target.value })
                  }
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Transfer Method</Label>
                <Select
                  value={newSaving.transferMethod}
                  onValueChange={(value) =>
                    setNewSaving({ ...newSaving, transferMethod: value })
                  }
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
              <Button type="submit" className="w-full">
                Add Savings
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
              key={saving._id}
              className={cn(
                'p-4 rounded-lg transition-colors group',
                saving.type === 'withdrawal'
                  ? 'bg-destructive/10 border border-destructive/20'
                  : 'bg-secondary/30 hover:bg-secondary/50'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2.5 rounded-lg',
                      saving.type === 'withdrawal'
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-primary/10 text-primary'
                    )}
                  >
                    {saving.type === 'withdrawal' ? (
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
                    <p className="text-lg font-bold">{formatCurrency(saving.amount)}</p>
                    {saving.recurring && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3 text-success" />
                        <span>+{formatCurrency(saving.recurring.monthlyDeposit)}/mo</span>
                      </div>
                    )}
                    {saving.type === 'withdrawal' && saving.withdrawalAmount && (
                      <p className="text-xs text-destructive">
                        -{formatCurrency(saving.withdrawalAmount)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteSavings(saving._id)}
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
