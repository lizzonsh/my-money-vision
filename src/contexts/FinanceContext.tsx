import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Budget, Expense, Income, Savings, BigPurchaseGoal, BankAccount } from '@/types/finance';
import {
  mockBudget,
  mockExpenses,
  mockIncomes,
  mockSavings,
  mockBigPurchases,
  mockBankAccount
} from '@/lib/mockData';

interface FinanceContextType {
  budget: Budget;
  expenses: Expense[];
  incomes: Income[];
  savings: Savings[];
  bigPurchases: BigPurchaseGoal[];
  bankAccount: BankAccount;
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  addExpense: (expense: Omit<Expense, '_id'>) => void;
  addIncome: (income: Omit<Income, '_id'>) => void;
  addSavings: (saving: Omit<Savings, '_id'>) => void;
  addBigPurchase: (goal: Omit<BigPurchaseGoal, '_id'>) => void;
  updateBudget: (budget: Budget) => void;
  deleteExpense: (id: string) => void;
  deleteIncome: (id: string) => void;
  deleteSavings: (id: string) => void;
  deleteBigPurchase: (id: string) => void;
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

  const updateBudget = (newBudget: Budget) => {
    setBudget(newBudget);
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

  return (
    <FinanceContext.Provider
      value={{
        budget,
        expenses,
        incomes,
        savings,
        bigPurchases,
        bankAccount,
        currentMonth,
        setCurrentMonth,
        addExpense,
        addIncome,
        addSavings,
        addBigPurchase,
        updateBudget,
        deleteExpense,
        deleteIncome,
        deleteSavings,
        deleteBigPurchase,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};
