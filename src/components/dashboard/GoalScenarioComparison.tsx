import { useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useGoalItems } from '@/hooks/useGoalItems';
import { formatCurrency, formatMonth } from '@/lib/formatters';
import { Target, Check, X, CreditCard, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalItemInfo {
  id: string;
  name: string;
  cost: number;
  goalName: string;
  paymentMethod: string;
  plannedMonth: string;
  debitMonth: string; // When the bank is actually affected
  affordable: boolean;
}

interface MonthProjection {
  month: string;
  balanceWithoutGoals: number;
  balanceWithGoals: number;
  goalItemsPlanned: GoalItemInfo[]; // Items planned for purchase this month
  goalDebitsThisMonth: GoalItemInfo[]; // Items whose bank debit happens this month
}

interface GoalScenarioComparisonProps {
  projectedBalance: number;
  recurringIncomes: { is_active: boolean; end_date: string | null; default_amount: number }[];
  recurringSavings: { is_active: boolean; end_date: string | null; action_type: string; default_amount: number }[];
  recurringPayments: { is_active: boolean; end_date: string | null; payment_method: string; default_amount: number }[];
}

// Helper to get next month string
const getNextMonth = (month: string): string => {
  const [year, monthNum] = month.split('-').map(Number);
  const nextDate = new Date(year, monthNum, 1);
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
};

const GoalScenarioComparison = ({
  projectedBalance,
  recurringIncomes,
  recurringSavings,
  recurringPayments,
}: GoalScenarioComparisonProps) => {
  const { currentMonth, bigPurchases, calculatedBudget } = useFinance();
  const { goalItems } = useGoalItems();

  // Get unpurchased goal items with debit month calculated
  const unpurchasedGoalItems = useMemo(() => {
    return goalItems
      .filter(item => !item.is_purchased)
      .map(item => {
        const goal = bigPurchases.find(g => g.id === item.goal_id);
        // CC purchases debit the bank in the NEXT month; bank transfers debit immediately
        const debitMonth = item.payment_method === 'credit_card'
          ? getNextMonth(item.planned_month)
          : item.planned_month;
        
        return {
          id: item.id,
          name: item.name,
          cost: Number(item.estimated_cost),
          goalName: goal?.name || 'Unknown Goal',
          paymentMethod: item.payment_method,
          plannedMonth: item.planned_month,
          debitMonth,
          affordable: false, // Will be calculated during projection
        };
      });
  }, [goalItems, bigPurchases]);

  // Find the furthest debit month to project until
  const furthestDebitMonth = useMemo(() => {
    if (unpurchasedGoalItems.length === 0) return null;
    
    const debitMonths = unpurchasedGoalItems
      .map(item => item.debitMonth)
      .filter(Boolean)
      .sort();
    
    return debitMonths[debitMonths.length - 1] || null;
  }, [unpurchasedGoalItems]);

  // Calculate monthly projection until furthest debit month
  const monthlyProjections = useMemo(() => {
    if (!furthestDebitMonth) return [];

    const projections: MonthProjection[] = [];
    const [startYear, startMonthNum] = currentMonth.split('-').map(Number);
    const [endYear, endMonthNum] = furthestDebitMonth.split('-').map(Number);
    
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
      
      // Find goal items PLANNED for this month (for display purposes)
      const goalItemsPlanned = unpurchasedGoalItems
        .filter(item => item.plannedMonth === monthStr)
        .map(item => ({ ...item }));
      
      // Find goal items whose DEBIT happens this month (for balance calculation)
      const goalDebitsThisMonth = unpurchasedGoalItems
        .filter(item => item.debitMonth === monthStr)
        .map(item => ({
          ...item,
          affordable: runningBalanceWithGoals >= item.cost,
        }));
      
      // Deduct goal debits from withGoals balance
      const totalGoalDebitsThisMonth = goalDebitsThisMonth.reduce((sum, item) => sum + item.cost, 0);
      runningBalanceWithGoals -= totalGoalDebitsThisMonth;
      
      projections.push({
        month: monthStr,
        balanceWithoutGoals: runningBalanceWithoutGoals,
        balanceWithGoals: runningBalanceWithGoals,
        goalItemsPlanned,
        goalDebitsThisMonth,
      });
    }
    
    return projections;
  }, [
    currentMonth,
    furthestDebitMonth,
    projectedBalance,
    calculatedBudget.leftBudget,
    recurringIncomes,
    recurringSavings,
    recurringPayments,
    unpurchasedGoalItems,
  ]);

  // Calculate totals for quick summary
  const totalGoalsCost = unpurchasedGoalItems.reduce((sum, item) => sum + item.cost, 0);
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
        <p className="text-xs font-medium text-muted-foreground">Projection Timeline (by bank debit)</p>
        {monthlyProjections.map((projection) => {
          const hasDebits = projection.goalDebitsThisMonth.length > 0;
          const allAffordable = projection.goalDebitsThisMonth.every(item => item.affordable);
          
          return (
            <div 
              key={projection.month} 
              className={cn(
                "p-2 rounded-lg text-xs",
                hasDebits ? (allAffordable ? "bg-success/10 border border-success/30" : "bg-warning/10 border border-warning/30") : "bg-muted/30"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{formatMonth(projection.month)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {formatCurrency(projection.balanceWithoutGoals)}
                  </span>
                  {hasDebits && (
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
              
              {/* Goal debits for this month */}
              {hasDebits && (
                <div className="mt-2 space-y-1 pl-2 border-l-2 border-primary/30">
                  {projection.goalDebitsThisMonth.map(item => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {item.affordable ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <X className="h-3 w-3 text-destructive" />
                        )}
                        {item.paymentMethod === 'credit_card' ? (
                          <CreditCard className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="truncate max-w-[100px]" title={item.name}>
                          {item.name}
                        </span>
                        {item.paymentMethod === 'credit_card' && (
                          <span className="text-[10px] text-muted-foreground">
                            (from {formatMonth(item.plannedMonth)})
                          </span>
                        )}
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
        CC items debit bank in the month after purchase
      </p>
    </div>
  );
};

export default GoalScenarioComparison;
