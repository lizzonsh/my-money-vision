import IncomesList from '@/components/income/IncomesList';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { mockMonthlyData } from '@/lib/mockData';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const IncomePage = () => {
  const { incomes, currentMonth } = useFinance();
  
  const monthlyIncome = incomes
    .filter((i) => i.month === currentMonth)
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Income</h1>
        <p className="text-muted-foreground">Track your earnings and revenue</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <IncomesList />
        
        <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
          <h3 className="font-semibold mb-4">Income Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockMonthlyData}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Income']}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  fill="url(#incomeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomePage;
