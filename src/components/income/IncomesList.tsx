import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Plus, Trash2, Briefcase, Gift, Heart } from 'lucide-react';
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

const IncomesList = () => {
  const { incomes, currentMonth, addIncome, deleteIncome } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [newIncome, setNewIncome] = useState({
    description: '',
    amount: '',
    name: 'work',
  });

  const monthlyIncomes = incomes.filter((i) => i.month === currentMonth);
  const totalIncome = monthlyIncomes.reduce((sum, i) => sum + i.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addIncome({
      incomeDate: new Date().toISOString().split('T')[0],
      month: currentMonth,
      amount: parseFloat(newIncome.amount),
      name: newIncome.name as any,
      description: newIncome.description,
    });
    setNewIncome({ description: '', amount: '', name: 'work' });
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
          <p className="text-sm text-muted-foreground">
            Total: {formatCurrency(totalIncome)}
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
              <DialogTitle>Add Income</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newIncome.description}
                  onChange={(e) =>
                    setNewIncome({ ...newIncome, description: e.target.value })
                  }
                  placeholder="Income description"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₪)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newIncome.amount}
                  onChange={(e) =>
                    setNewIncome({ ...newIncome, amount: e.target.value })
                  }
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select
                  value={newIncome.name}
                  onValueChange={(value) =>
                    setNewIncome({ ...newIncome, name: value })
                  }
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
              <Button type="submit" className="w-full">
                Add Income
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {monthlyIncomes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No income this month
          </p>
        ) : (
          monthlyIncomes.map((income) => (
            <div
              key={income._id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${incomeColors[income.name] || incomeColors.other}`}>
                  {getIncomeIcon(income.name)}
                </div>
                <div>
                  <p className="text-sm font-medium">{income.description}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {income.name === 'bit' ? 'Freelance' : income.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-semibold text-success">
                    +{formatCurrency(income.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(income.incomeDate)}
                  </p>
                </div>
                <button
                  onClick={() => deleteIncome(income._id)}
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
