import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { Plus, Trash2, Pencil, Repeat, Play, Pause, Briefcase, Gift, Heart, HelpCircle } from 'lucide-react';
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
import { RecurringIncome } from '@/types/finance';

const RecurringIncomesPanel = () => {
  const { 
    recurringIncomes, 
    addRecurringIncome, 
    updateRecurringIncome, 
    deleteRecurringIncome,
    createIncomeFromRecurring 
  } = useFinance();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<RecurringIncome | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    defaultAmount: '',
    source: 'work',
    dayOfMonth: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      defaultAmount: '',
      source: 'work',
      dayOfMonth: '',
      notes: '',
    });
    setEditingIncome(null);
  };

  const handleOpenEdit = (income: RecurringIncome) => {
    setEditingIncome(income);
    setFormData({
      name: income.name,
      defaultAmount: income.defaultAmount.toString(),
      source: income.source,
      dayOfMonth: income.dayOfMonth.toString(),
      notes: income.notes || '',
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const incomeData = {
      name: formData.name,
      defaultAmount: parseFloat(formData.defaultAmount),
      source: formData.source,
      dayOfMonth: parseInt(formData.dayOfMonth) || 1,
      isActive: true,
      notes: formData.notes || undefined,
    };

    if (editingIncome) {
      updateRecurringIncome(editingIncome._id, incomeData);
    } else {
      addRecurringIncome(incomeData);
    }
    resetForm();
    setIsOpen(false);
  };

  const toggleActive = (income: RecurringIncome) => {
    updateRecurringIncome(income._id, { isActive: !income.isActive });
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'work':
        return <Briefcase className="h-4 w-4" />;
      case 'bit':
        return <Gift className="h-4 w-4" />;
      case 'mom':
        return <Heart className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'work': return 'Work';
      case 'bit': return 'Freelance';
      case 'mom': return 'Family';
      default: return 'Other';
    }
  };

  const totalMonthly = recurringIncomes
    .filter(i => i.isActive)
    .reduce((sum, i) => sum + i.defaultAmount, 0);

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Repeat className="h-4 w-4 text-success" />
            Default Incomes
          </h3>
          <p className="text-lg font-bold text-success">{formatCurrency(totalMonthly)}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
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
              <DialogTitle>{editingIncome ? 'Edit Default Income' : 'Add Default Income'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Monthly Salary"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultAmount">Default Amount (₪)</Label>
                  <Input
                    id="defaultAmount"
                    type="number"
                    value={formData.defaultAmount}
                    onChange={(e) => setFormData({ ...formData, defaultAmount: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dayOfMonth">Day of Month</Label>
                  <Input
                    id="dayOfMonth"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dayOfMonth}
                    onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                    placeholder="1"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => setFormData({ ...formData, source: value })}
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
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingIncome ? 'Save Changes' : 'Add Income'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {recurringIncomes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No default incomes set up
          </p>
        ) : (
          recurringIncomes.map((income) => (
            <div
              key={income._id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg transition-colors group',
                income.isActive 
                  ? 'bg-secondary/30 hover:bg-secondary/50' 
                  : 'bg-muted/20 opacity-60'
              )}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleActive(income)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    income.isActive 
                      ? 'bg-success/20 text-success' 
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {income.isActive ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
                <div>
                  <p className="text-sm font-medium">{income.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Day {income.dayOfMonth}</span>
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-success/10 text-success">
                      {getSourceIcon(income.source)}
                      {getSourceLabel(income.source)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-semibold text-success">+{formatCurrency(income.defaultAmount)}</p>
                </div>
                <button
                  onClick={() => createIncomeFromRecurring(income._id)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-success/10 rounded transition-all"
                  title="Add to this month's income"
                >
                  <Plus className="h-4 w-4 text-success" />
                </button>
                <button
                  onClick={() => handleOpenEdit(income)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-secondary rounded transition-all"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => deleteRecurringIncome(income._id)}
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

export default RecurringIncomesPanel;
