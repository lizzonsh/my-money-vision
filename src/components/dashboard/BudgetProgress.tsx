import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const BudgetProgress = () => {
  const { budgets, addBudget, updateBudget, calculatedBudget, currentMonth, getBudgetForMonth } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [editBudget, setEditBudget] = useState({
    totalBudget: '',
    daysInMonth: '',
    notes: '',
  });

  const budget = getBudgetForMonth(currentMonth);
  const totalBudget = budget ? Number(budget.total_budget) : 0;

  const { spentBudget, leftBudget, dailyLimit, plannedCreditCardExpenses } = calculatedBudget;
  
  // Progress shows spent against the defined budget
  const percentage = totalBudget > 0 ? Math.min((spentBudget / totalBudget) * 100, 100) : 0;
  const isOverBudget = leftBudget < 0;

  const today = new Date();
  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = budget?.days_in_month || new Date(year, month, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - today.getDate() + 1);

  const handleOpenEdit = () => {
    const [year, monthNum] = currentMonth.split('-').map(Number);
    const autoDaysInMonth = new Date(year, monthNum, 0).getDate();
    
    setEditBudget({
      totalBudget: totalBudget.toString(),
      daysInMonth: (budget?.days_in_month || autoDaysInMonth).toString(),
      notes: budget?.notes || '',
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetData = {
      month: currentMonth,
      total_budget: parseFloat(editBudget.totalBudget),
      days_in_month: parseInt(editBudget.daysInMonth),
      notes: editBudget.notes || null,
      currency: 'ILS',
      daily_limit: null,
      left_budget: null,
      spent_budget: null,
      status: null,
    };

    if (budget) {
      updateBudget({ id: budget.id, ...budgetData });
    } else {
      addBudget(budgetData);
    }
    setIsOpen(false);
  };

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Monthly Budget</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{budget?.month || currentMonth}</span>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button 
                onClick={handleOpenEdit}
                className="p-1.5 hover:bg-secondary rounded transition-colors"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </button>
            </DialogTrigger>
            <DialogContent className="glass">
              <DialogHeader>
                <DialogTitle>{budget ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="totalBudget">Total Budget (₪)</Label>
                  <Input
                    id="totalBudget"
                    type="number"
                    value={editBudget.totalBudget}
                    onChange={(e) => setEditBudget({ ...editBudget, totalBudget: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daysInMonth">Days in Month</Label>
                  <Input
                    id="daysInMonth"
                    type="number"
                    value={editBudget.daysInMonth}
                    onChange={(e) => setEditBudget({ ...editBudget, daysInMonth: e.target.value })}
                    placeholder="30"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={editBudget.notes}
                    onChange={(e) => setEditBudget({ ...editBudget, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Save Budget
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Spent</span>
            <span className={isOverBudget ? 'text-destructive' : ''}>
              {formatCurrency(Math.abs(spentBudget))} / {formatCurrency(totalBudget)}
            </span>
          </div>
          <Progress 
            value={Math.abs(percentage)} 
            className={`h-3 ${isOverBudget ? '[&>div]:bg-destructive' : '[&>div]:bg-primary'}`}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
            <p className={`text-lg font-bold ${isOverBudget ? 'text-destructive' : 'text-success'}`}>
              {formatCurrency(Math.abs(leftBudget))}
              {isOverBudget && <span className="text-xs ml-1">over</span>}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground mb-1">Daily Limit</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(Math.max(0, dailyLimit))}
            </p>
          </div>
        </div>

        {plannedCreditCardExpenses > 0 && (
          <div className="text-xs text-muted-foreground text-center pt-2 p-2 rounded bg-warning/10 border border-warning/20">
            <span className="text-warning font-medium">Budget: {formatCurrency(totalBudget)} + Planned CC: {formatCurrency(plannedCreditCardExpenses)}</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center pt-2">
          {daysRemaining} days remaining in month
        </div>
      </div>
    </div>
  );
};

export default BudgetProgress;
