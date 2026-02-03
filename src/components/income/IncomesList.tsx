import { useState } from 'react';
import { format } from 'date-fns';
import { useFinance, Income } from '@/contexts/FinanceContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { isDateUpToToday, isCurrentMonth } from '@/lib/dateUtils';
import { Plus, Trash2, Briefcase, Gift, Heart, Pencil, CalendarIcon } from 'lucide-react';
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

const IncomesList = () => {
  const { incomes, currentMonth, addIncome, updateIncome, deleteIncome } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    name: 'work',
    incomeDate: new Date(),
  });

  const monthlyIncomes = incomes.filter((i) => i.month === currentMonth);
  
  // For current month, only count items up to today's date
  const shouldFilterByDate = isCurrentMonth(currentMonth);
  const incomesUpToDate = monthlyIncomes.filter(i => !shouldFilterByDate || isDateUpToToday(i.income_date || ''));

  // Get only the latest record per income name/source for display
  const latestIncomesPerName = incomesUpToDate.reduce((acc, income) => {
    const existing = acc.get(income.name);
    if (!existing || new Date(income.updated_at) > new Date(existing.updated_at)) {
      acc.set(income.name, income);
    }
    return acc;
  }, new Map<string, Income>());

  const uniqueIncomes = Array.from(latestIncomesPerName.values());
  
  const totalIncome = incomesUpToDate.reduce((sum, i) => sum + Number(i.amount), 0);

  const resetForm = () => {
    setFormData({ description: '', amount: '', name: 'work', incomeDate: new Date() });
    setEditingIncome(null);
  };

  const handleOpenEdit = (income: Income) => {
    setEditingIncome(income);
    setFormData({
      description: income.description || '',
      amount: income.amount.toString(),
      name: income.name,
      incomeDate: income.income_date ? new Date(income.income_date) : new Date(),
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedDate = formData.incomeDate;
    const monthFromDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
    
    const incomeData = {
      income_date: format(selectedDate, 'yyyy-MM-dd'),
      month: monthFromDate,
      amount: parseFloat(formData.amount),
      name: formData.name,
      description: formData.description || null,
      recurring_day_of_month: null,
      recurring_type: null,
    };

    if (editingIncome) {
      updateIncome({ id: editingIncome.id, ...incomeData });
    } else {
      addIncome(incomeData);
    }
    resetForm();
    setIsOpen(false);
  };

  const getIncomeIcon = (name: string) => {
    switch (name) {
      case 'work':
        return <Briefcase className="h-4 w-4" />;
      case 'bit':
        return <Gift className="h-4 w-4" />;
      case 'mom':
        return <Heart className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const incomeColors: Record<string, string> = {
    work: 'bg-success/10 text-success',
    bit: 'bg-chart-2/10 text-chart-2',
    mom: 'bg-chart-3/10 text-chart-3',
    other: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Income</h3>
          <p className="text-lg font-bold text-success">{formatCurrency(totalIncome)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {uniqueIncomes.length} source{uniqueIncomes.length !== 1 ? 's' : ''} this month
            {monthlyIncomes.length > uniqueIncomes.length && (
              <span className="text-muted-foreground/70 ml-1">
                ({monthlyIncomes.length} total entries)
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
              <DialogTitle>{editingIncome ? 'Edit Income' : 'Add Income'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Income description"
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
                  <Label>Source</Label>
                  <Select
                    value={formData.name}
                    onValueChange={(value) => setFormData({ ...formData, name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="bit">Freelance/Bit</SelectItem>
                      <SelectItem value="mom">Family Support</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.incomeDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.incomeDate ? format(formData.incomeDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.incomeDate}
                        onSelect={(date) => date && setFormData({ ...formData, incomeDate: date })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingIncome ? 'Save Changes' : 'Add Income'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {uniqueIncomes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No income this month
          </p>
        ) : (
          uniqueIncomes.map((income) => (
            <div
              key={income.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${incomeColors[income.name] || incomeColors.other}`}>
                  {getIncomeIcon(income.name)}
                </div>
                <div>
                  <p className="text-sm font-medium">{income.description || income.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {income.name === 'bit' ? 'Freelance' : income.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-semibold text-success">
                    +{formatCurrency(Number(income.amount))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {income.income_date ? formatDate(income.income_date) : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleOpenEdit(income)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-secondary rounded transition-all"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => deleteIncome(income.id)}
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

export default IncomesList;
