import ExpensesList from '@/components/expenses/ExpensesList';
import BudgetProgress from '@/components/dashboard/BudgetProgress';
import { SpendingByCategoryChart } from '@/components/charts/FinanceCharts';

const ExpensesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Expenses</h1>
        <p className="text-muted-foreground">Track and manage your spending</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExpensesList />
        </div>
        <div className="space-y-6">
          <BudgetProgress />
          <SpendingByCategoryChart />
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;
