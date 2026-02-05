import { useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useGoalItems } from '@/hooks/useGoalItems';
import { formatCurrency, formatMonth } from '@/lib/formatters';
import { Target, TrendingUp, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface MonthProjection {
  month: string;
  balanceWithoutGoals: number;
  balanceWithGoals: number;
  goalItemsInMonth: {
    id: string;
    name: string;
    cost: number;
    goalName: string;
    affordable: boolean;
  }[];
}

interface GoalScenarioComparisonProps {
  projectedBalance: number;
  recurringIncomes: { is_active: boolean; end_date: string | null; default_amount: number }[];
  recurringSavings: { is_active: boolean; end_date: string | null; action_type: string; default_amount: number }[];
  recurringPayments: { is_active: boolean; end_date: string | null; payment_method: string; default_amount: number }[];
}

const GoalScenarioComparison = ({
  projectedBalance,
  recurringIncomes,
  recurringSavings,
  recurringPayments,
}: GoalScenarioComparisonProps) => {
  const { currentMonth, bigPurchases, calculatedBudget } = useFinance();
  const { goalItems } = useGoalItems();

  // Get unpurchased goal items
  const unpurchasedGoalItems = goalItems.filter(item => !item.is_purchased);

  // Find the furthest goal target month to project until
  const furthestGoalMonth = useMemo(() => {
    if (unpurchasedGoalItems.length === 0) return null;
    
    const goalMonths = unpurchasedGoalItems
      .map(item => item.planned_month)
      .filter(Boolean)
      .sort();
    
    return goalMonths[goalMonths.length - 1] || null;
  }, [unpurchasedGoalItems]);

  // Calculate monthly projection until furthest goal date
  const monthlyProjections = useMemo(() => {
    if (!furthestGoalMonth) return [];

    const projections: MonthProjection[] = [];
    const [startYear, startMonthNum] = currentMonth.split('-').map(Number);
    const [endYear, endMonthNum] = furthestGoalMonth.split('-').map(Number);
    
    // Calculate number of months to project
    const monthsDiff = (endYear - startYear) * 12 + (endMonthNum - startMonthNum);
    const monthsToProject = Math.min(Math.max(monthsDiff, 1), 24); // Cap at 24 months
    
    let runningBalanceWithoutGoals = projectedBalance - calculatedBudget.leftBudget;
    let runningBalanceWithGoals = projectedBalance - calculatedBudget.leftBudget;
    
    for (let i = 1; i <= monthsToProject; i++) {
      const projectionDate = new Date(startYear, startMonthNum - 1 + i, 1);
      const monthStr = `${projectionDate.getFullYear()}-${String(projectionDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Calculate recurring changes for this month
      const monthlyIncome = recurringIncomes
        .filter(inc => inc.is_active && (!inc.end_date || inc.end_date >= monthStr))
        .reduce((sum, inc) => sum + Number(inc.default_amount), 0);
      
      const monthlyDeposits = recurringSavings
        .filter(s => s.is_active && s.action_type === 'deposit' && (!s.end_date || s.end_date >= monthStr))
        .reduce((sum, s) => sum + Number(s.default_amount), 0);
      
      const monthlyWithdrawals = recurringSavings
        .filter(s => s.is_active && s.action_type === 'withdrawal' && (!s.end_date || s.end_date >= monthStr))
        .reduce((sum, s) => sum + Number(s.default_amount), 0);
      
      const monthlyCCPayments = recurringPayments
        .filter(p => p.is_active && p.payment_method === 'credit_card' && (!p.end_date || p.end_date >= monthStr))
        .reduce((sum, p) => sum + Number(p.default_amount), 0);
      
      const netMonthlyChange = monthlyIncome - monthlyDeposits + monthlyWithdrawals - monthlyCCPayments;
      
      // Update running balances
      runningBalanceWithoutGoals += netMonthlyChange;
      runningBalanceWithGoals += netMonthlyChange;
      
      // Find goal items planned for this month
      const goalItemsInMonth = unpurchasedGoalItems
        .filter(item => item.planned_month === monthStr)
        .map(item => {
          const goal = bigPurchases.find(g => g.id === item.goal_id);
          const itemCost = Number(item.estimated_cost);
          const affordable = runningBalanceWithGoals >= itemCost;
          
          return {
            id: item.id,
            name: item.name,
            cost: itemCost,
            goalName: goal?.name || 'Unknown Goal',
            affordable,
          };
        });
      
      // Deduct goal items from withGoals balance (if they would be purchased)
      const totalGoalCostThisMonth = goalItemsInMonth.reduce((sum, item) => sum + item.cost, 0);
      runningBalanceWithGoals -= totalGoalCostThisMonth;
      
      projections.push({
        month: monthStr,
        balanceWithoutGoals: runningBalanceWithoutGoals,
        balanceWithGoals: runningBalanceWithGoals,
        goalItemsInMonth,
      });
    }
    
    return projections;
  }, [
    currentMonth,
    furthestGoalMonth,
    projectedBalance,
    calculatedBudget.leftBudget,
    recurringIncomes,
    recurringSavings,
    recurringPayments,
    unpurchasedGoalItems,
    bigPurchases,
  ]);

  // Calculate totals for quick summary
  const totalGoalsCost = unpurchasedGoalItems.reduce((sum, item) => sum + Number(item.estimated_cost), 0);
  const nextMonthWithoutGoals = monthlyProjections[0]?.balanceWithoutGoals || projectedBalance;
  const nextMonthWithGoals = monthlyProjections[0]?.balanceWithGoals || projectedBalance;

  if (unpurchasedGoalItems.length === 0) {
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
          {unpurchasedGoalItems.length} planned items
        </span>
      </div>

      {/* Summary Comparison */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Without Goals</p>
          <p className="font-semibold text-success">{formatCurrency(nextMonthWithoutGoals)}</p>
        </div>
        <div className="p-3 rounded-lg bg-primary/10 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">With All Goals</p>
          <p className={cn(
            "font-semibold",
            nextMonthWithGoals >= 0 ? "text-primary" : "text-destructive"
          )}>
            {formatCurrency(nextMonthWithGoals)}
          </p>
        </div>
      </div>

      <div className="text-xs text-center text-muted-foreground">
        Total planned: {formatCurrency(totalGoalsCost)}
      </div>

      {/* Timeline Projection */}
      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
        <p className="text-xs font-medium text-muted-foreground">Projection Timeline</p>
        {monthlyProjections.map((projection, index) => {
          const hasGoals = projection.goalItemsInMonth.length > 0;
          const allAffordable = projection.goalItemsInMonth.every(item => item.affordable);
          
          return (
            <div 
              key={projection.month} 
              className={cn(
                "p-2 rounded-lg text-xs",
                hasGoals ? (allAffordable ? "bg-success/10 border border-success/30" : "bg-warning/10 border border-warning/30") : "bg-muted/30"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{formatMonth(projection.month)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {formatCurrency(projection.balanceWithoutGoals)}
                  </span>
                  {hasGoals && (
                    <>
                      <span className="text-muted-foreground">→</span>
                      <span className={cn(
                        "font-medium",
                        projection.balanceWithGoals >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {formatCurrency(projection.balanceWithGoals)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Goal items for this month */}
              {hasGoals && (
                <div className="mt-2 space-y-1 pl-2 border-l-2 border-primary/30">
                  {projection.goalItemsInMonth.map(item => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {item.affordable ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <X className="h-3 w-3 text-destructive" />
                        )}
                        <span className="truncate max-w-[120px]" title={item.name}>
                          {item.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({item.goalName})
                        </span>
                      </div>
                      <span className={cn(
                        "font-medium",
                        item.affordable ? "text-foreground" : "text-destructive"
                      )}>
                        {formatCurrency(item.cost)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        ✓ = affordable at that month's projected balance
      </p>
    </div>
  );
};

export default GoalScenarioComparison;
