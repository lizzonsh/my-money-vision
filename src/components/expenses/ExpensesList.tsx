import { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useFinance, Expense } from '@/contexts/FinanceContext';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { useGoalItems } from '@/hooks/useGoalItems';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { isDateUpToToday, isCurrentMonth } from '@/lib/dateUtils';
import { Plus, Trash2, CreditCard, Building2, Repeat, Pencil, CalendarIcon, Tag, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const navigate = useNavigate();
  const { expenses, currentMonth, addExpense, updateExpense, deleteExpense } = useFinance();
  const { categories, addCategory, isAddingCategory } = useExpenseCategories();
  const { goalItems } = useGoalItems();
  const [isOpen, setIsOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'other',
    paymentMethod: 'bank_transfer',
    cardId: '',
    kind: 'payed',
    isRecurring: false,
    dayOfMonth: '',
    expenseDate: new Date(),
  });

  const monthlyExpenses = expenses.filter((e) => e.month === currentMonth);
  
  // Get unpurchased goal items planned for current month
  const plannedGoalItems = goalItems.filter(
    item => !item.is_purchased && item.planned_month === currentMonth
  );
  
  // Calculate planned goal expenses total
  const plannedGoalExpenses = plannedGoalItems.reduce((sum, item) => sum + Number(item.estimated_cost), 0);
  
  // For current month, only count items up to today's date
  const shouldFilterByDate = isCurrentMonth(currentMonth);
  const expensesUpToDate = monthlyExpenses.filter(e => !shouldFilterByDate || isDateUpToToday(e.expense_date));
  
  // Separate credit card debit from regular expenses
  const creditCardDebits = expensesUpToDate.filter(e => e.category === 'debit_from_credit_card');
  const creditCardDebitTotal = creditCardDebits.reduce((sum, e) => sum + Number(e.amount), 0);
  
  // Regular expenses (excluding credit card debits and planned credit card expenses to avoid double counting)
  // Credit card planned expenses will be counted when they become debit_from_credit_card next month
  const regularExpenses = expensesUpToDate.filter(e => 
    e.category !== 'debit_from_credit_card' && 
    !(e.payment_method === 'credit_card' && e.kind === 'planned')
  );
  
  const bankTransferExpenses = regularExpenses
    .filter(e => e.payment_method === 'bank_transfer')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  
  const creditCardPaidExpenses = regularExpenses
    .filter(e => e.payment_method === 'credit_card' && e.kind === 'payed')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  
  // Planned credit card expenses (for display only, not counted in totals)
  // Use all monthly expenses (not filtered by date) to match FinanceContext calculation
  const plannedCreditCardExpenses = monthlyExpenses
    .filter(e => e.payment_method === 'credit_card' && e.kind === 'planned' && e.category !== 'debit_from_credit_card')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  
  // Planned bank transfer expenses
  const plannedBankTransferExpenses = monthlyExpenses
    .filter(e => e.payment_method === 'bank_transfer' && e.kind === 'planned')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  
  // Actual (paid) bank transfer expenses
  const paidBankTransferExpenses = expensesUpToDate
    .filter(e => e.payment_method === 'bank_transfer' && e.kind === 'payed')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  
  // Total that affects current month = bank transfers + credit card debits (actual withdrawals)
  const effectiveTotal = bankTransferExpenses + creditCardDebitTotal + creditCardPaidExpenses;
  
  // For display purposes - all expenses
  const totalExpenses = expensesUpToDate.reduce((sum, e) => sum + Number(e.amount), 0);
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
      expenseDate: new Date(),
    });
    setEditingExpense(null);
    setShowNewCategory(false);
    setNewCategoryName('');
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
      expenseDate: expense.expense_date ? new Date(expense.expense_date) : new Date(),
    });
    setIsOpen(true);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const categoryKey = newCategoryName.toLowerCase().replace(/\s+/g, '_');
    addCategory({
      name: categoryKey,
      color: 'hsl(var(--muted))',
      icon: 'tag',
      is_default: false,
    });
    setFormData({ ...formData, category: categoryKey });
    setShowNewCategory(false);
    setNewCategoryName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedDate = formData.expenseDate;
    const monthFromDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
    
    const expenseData = {
      expense_date: format(selectedDate, 'yyyy-MM-dd'),
      month: monthFromDate,
      amount: parseFloat(formData.amount),
      category: formData.category,
      kind: formData.kind as 'planned' | 'payed' | 'predicted',
      payment_method: formData.paymentMethod as 'bank_transfer' | 'credit_card',
      card_id: formData.cardId || null,
      description: formData.description,
      recurring_type: formData.isRecurring ? 'monthly' as const : null,
      recurring_day_of_month: formData.isRecurring ? parseInt(formData.dayOfMonth) || 1 : null,
      expense_month: null,
      month_of_expense: null,
    };

    if (editingExpense) {
      updateExpense({ id: editingExpense.id, ...expenseData });
    } else {
      addExpense(expenseData);
    }
    resetForm();
    setIsOpen(false);
  };

  // Build category colors from categories list
  const categoryColors: Record<string, string> = {
    room: 'bg-chart-1/20 text-chart-1',
    gifts: 'bg-chart-2/20 text-chart-2',
    psychologist: 'bg-chart-3/20 text-chart-3',
    college: 'bg-chart-4/20 text-chart-4',
    vacation: 'bg-chart-5/20 text-chart-5',
    debit_from_credit_card: 'bg-warning/20 text-warning',
    budget: 'bg-accent/20 text-accent-foreground',
    goal: 'bg-primary/20 text-primary',
    planned: 'bg-chart-4/20 text-chart-4',
    other: 'bg-muted text-muted-foreground',
  };

  // Add custom category colors
  categories.forEach(cat => {
    if (!categoryColors[cat.name]) {
      categoryColors[cat.name] = 'bg-primary/20 text-primary';
    }
  });

  // Check if an expense is from a goal purchase
  const isGoalExpense = (expense: Expense) => {
    return expense.category === 'goal';
  };

  const handleExpenseClick = (expense: Expense) => {
    if (isGoalExpense(expense)) {
      navigate('/goals');
    }
  };

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Expenses</h3>
          <p className="text-lg font-bold">{formatCurrency(effectiveTotal + plannedGoalExpenses)}</p>
          <p className="text-xs text-muted-foreground">(incl. {formatCurrency(plannedGoalExpenses)} in goals)</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
            <span className="text-success">Bank Paid: {formatCurrency(paidBankTransferExpenses)}</span>
            <span className="text-warning">CC Debit: {formatCurrency(creditCardDebitTotal)}</span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-1 p-2 rounded bg-secondary/50">
            <span className="font-medium text-muted-foreground">Planned:</span>
            <span className="text-success/80">Bank: {formatCurrency(plannedBankTransferExpenses)}</span>
            <span className="text-primary">CC: {formatCurrency(plannedCreditCardExpenses)}</span>
            {plannedGoalExpenses > 0 && (
              <span className="text-primary">Goals: {formatCurrency(plannedGoalExpenses)}</span>
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
          <DialogContent className="glass max-h-[90vh] overflow-y-auto">
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
                  {showNewCategory ? (
                    <div className="flex gap-2">
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category name"
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={handleAddCategory}
                        disabled={isAddingCategory || !newCategoryName.trim()}
                      >
                        Add
                      </Button>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setShowNewCategory(false)}
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={formData.category}
                      onValueChange={(value) => {
                        if (value === '__new__') {
                          setShowNewCategory(true);
                        } else {
                          setFormData({ ...formData, category: value });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.name} value={cat.name}>
                            {cat.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="__new__" className="text-primary">
                          <span className="flex items-center gap-2">
                            <Plus className="h-3 w-3" />
                            Add New Category
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
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
                      <SelectItem value="payed">None</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
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
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.expenseDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expenseDate ? format(formData.expenseDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.expenseDate}
                      onSelect={(date) => date && setFormData({ ...formData, expenseDate: date })}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button type="submit" className="w-full">
                {editingExpense ? 'Save Changes' : 'Add Expense'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
        {monthlyExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No expenses this month
          </p>
        ) : (
          monthlyExpenses.map((expense) => {
            const isFromGoal = isGoalExpense(expense);
            return (
            <div
              key={expense.id}
              onClick={() => handleExpenseClick(expense)}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg bg-secondary/30 interactive-card group",
                isFromGoal && "cursor-pointer hover:bg-secondary/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  isFromGoal ? "bg-chart-4/20" : "bg-secondary"
                )}>
                  {isFromGoal ? (
                    <Target className="h-4 w-4 text-chart-4" />
                  ) : expense.payment_method === 'credit_card' ? (
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
                    {isFromGoal && (
                      <span className="text-xs text-chart-4">→ Goals</span>
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
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      expense.payment_method === 'credit_card' 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-success/20 text-success'
                    )}>
                      {expense.payment_method === 'credit_card' 
                        ? (expense.card_id ? formatCardName(expense.card_id) : 'Credit Card')
                        : 'Bank Transfer'}
                    </span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      expense.kind === 'planned' 
                        ? 'bg-warning/20 text-warning' 
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {expense.kind === 'planned' ? 'Planned' : ''}
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
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExpensesList;
