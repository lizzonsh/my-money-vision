import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import {
  formatCurrency,
  getProgressPercentage,
  calculateMonthsToGoal,
  formatMonth,
} from '@/lib/formatters';
import { Plus, Trash2, Target, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
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

const BigPurchasePlanner = () => {
  const { bigPurchases, addBigPurchase, deleteBigPurchase } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    currentSaved: '',
    monthlyContribution: '',
    targetDate: '',
    priority: 'medium',
    category: 'other',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBigPurchase({
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentSaved: parseFloat(newGoal.currentSaved) || 0,
      monthlyContribution: parseFloat(newGoal.monthlyContribution),
      targetDate: newGoal.targetDate || undefined,
      priority: newGoal.priority as any,
      category: newGoal.category as any,
      notes: newGoal.notes || undefined,
    });
    setNewGoal({
      name: '',
      targetAmount: '',
      currentSaved: '',
      monthlyContribution: '',
      targetDate: '',
      priority: 'medium',
      category: 'other',
      notes: '',
    });
    setIsOpen(false);
  };

  const priorityStyles = {
    high: 'border-l-destructive bg-destructive/5',
    medium: 'border-l-warning bg-warning/5',
    low: 'border-l-success bg-success/5',
  };

  const categoryIcons: Record<string, string> = {
    furniture: '🪑',
    electronics: '💻',
    education: '🎓',
    vehicle: '🚗',
    property: '🏠',
    vacation: '✈️',
    other: '📦',
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Big Purchase Planner</h2>
          <p className="text-muted-foreground">
            Plan and track your financial goals
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="glass max-w-md">
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Goal Name</Label>
                <Input
                  id="name"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  placeholder="e.g., New Laptop"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount (₪)</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    value={newGoal.targetAmount}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, targetAmount: e.target.value })
                    }
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentSaved">Already Saved (₪)</Label>
                  <Input
                    id="currentSaved"
                    type="number"
                    value={newGoal.currentSaved}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, currentSaved: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyContribution">Monthly Contribution (₪)</Label>
                  <Input
                    id="monthlyContribution"
                    type="number"
                    value={newGoal.monthlyContribution}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, monthlyContribution: e.target.value })
                    }
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetDate">Target Date</Label>
                  <Input
                    id="targetDate"
                    type="month"
                    value={newGoal.targetDate}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, targetDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newGoal.category}
                    onValueChange={(value) =>
                      setNewGoal({ ...newGoal, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="property">Property</SelectItem>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newGoal.priority}
                    onValueChange={(value) =>
                      setNewGoal({ ...newGoal, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newGoal.notes}
                  onChange={(e) => setNewGoal({ ...newGoal, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full">
                Create Goal
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {bigPurchases.length === 0 ? (
          <div className="col-span-2 glass rounded-xl p-8 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No goals yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start planning your big purchases by creating a goal
            </p>
            <Button onClick={() => setIsOpen(true)}>Create Your First Goal</Button>
          </div>
        ) : (
          bigPurchases.map((goal) => {
            const progress = getProgressPercentage(goal.currentSaved, goal.targetAmount);
            const remaining = goal.targetAmount - goal.currentSaved;
            const monthsToGoal = calculateMonthsToGoal(remaining, goal.monthlyContribution);
            const estimatedDate = new Date();
            estimatedDate.setMonth(estimatedDate.getMonth() + monthsToGoal);

            return (
              <div
                key={goal._id}
                className={cn(
                  'glass rounded-xl p-5 border-l-4 shadow-card transition-all hover:shadow-glow group',
                  priorityStyles[goal.priority]
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{categoryIcons[goal.category]}</span>
                    <div>
                      <h3 className="font-semibold">{goal.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {goal.priority} priority
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteBigPurchase(goal._id)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {formatCurrency(goal.currentSaved)} / {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2.5" />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {progress.toFixed(1)}% complete
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/50 text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-xs">Monthly</span>
                      </div>
                      <p className="text-sm font-semibold text-primary">
                        {formatCurrency(goal.monthlyContribution)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50 text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">Remaining</span>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatCurrency(remaining)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Estimated completion</span>
                      <span className="font-medium">
                        {monthsToGoal === Infinity
                          ? 'Set monthly contribution'
                          : `${monthsToGoal} months (${formatMonth(
                              `${estimatedDate.getFullYear()}-${String(
                                estimatedDate.getMonth() + 1
                              ).padStart(2, '0')}`
                            )})`}
                      </span>
                    </div>
                    {goal.targetDate && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Target date</span>
                        <span className="font-medium">{formatMonth(goal.targetDate)}</span>
                      </div>
                    )}
                  </div>

                  {goal.notes && (
                    <p className="text-xs text-muted-foreground italic pt-2 border-t border-border/50">
                      {goal.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BigPurchasePlanner;
