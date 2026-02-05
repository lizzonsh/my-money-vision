import { useState } from 'react';
import { useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency, formatMonth } from '@/lib/formatters';
import { isDateUpToToday, isCurrentMonth } from '@/lib/dateUtils';
import { convertToILS } from '@/lib/currencyUtils';
import { Building2, Pencil, Plus, Trash2, History, Save, ArrowDownRight, ArrowUpRight, PiggyBank, CreditCard, TrendingUp, CalendarIcon, ArrowRight, Sparkles } from 'lucide-react';
import { Wallet } from 'lucide-react';
import GoalScenarioComparison from './GoalScenarioComparison';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const BankBalanceCard = () => {
  const { 
    bankAccounts, 
    totalBankBalance, 
    addBankAccount, 
    updateBankAccount, 
    deleteBankAccount,
    currentMonth,
    upsertBalanceHistory,
    getBalanceForMonth,
    getTotalBalanceForMonth,
    expenses,
    incomes,
    savings,
    recurringIncomes,
    recurringSavings,
    recurringPayments,
    bankAccounts: accounts,
    calculatedBudget,
    getBudgetForMonth,
  } = useFinance();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<{ id: string; name: string; balance: string; month: string } | null>(null);
  const [newAccount, setNewAccount] = useState({ name: '', balance: '', month: '' });

  // Generate month options (past 12 months + next 6 months)
  const getMonthOptions = () => {
    const options: string[] = [];
    const now = new Date();
    for (let i = -12; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      options.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
    return options;
  };
  const monthOptions = getMonthOptions();

  // Get total balance for the selected month from history, or fall back to current balance
  const monthlyTotal = getTotalBalanceForMonth(currentMonth);
  const displayTotal = monthlyTotal > 0 ? monthlyTotal : totalBankBalance;

  // Filter transactions for current month up to today
  const shouldFilterByDate = isCurrentMonth(currentMonth);
  
  // Calculate incomes received (bank transfers only affect bank balance)
  // Current month incomes already received
  const currentMonthIncomes = incomes
    .filter(i => i.month === currentMonth)
    .reduce((sum, i) => sum + Number(i.amount), 0);
  
  // Next month expected income from recurring incomes
  const [yearNum, monthNum] = currentMonth.split('-').map(Number);
  const nextMonthDate = new Date(yearNum, monthNum, 1);
  const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
  
  const expectedNextMonthIncome = recurringIncomes
    .filter(i => i.is_active)
    .filter(i => !i.end_date || i.end_date >= nextMonthStr)
    .reduce((sum, i) => sum + Number(i.default_amount), 0);

  // Credit card debit = expenses with category 'debit_from_credit_card' in current month
  // (User records this on the 3rd when the debit happens)
  const creditCardDebit = expenses
    .filter(e => 
      e.month === currentMonth && 
      e.category === 'debit_from_credit_card' &&
      (!shouldFilterByDate || isDateUpToToday(e.expense_date))
    )
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Current month's credit card expenses (planned + paid) that will become debit next month
  const currentMonthCCExpenses = expenses
    .filter(e => 
      e.month === currentMonth && 
      e.payment_method === 'credit_card' && 
      e.category !== 'debit_from_credit_card'
    )
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Bank transfer expenses from CURRENT month (immediate, excluding credit card debits)
  const currentMonthBankTransfers = expenses
    .filter(e => 
      e.month === currentMonth && 
      e.payment_method === 'bank_transfer' &&
      e.category !== 'debit_from_credit_card'
    )
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Total bank payments = credit card debits + bank transfers
  const monthlyExpensesPaid = creditCardDebit + currentMonthBankTransfers;

  // Calculate savings deposits and withdrawals (bank account transfers)
  // Get all savings entries for the current month
  const monthlySavings = savings.filter(s => 
    s.month === currentMonth
  );
  
  // Savings deposits - include entries with action='deposit' OR entries with action_amount but no action
  const savingsDeposits = monthlySavings
    .filter(s => s.action === 'deposit' || (!s.action && (s.action_amount || s.monthly_deposit)))
    .reduce(
      (sum, s) =>
        sum +
        convertToILS(
          Number(s.action_amount || s.monthly_deposit || 0),
          s.currency || 'ILS'
        ),
      0
    );
  
  const savingsWithdrawals = monthlySavings
    .filter(s => s.action === 'withdrawal')
    .reduce((sum, s) => sum + convertToILS(Number(s.action_amount || 0), s.currency || 'ILS'), 0);

  // Calculate projected balance using current month incomes
  const netChange = currentMonthIncomes - monthlyExpensesPaid - savingsDeposits + savingsWithdrawals;
  const projectedBalance = displayTotal + netChange;

  // Next month prediction based on recurring transactions
  const nextMonthPrediction = useMemo(() => {
    const [year, monthNum] = currentMonth.split('-').map(Number);
    const nextDate = new Date(year, monthNum, 1);
    const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Use projected balance as starting point (current balance after this month's transactions)
    const startingBalance = projectedBalance;
    
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
    
    const nextMonthSavingsDeposits = activeRecurringSavings
      .filter(s => s.action_type === 'deposit')
      .reduce((sum, s) => sum + Number(s.default_amount), 0);
    const nextMonthSavingsWithdrawals = activeRecurringSavings
      .filter(s => s.action_type === 'withdrawal')
      .reduce((sum, s) => sum + Number(s.default_amount), 0);
    
    // Active recurring payments (credit card = debit from bank)
    const activeRecurringPayments = recurringPayments
      .filter(p => p.is_active)
      .filter(p => !p.end_date || p.end_date >= nextMonth)
      .filter(p => p.payment_method === 'credit_card');
    const nextMonthCreditCardExpenses = activeRecurringPayments
      .reduce((sum, p) => sum + Number(p.default_amount), 0);
    
    // Include pending CC expenses from current month (becomes debit next month)
    const totalCreditCardDebit = nextMonthCreditCardExpenses + currentMonthCCExpenses;
    
    const predictedBalance = startingBalance 
      + nextMonthIncome 
      - nextMonthSavingsDeposits 
      + nextMonthSavingsWithdrawals 
      - totalCreditCardDebit;
    
    const balanceChange = predictedBalance - startingBalance;
    
    return {
      nextMonth,
      startingBalance,
      predictedBalance,
      balanceChange,
      nextMonthIncome,
      nextMonthSavingsDeposits,
      nextMonthSavingsWithdrawals,
      totalCreditCardDebit,
    };
  }, [currentMonth, projectedBalance, recurringIncomes, recurringSavings, recurringPayments, currentMonthCCExpenses]);

  // Final predicted balance after accounting for remaining budget to be spent
  const finalPredictedBalance = projectedBalance - calculatedBudget.leftBudget;
  const finalBalanceChange = finalPredictedBalance - displayTotal;

  const formatNextMonth = (month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    const date = new Date(year, monthNum - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Apply prediction to next month - distribute proportionally across accounts
  // Uses finalPredictedBalance (includes remaining budget subtraction) to match displayed value
  const handleApplyPredictionToNextMonth = () => {
    const { nextMonth } = nextMonthPrediction;
    const currentTotal = displayTotal || 1; // Avoid division by zero
    
    accounts.forEach(account => {
      const accountBalance = getAccountBalanceForMonth(account.id, account.current_balance);
      const proportion = accountBalance / currentTotal;
      const newBalance = finalPredictedBalance * proportion;
      
      upsertBalanceHistory({
        bank_account_id: account.id,
        month: nextMonth,
        balance: Math.round(newBalance * 100) / 100,
        notes: 'Predicted from recurring transactions',
      });
    });
  };

  // Check if next month already has history
  const nextMonthHasHistory = accounts.some(account => 
    getBalanceForMonth(account.id, nextMonthPrediction.nextMonth)
  );

  const getAccountBalanceForMonth = (accountId: string, currentBalance: number) => {
    const history = getBalanceForMonth(accountId, currentMonth);
    return history ? history.balance : currentBalance;
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(newAccount.balance) || 0;
    const targetMonth = newAccount.month || currentMonth;
    
    addBankAccount({
      name: newAccount.name,
      current_balance: balance,
      currency: 'ILS',
      last_updated: new Date().toISOString(),
    });
    
    // If a specific month was selected, we'll need to save balance history after account is created
    // For now, we rely on the current balance being set
    setNewAccount({ name: '', balance: '', month: '' });
    setIsAddOpen(false);
  };

  const handleUpdateBalance = (id: string, balance: string, targetMonth: string) => {
    const balanceNum = parseFloat(balance) || 0;
    
    // If updating for current month, also update the account's current balance
    if (targetMonth === currentMonth) {
      updateBankAccount({
        id,
        current_balance: balanceNum,
        last_updated: new Date().toISOString(),
      });
    }
    
    // Save to history for the selected month
    upsertBalanceHistory({
      bank_account_id: id,
      month: targetMonth,
      balance: balanceNum,
      notes: null,
    });
    
    setEditingAccount(null);
  };

  const handleSaveMonthlyBalance = (id: string, balance: number) => {
    upsertBalanceHistory({
      bank_account_id: id,
      month: currentMonth,
      balance,
      notes: null,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="glass rounded-lg px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Bank Balance</p>
            <p className="font-semibold">{formatCurrency(displayTotal)}</p>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[28rem] p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Bank Accounts</h4>
              <p className="text-xs text-muted-foreground">{formatMonth(currentMonth)}</p>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="glass">
                <DialogHeader>
                  <DialogTitle>Add Bank Account</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddAccount} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Account Name</Label>
                    <Input
                      id="name"
                      value={newAccount.name}
                      onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                      placeholder="e.g., Main Account"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="balance">Current Balance (₪)</Label>
                    <Input
                      id="balance"
                      type="number"
                      value={newAccount.balance}
                      onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">Add Account</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {bankAccounts.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              No bank accounts yet
            </p>
          ) : (
            <div className="divide-y">
              {bankAccounts.map((account) => {
                const monthBalance = getAccountBalanceForMonth(account.id, account.current_balance);
                const hasHistory = !!getBalanceForMonth(account.id, currentMonth);
                
                return (
                  <div key={account.id} className="p-3 group">
                    {editingAccount?.id === account.id ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">{account.name}</p>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editingAccount.balance}
                            onChange={(e) => setEditingAccount({ ...editingAccount, balance: e.target.value })}
                            className="h-8 flex-1"
                            placeholder="Balance"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateBalance(account.id, editingAccount.balance, editingAccount.month);
                              if (e.key === 'Escape') setEditingAccount(null);
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={editingAccount.month}
                            onValueChange={(value) => setEditingAccount({ ...editingAccount, month: value })}
                          >
                            <SelectTrigger className="h-8 flex-1">
                              <CalendarIcon className="h-3 w-3 mr-2" />
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                              {monthOptions.map((month) => (
                                <SelectItem key={month} value={month}>
                                  {formatMonth(month)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => handleUpdateBalance(account.id, editingAccount.balance, editingAccount.month)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm font-medium">{account.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(monthBalance)}
                              </p>
                              {hasHistory && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  <History className="h-2.5 w-2.5" />
                                  saved
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!hasHistory && (
                            <button
                              onClick={() => handleSaveMonthlyBalance(account.id, account.current_balance)}
                              className="p-1.5 hover:bg-primary/10 rounded"
                              title="Save balance for this month"
                            >
                              <Save className="h-3 w-3 text-primary" />
                            </button>
                          )}
                          <button
                            onClick={() => setEditingAccount({
                              id: account.id,
                              name: account.name,
                              balance: monthBalance.toString(),
                              month: currentMonth,
                            })}
                            className="p-1.5 hover:bg-secondary rounded"
                            title="Edit balance"
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => deleteBankAccount(account.id)}
                            className="p-1.5 hover:bg-destructive/10 rounded"
                            title="Delete account"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Monthly Activity Breakdown - Always visible */}
        <div className="border-t p-4 space-y-3 bg-muted/20">
          <h5 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Monthly Cash Flow
          </h5>
          
          {/* Starting Balance */}
          <div className="flex items-center justify-between text-sm py-1.5 border-b border-dashed">
            <span className="text-muted-foreground">Recorded Balance</span>
            <span className="font-medium">{formatCurrency(displayTotal)}</span>
          </div>
          
          {/* Incomes */}
          <div className="flex items-center justify-between text-sm py-1">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-success/20">
                <ArrowDownRight className="h-3 w-3 text-success" />
              </div>
              <div>
                <span>Expected Income</span>
                <p className="text-[10px] text-muted-foreground">next month recurring</p>
              </div>
            </div>
            <span className="text-success font-medium">+{formatCurrency(expectedNextMonthIncome)}</span>
          </div>
          
          {/* Credit Card Debit */}
          <div className="flex items-center justify-between text-sm py-1">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-destructive/20">
                <CreditCard className="h-3 w-3 text-destructive" />
              </div>
              <div>
                <span>CC Next Month Debit</span>
                <p className="text-[10px] text-muted-foreground">sum of debit from credit card</p>
              </div>
            </div>
            <span className="text-destructive font-medium">-{formatCurrency(creditCardDebit)}</span>
          </div>
          
          {/* Bank Transfers (current month) */}
          <div className="flex items-center justify-between text-sm py-1">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-destructive/20">
                <ArrowUpRight className="h-3 w-3 text-destructive" />
              </div>
              <div>
                <span>Bank Transfers</span>
                <p className="text-[10px] text-muted-foreground">current month</p>
              </div>
            </div>
            <span className="text-destructive font-medium">-{formatCurrency(currentMonthBankTransfers)}</span>
          </div>
          
          {/* Savings Deposits */}
          <div className="flex items-center justify-between text-sm py-1">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-primary/20">
                <PiggyBank className="h-3 w-3 text-primary" />
              </div>
              <div>
                <span>Savings Deposits</span>
                <p className="text-[10px] text-muted-foreground">current month</p>
              </div>
            </div>
            <span className="text-destructive font-medium">-{formatCurrency(savingsDeposits)}</span>
          </div>
          
          {/* Savings Withdrawals */}
          {savingsWithdrawals > 0 && (
            <div className="flex items-center justify-between text-sm py-1">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-success/20">
                  <PiggyBank className="h-3 w-3 text-success" />
                </div>
                <span>Savings Withdrawals</span>
              </div>
              <span className="text-success font-medium">+{formatCurrency(savingsWithdrawals)}</span>
            </div>
          )}
          
          {/* Budget Spent Section */}
          {getBudgetForMonth(currentMonth) && (
            <div className="flex items-center justify-between text-sm py-1 mt-2 pt-2 border-t border-dashed">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-warning/20">
                  <Wallet className="h-3 w-3 text-warning" />
                </div>
                <div>
                  <span>Budget Spent</span>
                  <p className="text-[10px] text-muted-foreground">
                    {formatCurrency(calculatedBudget.leftBudget)} remaining
                  </p>
                </div>
              </div>
              <span className="text-warning font-medium">
                {formatCurrency(Math.max(0, calculatedBudget.spentBudget - calculatedBudget.plannedCreditCardExpenses))} / {formatCurrency(getBudgetForMonth(currentMonth)?.total_budget || 0)}
              </span>
            </div>
          )}
          
          {/* Projected Balance */}
          <div className={cn(
            "flex items-center justify-between text-sm py-3 mt-2 rounded-lg px-3",
            netChange >= 0 ? "bg-success/10 border border-success/30" : "bg-destructive/10 border border-destructive/30"
          )}>
            <div>
              <span className="font-semibold">Projected Balance</span>
              <p className="text-[10px] text-muted-foreground">after all transactions</p>
            </div>
            <span className={cn(
              "text-lg font-bold",
              netChange >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(projectedBalance)}
            </span>
          </div>
          
          <p className="text-[10px] text-muted-foreground text-center">
            Based on transactions up to today
          </p>
        </div>

        {/* Next Month Prediction */}
        <div className="border-t p-4 space-y-3 bg-primary/5">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Next Month Prediction
            </h5>
            <span className="text-xs text-muted-foreground">{formatNextMonth(nextMonthPrediction.nextMonth)}</span>
          </div>
          
          {/* Prediction Flow */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex-1 p-2 rounded bg-muted/50 text-center">
              <p className="text-[10px] text-muted-foreground">Projected</p>
              <p className="font-medium">{formatCurrency(projectedBalance)}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className={cn(
              "flex-1 p-2 rounded text-center",
              finalBalanceChange >= 0 ? "bg-success/10" : "bg-destructive/10"
            )}>
              <p className="text-[10px] text-muted-foreground">After Budget</p>
              <p className={cn(
                "font-medium",
                finalBalanceChange >= 0 ? "text-success" : "text-destructive"
              )}>
                {formatCurrency(finalPredictedBalance)}
              </p>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Remaining budget: {formatCurrency(calculatedBudget.leftBudget)}
          </p>
          
          {/* Apply Button */}
          <Button
            size="sm"
            variant={nextMonthHasHistory ? "outline" : "default"}
            className="w-full"
            onClick={handleApplyPredictionToNextMonth}
          >
            <Save className="h-3 w-3 mr-2" />
            {nextMonthHasHistory ? 'Update Next Month Balance' : 'Save to Next Month'}
          </Button>
          
        </div>

        {/* Goal Scenarios */}
        <GoalScenarioComparison
          projectedBalance={projectedBalance}
          recurringIncomes={recurringIncomes}
          recurringSavings={recurringSavings}
          recurringPayments={recurringPayments}
        />
        
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total ({formatMonth(currentMonth)})</span>
            <span className="font-bold">{formatCurrency(displayTotal)}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default BankBalanceCard;
