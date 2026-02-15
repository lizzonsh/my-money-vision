import ExpensesList from '@/components/expenses/ExpensesList';
import RecurringPaymentsPanel from '@/components/expenses/RecurringPaymentsPanel';
import BudgetProgress from '@/components/dashboard/BudgetProgress';
import MonthNavigation from '@/components/navigation/MonthNavigation';
import PlannedGoalsPanel from '@/components/expenses/PlannedGoalsPanel';
import { SpendingByCategoryChart } from '@/components/charts/FinanceCharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';

const ExpensesPage = () => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">Expenses</h1>
          <p className="text-xs sm:text-base text-muted-foreground">Track and manage your spending</p>
        </div>
        <MonthNavigation />
      </div>

      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {isMobile ? (
            <div className="space-y-4">
              <BudgetProgress />
              <ExpensesList />
              <PlannedGoalsPanel />
              <SpendingByCategoryChart />
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_400px] gap-4 min-h-[700px]">
              <ExpensesList />
              <div className="space-y-4">
                <BudgetProgress />
                <PlannedGoalsPanel />
                <SpendingByCategoryChart />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recurring">
          <RecurringPaymentsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpensesPage;