import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SavingsCurrentStatus from '@/components/savings/SavingsCurrentStatus';
import SavingsPredictionPortfolio from '@/components/savings/SavingsPredictionPortfolio';
import SavingsMonthlyActivity from '@/components/savings/SavingsMonthlyActivity';
import RecurringSavingsPanel from '@/components/savings/RecurringSavingsPanel';
import MonthNavigation from '@/components/navigation/MonthNavigation';
import { SavingsGrowthChart } from '@/components/charts/FinanceCharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SavingsPage = () => {
  const location = useLocation();
  const navState = location.state as { tab?: string; highlightId?: string } | null;
  const [activeTab, setActiveTab] = useState(navState?.tab === 'activity' ? 'overview' : 'overview');

  // Reset highlight after navigating away
  useEffect(() => {
    if (navState?.highlightId) {
      // Clear navigation state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [navState]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Savings</h1>
          <p className="text-muted-foreground">Manage your savings accounts and growth</p>
        </div>
        <MonthNavigation />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Savings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Portfolio panels side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SavingsCurrentStatus />
            <SavingsPredictionPortfolio />
          </div>

          {/* Activity and Growth Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <SavingsMonthlyActivity highlightId={navState?.highlightId} />
            </div>
            <div className="lg:col-span-2">
              <SavingsGrowthChart />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recurring">
          <RecurringSavingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SavingsPage;
