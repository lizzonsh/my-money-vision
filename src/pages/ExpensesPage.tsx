import ExpensesList from '@/components/expenses/ExpensesList';
import { SpendingByCategoryChart } from '@/components/charts/FinanceCharts';

const ExpensesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Expenses</h1>
        <p className="text-muted-foreground">Track and manage your spending</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ExpensesList />
        <SpendingByCategoryChart />
      </div>
    </div>
  );
};

export default ExpensesPage;
