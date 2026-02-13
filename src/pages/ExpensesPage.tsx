import ExpensesList from '@/components/expenses/ExpensesList';
import RecurringPaymentsPanel from '@/components/expenses/RecurringPaymentsPanel';
import BudgetProgress from '@/components/dashboard/BudgetProgress';
import MonthNavigation from '@/components/navigation/MonthNavigation';
import PlannedGoalsPanel from '@/components/expenses/PlannedGoalsPanel';
import { SpendingByCategoryChart } from '@/components/charts/FinanceCharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
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
            /* Mobile: simple stacked layout, no resizable panels */
            <div className="space-y-4">
              <BudgetProgress />
              <ExpensesList />
              <PlannedGoalsPanel />
              <SpendingByCategoryChart />
            </div>
          ) : (
            /* Desktop: resizable panels */
            <ResizablePanelGroup direction="horizontal" className="min-h-[700px] rounded-lg">
              <ResizablePanel defaultSize={60} minSize={30}>
                <div className="h-full p-1 overflow-auto">
                  <ExpensesList />
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={40} minSize={25}>
                <ResizablePanelGroup direction="vertical" className="h-full">
                  <ResizablePanel defaultSize={35} minSize={15}>
                    <div className="h-full p-1 overflow-auto">
                      <BudgetProgress />
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={30} minSize={15}>
                    <div className="h-full p-1 overflow-auto">
                      <PlannedGoalsPanel />
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={35} minSize={15}>
                    <div className="h-full p-1 overflow-auto">
                      <SpendingByCategoryChart />
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
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