import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
// Finance Context - manages all financial data and operations
import { useBudgets, Budget } from '@/hooks/useBudgets';
import { useExpenses, Expense } from '@/hooks/useExpenses';
import { useIncomes, Income } from '@/hooks/useIncomes';
import { useSavings, Savings } from '@/hooks/useSavings';
import { useBigPurchases, BigPurchaseGoal } from '@/hooks/useBigPurchases';
import { useRecurringPayments, RecurringPayment } from '@/hooks/useRecurringPayments';
import { useRecurringSavings, RecurringSavings } from '@/hooks/useRecurringSavings';
import { useRecurringIncomes, RecurringIncome } from '@/hooks/useRecurringIncomes';
import { useBankAccounts, BankAccount } from '@/hooks/useBankAccounts';
import { useBankBalanceHistory, BankBalanceHistory, BankBalanceHistoryInsert } from '@/hooks/useBankBalanceHistory';
import { useGoalItems, GoalItem } from '@/hooks/useGoalItems';
import { isDateUpToToday, getCurrentMonth } from '@/lib/dateUtils';

interface FinanceContextType {
  // Data
  budgets: Budget[];
  expenses: Expense[];
  incomes: Income[];
  savings: Savings[];
  bigPurchases: BigPurchaseGoal[];
  recurringPayments: RecurringPayment[];
  recurringSavings: RecurringSavings[];
  recurringIncomes: RecurringIncome[];
  bankAccounts: BankAccount[];
  goalItems: GoalItem[];
  
  // Loading states
  isLoading: boolean;
  
