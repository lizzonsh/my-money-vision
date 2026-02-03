import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Plus, Trash2, CreditCard, Building2, Repeat } from 'lucide-react';
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

const ExpensesList = () => {
  const { expenses, currentMonth, addExpense, deleteExpense } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'other',
    paymentMethod: 'bank_transfer',
    cardId: '',
    kind: 'payed',
    isRecurring: false,
    dayOfMonth: '',
  });

  const monthlyExpenses = expenses.filter((e) => e.month === currentMonth);
  const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const paidExpenses = monthlyExpenses.filter(e => e.kind === 'payed').reduce((sum, e) => sum + e.amount, 0);
  const plannedExpenses = monthlyExpenses.filter(e => e.kind === 'planned').reduce((sum, e) => sum + e.amount, 0);
  const predictedExpenses = monthlyExpenses.filter(e => e.kind === 'predicted').reduce((sum, e) => sum + e.amount, 0);

  const formatCardName = (cardId?: string) => {
    if (!cardId) return '';
    const cardNames: Record<string, string> = {
      'fly-card': 'Fly Card',
      'hever': 'Hever',
      'visa': 'Visa',
    };
    return cardNames[cardId] || cardId;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      expenseDate: new Date().toISOString().split('T')[0],
      month: currentMonth,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category as any,
      kind: newExpense.kind as any,
      paymentMethod: newExpense.paymentMethod as any,
      cardId: newExpense.cardId as any || undefined,
      description: newExpense.description,
      recurring: newExpense.isRecurring
        ? { type: 'monthly', dayOfMonth: parseInt(newExpense.dayOfMonth) || 1 }
        : undefined,
    });
    setNewExpense({
      description: '',
      amount: '',
      category: 'other',
      paymentMethod: 'bank_transfer',
      cardId: '',
      kind: 'payed',
      isRecurring: false,
      dayOfMonth: '',
    });
    setIsOpen(false);
  };

  const categoryColors: Record<string, string> = {
    room: 'bg-chart-1/20 text-chart-1',
    gifts: 'bg-chart-2/20 text-chart-2',
    psychologist: 'bg-chart-3/20 text-chart-3',
    college: 'bg-chart-4/20 text-chart-4',
    vacation: 'bg-chart-5/20 text-chart-5',
    debit_from_credit_card: 'bg-warning/20 text-warning',
    budget: 'bg-accent/20 text-accent-foreground',
    other: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Expenses</h3>
          <p className="text-lg font-bold">{formatCurrency(totalExpenses)}</p>
          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
            <span className="text-success">Paid: {formatCurrency(paidExpenses)}</span>
            <span className="text-warning">Planned: {formatCurrency(plannedExpenses)}</span>
            <span className="text-muted-foreground">Predicted: {formatCurrency(predictedExpenses)}</span>
          </div>
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
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newExpense.description}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, description: e.target.value })
                  }
                  placeholder="What was this for?"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₪)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                  placeholder="0"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) =>
                      setNewExpense({ ...newExpense, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="room">Room/Rent</SelectItem>
                      <SelectItem value="gifts">Gifts</SelectItem>
                      <SelectItem value="psychologist">Psychologist</SelectItem>
                      <SelectItem value="college">College</SelectItem>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="debit_from_credit_card">Debit from Credit Card</SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={newExpense.kind}
                    onValueChange={(value) =>
                      setNewExpense({ ...newExpense, kind: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payed">Paid</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="predicted">Predicted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={newExpense.paymentMethod}
                    onValueChange={(value) =>
                      setNewExpense({ ...newExpense, paymentMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newExpense.paymentMethod === 'credit_card' && (
                  <div className="space-y-2">
                    <Label>Card</Label>
                    <Select
                      value={newExpense.cardId}
                      onValueChange={(value) =>
                        setNewExpense({ ...newExpense, cardId: value })
                      }
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
                Add Expense
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {monthlyExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No expenses this month
          </p>
        ) : (
          monthlyExpenses.map((expense) => (
            <div
              key={expense._id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  {expense.paymentMethod === 'credit_card' ? (
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{expense.description}</p>
                    {expense.recurring && (
                      <Repeat className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        categoryColors[expense.category] || categoryColors.other
                      )}
                    >
                      {expense.category.replace(/_/g, ' ')}
                    </span>
                    {expense.category === 'debit_from_credit_card' && expense.cardId && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        {formatCardName(expense.cardId)}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground capitalize">
                      {expense.kind}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(expense.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(expense.expenseDate)}
                  </p>
                </div>
                <button
                  onClick={() => deleteExpense(expense._id)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExpensesList;
