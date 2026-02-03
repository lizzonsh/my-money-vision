import SavingsList from '@/components/savings/SavingsList';
import { SavingsGrowthChart } from '@/components/charts/FinanceCharts';

const SavingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Savings</h1>
        <p className="text-muted-foreground">Manage your savings accounts and growth</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SavingsList />
        <SavingsGrowthChart />
      </div>
    </div>
  );
};

export default SavingsPage;
