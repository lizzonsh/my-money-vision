import { useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useGoalItems } from '@/hooks/useGoalItems';
import { formatCurrency } from '@/lib/formatters';
import { Target, Check, X, CreditCard, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalItemInfo {
  id: string;
  name: string;
  cost: number;
  goalName: string;
  paymentMethod: string;
  isPurchased: boolean;
}

interface GoalScenarioComparisonProps {
  projectedBalance: number;
}

const GoalScenarioComparison = ({
  projectedBalance,
}: GoalScenarioComparisonProps) => {
  const { currentMonth, bigPurchases, calculatedBudget } = useFinance();
  const { goalItems } = useGoalItems();

  // "After Budget" is the baseline
  const afterBudgetBalance = projectedBalance - calculatedBudget.leftBudget;

  // Get all goal items for current month
  const allGoalItems = useMemo(() => {
    return goalItems
      .filter(item => item.planned_month === currentMonth)
      .map(item => {
        const goal = bigPurchases.find(g => g.id === item.goal_id);
        return {
          id: item.id,
          name: item.name,
          cost: Number(item.estimated_cost),
          goalName: goal?.name || 'Unknown Goal',
          paymentMethod: item.payment_method,
          isPurchased: item.is_purchased,
        };
      });
  }, [goalItems, bigPurchases, currentMonth]);

  // Only unpurchased items affect the balance calculation
  const unpurchasedGoalItems = useMemo(() => {
    return allGoalItems.filter(item => !item.isPurchased);
  }, [allGoalItems]);

  // Calculate totals
  const totalGoalsCost = unpurchasedGoalItems.reduce((sum, item) => sum + item.cost, 0);
  const withAllGoals = afterBudgetBalance - totalGoalsCost;

  // Show panel if there are any goal items for current month
  if (allGoalItems.length === 0) {
    return null;
  }

  return (
    <div className="border-t p-4 space-y-4 bg-accent/5">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-accent-foreground" />
          Goal Scenarios
        </h5>
        <span className="text-xs text-muted-foreground">
          {unpurchasedGoalItems.length} pending • {allGoalItems.length - unpurchasedGoalItems.length} paid
        </span>
      </div>

      {/* Summary Comparison */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">After Budget</p>
          <p className="font-semibold text-success">{formatCurrency(afterBudgetBalance)}</p>
        </div>
        <div className="p-3 rounded-lg bg-primary/10 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">With All Goals</p>
          <p className={cn(
            "font-semibold",
            withAllGoals >= 0 ? "text-primary" : "text-destructive"
          )}>
            {formatCurrency(withAllGoals)}
          </p>
        </div>
      </div>

      <div className="text-xs text-center text-muted-foreground">
        Total planned: {formatCurrency(totalGoalsCost)}
      </div>

      {/* Goal Items List */}
      <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
        {allGoalItems.map(item => {
          const affordable = afterBudgetBalance >= item.cost;
          return (
            <div 
              key={item.id} 
              className={cn(
                "flex items-center justify-between p-2 rounded-lg text-xs",
                item.isPurchased ? "bg-success/10 opacity-60" : "bg-muted/30"
              )}
            >
              <div className="flex items-center gap-1.5">
                {item.isPurchased ? (
                  <Check className="h-3 w-3 text-success" />
                ) : affordable ? (
                  <Check className="h-3 w-3 text-success" />
                ) : (
                  <X className="h-3 w-3 text-destructive" />
                )}
                {item.paymentMethod === 'credit_card' ? (
                  <CreditCard className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                )}
                <span className={cn(
                  "truncate max-w-[120px]",
                  item.isPurchased && "line-through"
                )} title={item.name}>
                  {item.name}
                </span>
                {item.isPurchased && (
                  <span className="text-[10px] text-success font-medium">Paid</span>
                )}
              </div>
              <span className={cn(
                "font-medium",
                item.isPurchased ? "text-muted-foreground line-through" : 
                affordable ? "text-foreground" : "text-destructive"
              )}>
                {formatCurrency(item.cost)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalScenarioComparison;
