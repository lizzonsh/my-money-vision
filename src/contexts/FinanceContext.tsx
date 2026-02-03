import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Budget, Expense, Income, Savings, BigPurchaseGoal, BankAccount, RecurringPayment, RecurringSavingsTemplate } from '@/types/finance';
import {
  mockBudget,
  mockExpenses,
  mockIncomes,
  mockSavings,
  mockBigPurchases,
  mockBankAccount,
  mockRecurringPayments,
  mockRecurringSavings
} from '@/lib/mockData';

interface FinanceContextType {
  budget: Budget;
  expenses: Expense[];
  incomes: Income[];
  savings: Savings[];
  bigPurchases: BigPurchaseGoal[];
  recurringPayments: RecurringPayment[];
  recurringSavings: RecurringSavingsTemplate[];
  bankAccount: BankAccount;
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  addExpense: (expense: Omit<Expense, '_id'>) => void;
  addIncome: (income: Omit<Income, '_id'>) => void;
  addSavings: (saving: Omit<Savings, '_id'>) => void;
  addBigPurchase: (goal: Omit<BigPurchaseGoal, '_id'>) => void;
  addRecurringPayment: (payment: Omit<RecurringPayment, '_id'>) => void;
  addRecurringSavings: (template: Omit<RecurringSavingsTemplate, '_id'>) => void;
  updateBudget: (budget: Budget) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  updateSavings: (id: string, saving: Partial<Savings>) => void;
  updateBigPurchase: (id: string, goal: Partial<BigPurchaseGoal>) => void;
  updateRecurringPayment: (id: string, payment: Partial<RecurringPayment>) => void;
  updateRecurringSavings: (id: string, template: Partial<RecurringSavingsTemplate>) => void;
  deleteExpense: (id: string) => void;
  deleteIncome: (id: string) => void;
  deleteSavings: (id: string) => void;
  deleteBigPurchase: (id: string) => void;
  deleteRecurringPayment: (id: string) => void;
  deleteRecurringSavings: (id: string) => void;
  createExpenseFromRecurring: (recurringId: string) => void;
  createSavingsFromRecurring: (recurringId: string) => void;
  // Calculated budget values based on Python logic
  calculatedBudget: {
    spentBudget: number;
    leftBudget: number;
    dailyLimit: number;
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
  const [budget, setBudget] = useState<Budget>(mockBudget);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [incomes, setIncomes] = useState<Income[]>(mockIncomes);
  const [savings, setSavings] = useState<Savings[]>(mockSavings);
  const [bigPurchases, setBigPurchases] = useState<BigPurchaseGoal[]>(mockBigPurchases);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>(mockRecurringPayments);
  const [recurringSavings, setRecurringSavings] = useState<RecurringSavingsTemplate[]>(mockRecurringSavings);
  const [bankAccount] = useState<BankAccount>(mockBankAccount);
  const [currentMonth, setCurrentMonth] = useState('2025-02');

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addExpense = (expense: Omit<Expense, '_id'>) => {
    setExpenses(prev => [...prev, { ...expense, _id: generateId() }]);
  };

  const addIncome = (income: Omit<Income, '_id'>) => {
    setIncomes(prev => [...prev, { ...income, _id: generateId() }]);
  };

  const addSavings = (saving: Omit<Savings, '_id'>) => {
    setSavings(prev => [...prev, { ...saving, _id: generateId() }]);
  };

  const addBigPurchase = (goal: Omit<BigPurchaseGoal, '_id'>) => {
    setBigPurchases(prev => [...prev, { ...goal, _id: generateId() }]);
  };

  const addRecurringPayment = (payment: Omit<RecurringPayment, '_id'>) => {
    setRecurringPayments(prev => [...prev, { ...payment, _id: generateId() }]);
  };

  const addRecurringSavings = (template: Omit<RecurringSavingsTemplate, '_id'>) => {
    setRecurringSavings(prev => [...prev, { ...template, _id: generateId() }]);
  };

  const updateBudget = (newBudget: Budget) => {
    setBudget(newBudget);
  };

  const updateExpense = (id: string, updatedFields: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => e._id === id ? { ...e, ...updatedFields } : e));
  };

  const updateIncome = (id: string, updatedFields: Partial<Income>) => {
    setIncomes(prev => prev.map(i => i._id === id ? { ...i, ...updatedFields } : i));
  };

  const updateSavings = (id: string, updatedFields: Partial<Savings>) => {
    setSavings(prev => prev.map(s => s._id === id ? { ...s, ...updatedFields } : s));
  };

  const updateBigPurchase = (id: string, updatedFields: Partial<BigPurchaseGoal>) => {
    setBigPurchases(prev => prev.map(b => b._id === id ? { ...b, ...updatedFields } : b));
  };

  const updateRecurringPayment = (id: string, updatedFields: Partial<RecurringPayment>) => {
    setRecurringPayments(prev => prev.map(r => r._id === id ? { ...r, ...updatedFields } : r));
  };

  const updateRecurringSavings = (id: string, updatedFields: Partial<RecurringSavingsTemplate>) => {
    setRecurringSavings(prev => prev.map(r => r._id === id ? { ...r, ...updatedFields } : r));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e._id !== id));
  };

  const deleteIncome = (id: string) => {
    setIncomes(prev => prev.filter(i => i._id !== id));
  };

  const deleteSavings = (id: string) => {
    setSavings(prev => prev.filter(s => s._id !== id));
  };

  const deleteBigPurchase = (id: string) => {
    setBigPurchases(prev => prev.filter(b => b._id !== id));
  };

  const deleteRecurringPayment = (id: string) => {
    setRecurringPayments(prev => prev.filter(r => r._id !== id));
  };

  const deleteRecurringSavings = (id: string) => {
    setRecurringSavings(prev => prev.filter(r => r._id !== id));
  };

  const createExpenseFromRecurring = (recurringId: string) => {
    const recurring = recurringPayments.find(r => r._id === recurringId);
    if (!recurring || !recurring.isActive) return;
    
    addExpense({
      expenseDate: new Date().toISOString().split('T')[0],
      month: currentMonth,
      amount: recurring.defaultAmount,
      category: recurring.category,
      kind: 'planned',
      paymentMethod: recurring.paymentMethod,
      cardId: recurring.cardId,
      description: recurring.name,
      recurring: { type: 'monthly', dayOfMonth: recurring.dayOfMonth },
    });
  };

  const createSavingsFromRecurring = (recurringId: string) => {
    const template = recurringSavings.find(r => r._id === recurringId);
    if (!template || !template.isActive) return;
    
    addSavings({
      month: currentMonth,
      name: template.name,
      amount: 0, // Will be updated when they edit
      currency: 'ILS',
      transferMethod: template.transferMethod,
      cardId: template.cardId,
      action: template.actionType,
      actionAmount: template.defaultAmount,
      updateDate: new Date().toISOString().split('T')[0],
      recurring: template.actionType === 'deposit' ? {
        type: 'monthly',
        dayOfMonth: template.dayOfMonth,
        monthlyDeposit: template.defaultAmount
      } : undefined,
    });
  };

  // Calculate budget based on Python logic:
  // spent_budget = credit_card_expenses - planned_paid_expenses
  // left_budget = total_budget - spent_budget
  // daily_limit = left_budget / days_remaining
  const calculatedBudget = (() => {
    const totalBudget = typeof budget.totalBudget === 'string' 
      ? parseFloat(budget.totalBudget) 
      : budget.totalBudget;

    const monthExpenses = expenses.filter(e => e.month === currentMonth);
    
    // Credit card total expenses (debit_from_credit_card category)
    const creditCardExpenses = monthExpenses
      .filter(e => e.category === 'debit_from_credit_card')
      .reduce((sum, e) => sum + e.amount, 0);
    
    // Planned expenses that were already paid (kind = 'payed' or 'planned')
    const plannedPaidExpenses = monthExpenses
      .filter(e => e.paymentMethod === 'credit_card' && (e.kind === 'payed' || e.kind === 'planned'))
      .reduce((sum, e) => sum + e.amount, 0);
    
    const spentBudget = creditCardExpenses - plannedPaidExpenses;
    const leftBudget = totalBudget - spentBudget;
    
    const today = new Date();
    const daysInMonth = budget.daysInMonth || new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(1, daysInMonth - today.getDate() + 1);
    const dailyLimit = leftBudget / daysRemaining;

    return { spentBudget, leftBudget, dailyLimit };
  })();

  return (
    <FinanceContext.Provider
      value={{
        budget,
        expenses,
        incomes,
        savings,
        bigPurchases,
        recurringPayments,
        recurringSavings,
        bankAccount,
        currentMonth,
        setCurrentMonth,
        addExpense,
        addIncome,
        addSavings,
        addBigPurchase,
        addRecurringPayment,
        addRecurringSavings,
        updateBudget,
        updateExpense,
        updateIncome,
        updateSavings,
        updateBigPurchase,
        updateRecurringPayment,
        updateRecurringSavings,
        deleteExpense,
        deleteIncome,
        deleteSavings,
        deleteBigPurchase,
        deleteRecurringPayment,
        deleteRecurringSavings,
        createExpenseFromRecurring,
        createSavingsFromRecurring,
        calculatedBudget,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};