  // Current month navigation
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  
  // Budget operations
  addBudget: (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateBudget: (data: { id: string } & Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  getBudgetForMonth: (month: string) => Budget | undefined;
  
  // Expense operations
  addExpense: (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateExpense: (data: { id: string } & Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  
  // Income operations
  addIncome: (income: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateIncome: (data: { id: string } & Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  
  // Savings operations
  addSavings: (saving: Omit<Savings, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateSavings: (data: { id: string } & Partial<Savings>) => void;
  deleteSavings: (id: string) => void;
  closeSavingsAccount: (name: string, fromMonth: string) => void;
  
  // Big purchase operations
  addBigPurchase: (goal: Omit<BigPurchaseGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateBigPurchase: (data: { id: string } & Partial<BigPurchaseGoal>) => void;
  deleteBigPurchase: (id: string) => void;
  
  // Recurring payment operations
  addRecurringPayment: (payment: Omit<RecurringPayment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateRecurringPayment: (data: { id: string } & Partial<RecurringPayment>) => void;
  deleteRecurringPayment: (id: string) => void;
  
  // Recurring savings operations
  addRecurringSavings: (saving: Omit<RecurringSavings, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateRecurringSavings: (data: { id: string } & Partial<RecurringSavings>) => void;
  deleteRecurringSavings: (id: string) => void;
  
  // Recurring income operations
  addRecurringIncome: (income: Omit<RecurringIncome, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateRecurringIncome: (data: { id: string } & Partial<RecurringIncome>) => void;
  deleteRecurringIncome: (id: string) => void;
  
  // Bank account operations
  addBankAccount: (account: Omit<BankAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateBankAccount: (data: { id: string } & Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;
  totalBankBalance: number;
  
  // Bank balance history operations
  bankBalanceHistory: BankBalanceHistory[];
  upsertBalanceHistory: (entry: BankBalanceHistoryInsert) => void;
  getBalanceForMonth: (bankAccountId: string, month: string) => BankBalanceHistory | undefined;
  getTotalBalanceForMonth: (month: string) => number;
  
  // Calculated budget values
  calculatedBudget: {
    spentBudget: number;
    leftBudget: number;
    dailyLimit: number;
    plannedCreditCardExpenses: number;
    plannedGoalCreditCardExpenses: number;
  };
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  
  // Use database hooks
  const budgetsHook = useBudgets();
  const expensesHook = useExpenses();
  const incomesHook = useIncomes();
  const savingsHook = useSavings();
  const bigPurchasesHook = useBigPurchases();
  const recurringPaymentsHook = useRecurringPayments();
  const recurringSavingsHook = useRecurringSavings();
  const recurringIncomesHook = useRecurringIncomes();
  const bankAccountsHook = useBankAccounts();
  const bankBalanceHistoryHook = useBankBalanceHistory();
  const goalItemsHook = useGoalItems();
  const isLoading = 
    budgetsHook.isLoading || 
    expensesHook.isLoading || 
    incomesHook.isLoading || 
    savingsHook.isLoading ||
    bigPurchasesHook.isLoading ||
    recurringPaymentsHook.isLoading ||
    recurringSavingsHook.isLoading ||
    recurringIncomesHook.isLoading ||
    bankAccountsHook.isLoading ||
    bankBalanceHistoryHook.isLoading ||
    goalItemsHook.isLoading;

  // Calculate budget values used by the Monthly Budget widget.
  // Spent = CC debits only (debit_from_credit_card category)
  // Remaining = Budget - Spent
  const calculatedBudget = useMemo(() => {
    const budget = budgetsHook.getBudgetForMonth(currentMonth);
    const totalBudget = budget ? Number(budget.total_budget) : 0;

    // Only include expenses from the current month AND up to today's date
    const monthExpenses = expensesHook.expenses.filter(e => 
      e.month === currentMonth && isDateUpToToday(e.expense_date)
    );
    
    // Credit card debits (debit_from_credit_card category) - this is "Spent"
    const creditCardDebits = monthExpenses
      .filter(e => e.category === 'debit_from_credit_card')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    // Planned expenses paid via credit card (not bank transfer, excluding debit_from_credit_card)
    const plannedCreditCardExpenses = expensesHook.expenses
      .filter(e => 
        e.month === currentMonth && 
        e.payment_method === 'credit_card' && 
        e.kind === 'planned' &&
        e.category !== 'debit_from_credit_card'
      )
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    // Planned goal items paid via credit card for current month
    const plannedGoalCreditCardExpenses = goalItemsHook.goalItems
      .filter(item => 
        !item.is_purchased && 
        item.planned_month === currentMonth &&
        item.payment_method === 'credit_card'
      )
      .reduce((sum, item) => sum + Number(item.estimated_cost), 0);
    
    // Spent = CC debits - planned CC expenses
    // If negative, it means not all planned payments were included in the debit yet
    const spentBudget = creditCardDebits - plannedCreditCardExpenses - plannedGoalCreditCardExpenses;

    // Remaining = Budget - Spent
    const leftBudget = totalBudget - spentBudget;
    
    const today = new Date();
    const [year, month] = currentMonth.split('-').map(Number);
    const daysInMonth = budget?.days_in_month || new Date(year, month, 0).getDate();
    const daysRemaining = Math.max(1, daysInMonth - today.getDate() + 1);
     const dailyLimit = leftBudget / daysRemaining;

    return { spentBudget, leftBudget, dailyLimit, plannedCreditCardExpenses, plannedGoalCreditCardExpenses };
  }, [budgetsHook.budgets, budgetsHook.getBudgetForMonth, expensesHook.expenses, goalItemsHook.goalItems, currentMonth]);

  return (
    <FinanceContext.Provider
      value={{
        // Data
        budgets: budgetsHook.budgets,
        expenses: expensesHook.expenses,
        incomes: incomesHook.incomes,
        savings: savingsHook.savings,
        bigPurchases: bigPurchasesHook.bigPurchases,
        recurringPayments: recurringPaymentsHook.recurringPayments,
        recurringSavings: recurringSavingsHook.recurringSavings,
        recurringIncomes: recurringIncomesHook.recurringIncomes,
        bankAccounts: bankAccountsHook.bankAccounts,
        goalItems: goalItemsHook.goalItems,
        
        // Loading
        isLoading,
        
        // Current month
        currentMonth,
        setCurrentMonth,
        
        // Budget operations
        addBudget: budgetsHook.addBudget,
        updateBudget: budgetsHook.updateBudget,
        deleteBudget: budgetsHook.deleteBudget,
        getBudgetForMonth: budgetsHook.getBudgetForMonth,
        
        // Expense operations
        addExpense: expensesHook.addExpense,
        updateExpense: expensesHook.updateExpense,
        deleteExpense: expensesHook.deleteExpense,
        
        // Income operations
        addIncome: incomesHook.addIncome,
        updateIncome: incomesHook.updateIncome,
        deleteIncome: incomesHook.deleteIncome,
        
        // Savings operations
        addSavings: savingsHook.addSavings,
        updateSavings: savingsHook.updateSavings,
        deleteSavings: savingsHook.deleteSavings,
        closeSavingsAccount: (name: string, fromMonth: string) => savingsHook.closeSavingsAccount({ name, fromMonth }),
        
        // Big purchase operations
        addBigPurchase: bigPurchasesHook.addBigPurchase,
        updateBigPurchase: bigPurchasesHook.updateBigPurchase,
        deleteBigPurchase: bigPurchasesHook.deleteBigPurchase,
        
        // Recurring payment operations
        addRecurringPayment: recurringPaymentsHook.addRecurringPayment,
        updateRecurringPayment: recurringPaymentsHook.updateRecurringPayment,
        deleteRecurringPayment: recurringPaymentsHook.deleteRecurringPayment,
        
        // Recurring savings operations
        addRecurringSavings: recurringSavingsHook.addRecurringSavings,
        updateRecurringSavings: recurringSavingsHook.updateRecurringSavings,
        deleteRecurringSavings: recurringSavingsHook.deleteRecurringSavings,
        
        // Recurring income operations
        addRecurringIncome: recurringIncomesHook.addRecurringIncome,
        updateRecurringIncome: recurringIncomesHook.updateRecurringIncome,
        deleteRecurringIncome: recurringIncomesHook.deleteRecurringIncome,
        
        // Bank account operations
        addBankAccount: bankAccountsHook.addBankAccount,
        updateBankAccount: bankAccountsHook.updateBankAccount,
        deleteBankAccount: bankAccountsHook.deleteBankAccount,
        totalBankBalance: bankAccountsHook.totalBalance,
        
        // Bank balance history
        bankBalanceHistory: bankBalanceHistoryHook.balanceHistory,
        upsertBalanceHistory: bankBalanceHistoryHook.upsertBalanceHistory,
        getBalanceForMonth: bankBalanceHistoryHook.getBalanceForMonth,
        getTotalBalanceForMonth: (month: string) => 
          bankBalanceHistoryHook.getTotalBalanceForMonth(
            bankAccountsHook.bankAccounts.map(a => a.id),
            month
          ),
        
        // Calculated values
        calculatedBudget,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

// Re-export types for convenience
export type { Budget } from '@/hooks/useBudgets';
export type { Expense } from '@/hooks/useExpenses';
export type { Income } from '@/hooks/useIncomes';
export type { Savings } from '@/hooks/useSavings';
export type { BigPurchaseGoal } from '@/hooks/useBigPurchases';
export type { RecurringPayment } from '@/hooks/useRecurringPayments';
export type { RecurringSavings } from '@/hooks/useRecurringSavings';
export type { RecurringIncome } from '@/hooks/useRecurringIncomes';
export type { BankAccount } from '@/hooks/useBankAccounts';
export type { BankBalanceHistory } from '@/hooks/useBankBalanceHistory';
