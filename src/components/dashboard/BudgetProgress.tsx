import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { Progress } from '@/components/ui/progress';

const BudgetProgress = () => {
  const { budget, expenses, currentMonth } = useFinance();
  
  const monthlyExpenses = expenses
    .filter(e => e.month === currentMonth && e.kind !== 'predicted')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const remaining = budget.totalBudget - monthlyExpenses;
  const percentage = Math.min((monthlyExpenses / budget.totalBudget) * 100, 100);
  const isOverBudget = remaining < 0;
  
  // Calculate daily budget based on remaining days
  const today = new Date();
  const daysRemaining = budget.daysInMonth - today.getDate() + 1;
  const dailyLimit = remaining > 0 ? remaining / daysRemaining : 0;

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Monthly Budget</h3>
        <span className="text-sm text-muted-foreground">{budget.month}</span>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Spent</span>
            <span className={isOverBudget ? 'text-destructive' : ''}>
              {formatCurrency(monthlyExpenses)} / {formatCurrency(budget.totalBudget)}
            </span>
          </div>
          <Progress 
            value={percentage} 
            className={`h-3 ${isOverBudget ? '[&>div]:bg-destructive' : '[&>div]:bg-primary'}`}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
            <p className={`text-lg font-bold ${isOverBudget ? 'text-destructive' : 'text-success'}`}>
              {formatCurrency(Math.abs(remaining))}
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

        <div className="text-xs text-muted-foreground text-center pt-2">
          {daysRemaining} days remaining in month
        </div>
      </div>
    </div>
  );
};

export default BudgetProgress;
