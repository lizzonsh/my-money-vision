import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency, formatMonth } from '@/lib/formatters';
import { isDateUpToToday, isCurrentMonth } from '@/lib/dateUtils';
import { Building2, Pencil, Plus, Trash2, History, Save, ArrowDownRight, ArrowUpRight, PiggyBank, CreditCard, TrendingUp } from 'lucide-react';
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
  } = useFinance();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<{ id: string; name: string; balance: string } | null>(null);
  const [newAccount, setNewAccount] = useState({ name: '', balance: '' });

  // Get total balance for the selected month from history, or fall back to current balance
  const monthlyTotal = getTotalBalanceForMonth(currentMonth);
  const displayTotal = monthlyTotal > 0 ? monthlyTotal : totalBankBalance;

  // Filter transactions for current month up to today
  const shouldFilterByDate = isCurrentMonth(currentMonth);
  
  // Calculate incomes received (bank transfers only affect bank balance)
  const monthlyIncomes = incomes
    .filter(i => i.month === currentMonth && (!shouldFilterByDate || isDateUpToToday(i.income_date || '')))
    .reduce((sum, i) => sum + Number(i.amount), 0);

  // Calculate previous month for credit card debit (debited on 3rd of current month)
  const [year, month] = currentMonth.split('-').map(Number);
  const prevMonth = month === 1 
    ? `${year - 1}-12` 
    : `${year}-${String(month - 1).padStart(2, '0')}`;

  // Credit card expenses from LAST month (debited on 3rd of current month)
  const lastMonthCreditCardExpenses = expenses
    .filter(e => 
      e.month === prevMonth && 
      e.kind === 'payed' && 
      e.payment_method === 'credit_card'
    )
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Bank transfer expenses from CURRENT month (immediate)
  const currentMonthBankTransfers = expenses
    .filter(e => 
      e.month === currentMonth && 
      e.kind === 'payed' && 
      e.payment_method === 'bank_transfer' &&
      (!shouldFilterByDate || isDateUpToToday(e.expense_date))
    )
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Total bank payments = last month's credit cards + current month's bank transfers
  const monthlyExpensesPaid = lastMonthCreditCardExpenses + currentMonthBankTransfers;

  // Calculate savings deposits and withdrawals (bank account transfers)
  const monthlySavings = savings.filter(s => 
    s.month === currentMonth && 
    s.transfer_method === 'bank_account' &&
    (!shouldFilterByDate || isDateUpToToday(s.updated_at))
  );
  
  const savingsDeposits = monthlySavings
    .filter(s => s.action === 'deposit' || (!s.action && s.action_amount))
    .reduce((sum, s) => sum + Number(s.action_amount || s.monthly_deposit || 0), 0);
  
  const savingsWithdrawals = monthlySavings
    .filter(s => s.action === 'withdrawal')
    .reduce((sum, s) => sum + Number(s.action_amount || 0), 0);

  // Calculate projected balance
  const netChange = monthlyIncomes - monthlyExpensesPaid - savingsDeposits + savingsWithdrawals;
  const projectedBalance = displayTotal + netChange;

  const getAccountBalanceForMonth = (accountId: string, currentBalance: number) => {
    const history = getBalanceForMonth(accountId, currentMonth);
    return history ? history.balance : currentBalance;
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(newAccount.balance) || 0;
    addBankAccount({
      name: newAccount.name,
      current_balance: balance,
      currency: 'ILS',
      last_updated: new Date().toISOString(),
    });
    setNewAccount({ name: '', balance: '' });
    setIsAddOpen(false);
  };

  const handleUpdateBalance = (id: string, balance: string) => {
    const balanceNum = parseFloat(balance) || 0;
    
    // Update current balance
    updateBankAccount({
      id,
      current_balance: balanceNum,
      last_updated: new Date().toISOString(),
    });
    
    // Also save to history for this month
    upsertBalanceHistory({
      bank_account_id: id,
      month: currentMonth,
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
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">{account.name}</p>
                          <Input
                            type="number"
                            value={editingAccount.balance}
                            onChange={(e) => setEditingAccount({ ...editingAccount, balance: e.target.value })}
                            className="h-8"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateBalance(account.id, editingAccount.balance);
                              if (e.key === 'Escape') setEditingAccount(null);
                            }}
                          />
                        </div>
                        <Button
                          size="sm"
                          className="h-8"
                          onClick={() => handleUpdateBalance(account.id, editingAccount.balance)}
                        >
                          Save
                        </Button>
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
              <span>Incomes Received</span>
            </div>
            <span className="text-success font-medium">+{formatCurrency(monthlyIncomes)}</span>
          </div>
          
          {/* Credit Card Debit (last month) */}
          <div className="flex items-center justify-between text-sm py-1">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-destructive/20">
                <CreditCard className="h-3 w-3 text-destructive" />
              </div>
              <div>
                <span>Credit Card Debit</span>
                <p className="text-[10px] text-muted-foreground">from previous month</p>
              </div>
            </div>
            <span className="text-destructive font-medium">-{formatCurrency(lastMonthCreditCardExpenses)}</span>
          </div>
          
          {/* Bank Transfers (current month) */}
          <div className="flex items-center justify-between text-sm py-1">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-destructive/20">
                <ArrowUpRight className="h-3 w-3 text-destructive" />
              </div>
              <span>Bank Transfers</span>
            </div>
            <span className="text-destructive font-medium">-{formatCurrency(currentMonthBankTransfers)}</span>
          </div>
          
          {/* Savings Deposits */}
          <div className="flex items-center justify-between text-sm py-1">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-primary/20">
                <PiggyBank className="h-3 w-3 text-primary" />
              </div>
              <span>Savings Deposits</span>
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
