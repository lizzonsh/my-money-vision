import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency, getProgressPercentage, calculateMonthsToGoal } from '@/lib/formatters';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const SavingsGoals = () => {
  const { bigPurchases } = useFinance();

  const priorityColors = {
    high: 'border-l-destructive',
    medium: 'border-l-warning',
    low: 'border-l-success',
  };

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Savings Goals</h3>
        <Target className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="space-y-4">
        {bigPurchases.slice(0, 3).map((goal) => {
          const progress = getProgressPercentage(goal.currentSaved, goal.targetAmount);
          const remaining = goal.targetAmount - goal.currentSaved;
          const monthsToGoal = calculateMonthsToGoal(remaining, goal.monthlyContribution);

          return (
            <div
              key={goal._id}
              className={cn(
                'p-3 rounded-lg bg-secondary/30 border-l-4',
                priorityColors[goal.priority]
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{goal.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{goal.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(goal.currentSaved)}</p>
                  <p className="text-xs text-muted-foreground">
                    of {formatCurrency(goal.targetAmount)}
                  </p>
                </div>
              </div>
              
              <Progress value={progress} className="h-2 mb-2" />
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progress.toFixed(0)}% complete</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {monthsToGoal === Infinity ? '∞' : monthsToGoal} months left
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {bigPurchases.length > 3 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{bigPurchases.length - 3} more goals
          </p>
        )}
      </div>
    </div>
  );
};

export default SavingsGoals;
