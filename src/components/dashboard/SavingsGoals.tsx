import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency, getProgressPercentage, calculateMonthsToGoal } from '@/lib/formatters';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const SavingsGoals = () => {
  const { bigPurchases } = useFinance();
  const navigate = useNavigate();

  const priorityColors = {
    high: 'border-l-destructive',
    medium: 'border-l-warning',
    low: 'border-l-success',
  };

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Savings Goals</h3>
        <button
          onClick={() => navigate('/goals')}
          className="text-xs text-primary hover:underline transition-colors"
        >
          View All
        </button>
      </div>

      <div className="space-y-4">
        {bigPurchases.slice(0, 3).map((goal) => {
          const progress = getProgressPercentage(Number(goal.current_saved), Number(goal.target_amount));
          const remaining = Number(goal.target_amount) - Number(goal.current_saved);
          const monthsToGoal = calculateMonthsToGoal(remaining, Number(goal.monthly_contribution));

          return (
            <div
              key={goal.id}
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
                  <p className="text-sm font-semibold">{formatCurrency(Number(goal.current_saved))}</p>
                  <p className="text-xs text-muted-foreground">
                    of {formatCurrency(Number(goal.target_amount))}
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
