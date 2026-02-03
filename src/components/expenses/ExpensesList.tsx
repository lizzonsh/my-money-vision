import { useState } from 'react';
import { useFinance, Expense } from '@/contexts/FinanceContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { isDateUpToToday, isCurrentMonth } from '@/lib/dateUtils';
import { Plus, Trash2, CreditCard, Building2, Repeat, Pencil } from 'lucide-react';
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
  const { expenses, currentMonth, addExpense, updateExpense, deleteExpense } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
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
  
  // For current month, only count items up to today's date
  const shouldFilterByDate = isCurrentMonth(currentMonth);
  const expensesUpToDate = monthlyExpenses.filter(e => !shouldFilterByDate || isDateUpToToday(e.expense_date));
  
  const totalExpenses = expensesUpToDate.reduce((sum, e) => sum + Number(e.amount), 0);
  const paidExpenses = expensesUpToDate.filter(e => e.kind === 'payed').reduce((sum, e) => sum + Number(e.amount), 0);
  const plannedExpenses = expensesUpToDate.filter(e => e.kind === 'planned').reduce((sum, e) => sum + Number(e.amount), 0);
  const predictedExpenses = monthlyExpenses.filter(e => e.kind === 'predicted').reduce((sum, e) => sum + Number(e.amount), 0);

  const formatCardName = (cardId?: string | null) => {
    if (!cardId) return '';
    const cardNames: Record<string, string> = {
      'fly-card': 'Fly Card',
      'hever': 'Hever',
      'visa': 'Visa',
    };
    return cardNames[cardId] || cardId;
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: 'other',
      paymentMethod: 'bank_transfer',
      cardId: '',
      kind: 'payed',
      isRecurring: false,
      dayOfMonth: '',
    });
    setEditingExpense(null);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      paymentMethod: expense.payment_method,
      cardId: expense.card_id || '',
      kind: expense.kind,
      isRecurring: !!expense.recurring_type,
      dayOfMonth: expense.recurring_day_of_month?.toString() || '',
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expenseData = {
      expense_date: new Date().toISOString().split('T')[0],
      month: currentMonth,
      amount: parseFloat(formData.amount),
      category: formData.category,
      kind: formData.kind as 'planned' | 'payed' | 'predicted',
      payment_method: formData.paymentMethod as 'bank_transfer' | 'credit_card',
      card_id: formData.cardId || null,
      description: formData.description,
      recurring_type: formData.isRecurring ? 'monthly' as const : null,
      recurring_day_of_month: formData.isRecurring ? parseInt(formData.dayOfMonth) || 1 : null,
    };

    if (editingExpense) {
      updateExpense({ id: editingExpense.id, ...expenseData });
    } else {
      addExpense(expenseData);
    }
    resetForm();
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
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What was this for?"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₪)</Label>
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
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
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
                    value={formData.kind}
                    onValueChange={(value) => setFormData({ ...formData, kind: value })}
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
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
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
                {(formData.paymentMethod === 'credit_card' || formData.category === 'debit_from_credit_card') && (
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
                {editingExpense ? 'Save Changes' : 'Add Expense'}
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
              key={expense.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  {expense.payment_method === 'credit_card' ? (
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{expense.description}</p>
                    {expense.recurring_type && (
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
                    {expense.category === 'debit_from_credit_card' && expense.card_id && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        {formatCardName(expense.card_id)}
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
                  <p className="text-sm font-semibold">{formatCurrency(Number(expense.amount))}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(expense.expense_date)}
                  </p>
                </div>
                <button
                  onClick={() => handleOpenEdit(expense)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-secondary rounded transition-all"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => deleteExpense(expense.id)}
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
