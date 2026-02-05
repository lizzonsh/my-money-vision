import SavingsCurrentStatus from '@/components/savings/SavingsCurrentStatus';
import SavingsMonthlyActivity from '@/components/savings/SavingsMonthlyActivity';
import RecurringSavingsPanel from '@/components/savings/RecurringSavingsPanel';
import MonthNavigation from '@/components/navigation/MonthNavigation';
import { SavingsGrowthChart } from '@/components/charts/FinanceCharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

const SavingsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Savings</h1>
          <p className="text-muted-foreground">Manage your savings accounts and growth</p>
        </div>
        <MonthNavigation />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Savings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ResizablePanelGroup direction="horizontal" className="min-h-[700px] rounded-lg">
            {/* Left side - vertically resizable */}
            <ResizablePanel defaultSize={60} minSize={30}>
              <ResizablePanelGroup direction="vertical" className="h-full">
                <ResizablePanel defaultSize={50} minSize={25}>
                  <div className="h-full p-1 overflow-auto">
                    <SavingsCurrentStatus />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={25}>
                  <div className="h-full p-1 overflow-auto">
                    <SavingsMonthlyActivity />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            {/* Right side - Growth Chart */}
            <ResizablePanel defaultSize={40} minSize={25}>
              <div className="h-full p-1 overflow-auto">
                <SavingsGrowthChart />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </TabsContent>

        <TabsContent value="recurring">
          <RecurringSavingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SavingsPage;