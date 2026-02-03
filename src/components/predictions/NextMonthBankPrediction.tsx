import { useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { TrendingUp, TrendingDown, Wallet, ArrowRight, PiggyBank, CreditCard, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';

const getNextMonth = (month: string): string => {
  const [year, monthNum] = month.split('-').map(Number);
  const nextDate = new Date(year, monthNum, 1); // monthNum is already 1-indexed, so this goes to next month
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
};

const NextMonthBankPrediction = () => {
  const { 
    currentMonth, 
    totalBankBalance, 
    getTotalBalanceForMonth,
    recurringIncomes, 
    recurringSavings, 
    recurringPayments 
  } = useFinance();

  const prediction = useMemo(() => {
    const nextMonth = getNextMonth(currentMonth);
    
    // Current month bank balance (from history or current)
    const currentBankBalance = getTotalBalanceForMonth(currentMonth) || totalBankBalance;
    
    // Active recurring incomes for next month
    const activeRecurringIncomes = recurringIncomes
      .filter(i => i.is_active)
      .filter(i => !i.end_date || i.end_date >= nextMonth);
    const nextMonthIncome = activeRecurringIncomes
      .reduce((sum, i) => sum + Number(i.default_amount), 0);
    
    // Active recurring savings for next month
    const activeRecurringSavings = recurringSavings
      .filter(s => s.is_active)
      .filter(s => !s.end_date || s.end_date >= nextMonth);
    
    // Deposits reduce bank balance, withdrawals increase it
    const nextMonthSavingsDeposits = activeRecurringSavings
      .filter(s => s.action_type === 'deposit')
      .reduce((sum, s) => sum + Number(s.default_amount), 0);
    const nextMonthSavingsWithdrawals = activeRecurringSavings
      .filter(s => s.action_type === 'withdrawal')
      .reduce((sum, s) => sum + Number(s.default_amount), 0);
    
    // Active recurring payments (credit card expenses) for next month
    const activeRecurringPayments = recurringPayments
      .filter(p => p.is_active)
      .filter(p => !p.end_date || p.end_date >= nextMonth)
      .filter(p => p.payment_method === 'credit_card'); // Only credit card = debit from bank
    const nextMonthCreditCardExpenses = activeRecurringPayments
      .reduce((sum, p) => sum + Number(p.default_amount), 0);
    
    // Prediction: current balance + income - savings deposits + savings withdrawals - credit card expenses
    const predictedBalance = currentBankBalance 
      + nextMonthIncome 
      - nextMonthSavingsDeposits 
      + nextMonthSavingsWithdrawals 
      - nextMonthCreditCardExpenses;
    
    const balanceChange = predictedBalance - currentBankBalance;
    
    return {
      nextMonth,
      currentBankBalance,
      nextMonthIncome,
      nextMonthSavingsDeposits,
      nextMonthSavingsWithdrawals,
      nextMonthCreditCardExpenses,
      predictedBalance,
      balanceChange,
      incomeCount: activeRecurringIncomes.length,
      savingsCount: activeRecurringSavings.length,
      expensesCount: activeRecurringPayments.length,
    };
  }, [currentMonth, totalBankBalance, getTotalBalanceForMonth, recurringIncomes, recurringSavings, recurringPayments]);

  const formatNextMonth = (month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    const date = new Date(year, monthNum - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Next Month Bank Prediction</h3>
        <span className="text-sm text-muted-foreground">{formatNextMonth(prediction.nextMonth)}</span>
      </div>

      {/* Main prediction */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 p-4 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
          <p className="text-xl font-bold">{formatCurrency(prediction.currentBankBalance)}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className={cn(
          "flex-1 p-4 rounded-lg",
          prediction.balanceChange >= 0 ? "bg-success/10" : "bg-destructive/10"
        )}>
          <p className="text-xs text-muted-foreground mb-1">Predicted Balance</p>
          <p className={cn(
            "text-xl font-bold",
            prediction.balanceChange >= 0 ? "text-success" : "text-destructive"
          )}>
            {formatCurrency(prediction.predictedBalance)}
          </p>
          <p className={cn(
            "text-xs",
            prediction.balanceChange >= 0 ? "text-success" : "text-destructive"
          )}>
            {prediction.balanceChange >= 0 ? '+' : ''}{formatCurrency(prediction.balanceChange)}
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-success" />
            <span className="text-sm">Recurring Income</span>
            <span className="text-xs text-muted-foreground">({prediction.incomeCount} sources)</span>
          </div>
          <span className="text-sm font-medium text-success">+{formatCurrency(prediction.nextMonthIncome)}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-primary" />
            <span className="text-sm">Savings Deposits</span>
          </div>
          <span className="text-sm font-medium text-primary">-{formatCurrency(prediction.nextMonthSavingsDeposits)}</span>
        </div>

        {prediction.nextMonthSavingsWithdrawals > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-warning" />
              <span className="text-sm">Savings Withdrawals</span>
            </div>
            <span className="text-sm font-medium text-warning">+{formatCurrency(prediction.nextMonthSavingsWithdrawals)}</span>
          </div>
        )}

        <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-destructive" />
            <span className="text-sm">Credit Card Expenses</span>
            <span className="text-xs text-muted-foreground">({prediction.expensesCount} recurring)</span>
          </div>
          <span className="text-sm font-medium text-destructive">-{formatCurrency(prediction.nextMonthCreditCardExpenses)}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Based on active recurring transactions only
      </p>
    </div>
  );
};

export default NextMonthBankPrediction;
