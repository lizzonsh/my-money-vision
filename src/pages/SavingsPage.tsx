import SavingsList from '@/components/savings/SavingsList';
import MonthNavigation from '@/components/navigation/MonthNavigation';
import { SavingsGrowthChart } from '@/components/charts/FinanceCharts';

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

      <div className="grid gap-6 lg:grid-cols-2">
        <SavingsList />
        <SavingsGrowthChart />
      </div>
    </div>
  );
};

export default SavingsPage;