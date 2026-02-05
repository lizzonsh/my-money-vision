import ExpensesList from '@/components/expenses/ExpensesList';
import RecurringPaymentsPanel from '@/components/expenses/RecurringPaymentsPanel';
import BudgetProgress from '@/components/dashboard/BudgetProgress';
import MonthNavigation from '@/components/navigation/MonthNavigation';
import PlannedGoalsPanel from '@/components/expenses/PlannedGoalsPanel';
import { SpendingByCategoryChart } from '@/components/charts/FinanceCharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ExpensesPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track and manage your spending</p>
        </div>
        <MonthNavigation />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Main content - Expenses List */}
            <div className="lg:col-span-3">
              <ExpensesList />
            </div>
            
            {/* Side panels */}
            <div className="lg:col-span-2 space-y-6">
              <BudgetProgress />
              <PlannedGoalsPanel />
              <SpendingByCategoryChart />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recurring">
          <RecurringPaymentsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpensesPage;