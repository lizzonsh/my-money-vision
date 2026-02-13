import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { convertToILS } from '@/lib/currencyUtils';
import { useNavigate } from 'react-router-dom';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg p-3 shadow-lg border border-border/50">
        <p className="text-sm font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Helper to get last N months
const getLastNMonths = (n: number): string[] => {
  const months: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
};

// Helper to format month for display
const formatMonth = (monthKey: string): string => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' });
};

export const IncomeExpenseChart = () => {
  const { incomes, expenses, setCurrentMonth } = useFinance();
  const navigate = useNavigate();

  const chartData = useMemo(() => {
    const last6Months = getLastNMonths(6);
    
    return last6Months.map(monthKey => {
      const monthIncome = incomes
        .filter(i => i.month === monthKey)
        .reduce((sum, i) => sum + Number(i.amount), 0);
      
      const monthExpenses = expenses
        .filter(e => e.month === monthKey)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        month: formatMonth(monthKey),
        monthKey,
        income: monthIncome,
        expenses: monthExpenses,
      };
    });
  }, [incomes, expenses]);

  const handleBarClick = (data: any, dataKey: 'income' | 'expenses') => {
    if (data?.monthKey) {
      setCurrentMonth(data.monthKey);
      navigate(dataKey === 'income' ? '/income' : '/expenses');
    }
  };

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <h3 className="font-semibold mb-4">Income vs Expenses</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={8}>
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
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="income" 
              fill="hsl(var(--success))" 
              radius={[4, 4, 0, 0]}
              name="Income"
              className="cursor-pointer"
              onClick={(data) => handleBarClick(data, 'income')}
            />
            <Bar 
              dataKey="expenses" 
              fill="hsl(var(--destructive))" 
              radius={[4, 4, 0, 0]}
              name="Expenses"
              className="cursor-pointer"
              onClick={(data) => handleBarClick(data, 'expenses')}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const SpendingByCategoryChart = () => {
  const { expenses, currentMonth } = useFinance();

  const chartData = useMemo(() => {
    const categoryTotals = expenses
      .filter(e => e.month === currentMonth)
      .reduce((acc, e) => {
        const category = e.category || 'other';
        acc[category] = (acc[category] || 0) + Number(e.amount);
        return acc;
      }, {} as Record<string, number>);

    const categoryColors: Record<string, string> = {
      room: 'hsl(var(--chart-1))',
      gifts: 'hsl(var(--chart-2))',
      psychologist: 'hsl(var(--chart-3))',
      college: 'hsl(var(--chart-4))',
      vacation: 'hsl(var(--chart-5))',
      debit_from_credit_card: 'hsl(var(--warning))',
      budget: 'hsl(var(--accent))',
      other: 'hsl(var(--muted))',
    };

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name: name.replace(/_/g, ' '),
        value,
        color: categoryColors[name] || 'hsl(var(--muted))',
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, currentMonth]);

  if (chartData.length === 0) {
    return (
      <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
        <h3 className="font-semibold mb-4">Spending by Category</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No expense data for this month
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <h3 className="font-semibold mb-4">Spending by Category</h3>
      <div className="h-64 flex items-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              layout="vertical" 
              align="right" 
              verticalAlign="middle"
              formatter={(value) => <span className="text-xs text-foreground capitalize">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const SavingsGrowthChart = () => {
  const { savings } = useFinance();

  const chartData = useMemo(() => {
    const last6Months = getLastNMonths(6);
    
    return last6Months.map(monthKey => {
      // Get latest savings per account for this month or earlier,
      // excluding accounts that were closed before this month
      const monthDate = new Date(monthKey + '-01');
      
      const latestPerAccount = savings
        .filter(s => s.month <= monthKey) // Only include entries up to this month
        .filter(s => {
          // Show if not closed, OR if closed after this month
          if (!s.closed_at) return true;
          const closedDate = new Date(s.closed_at);
          return closedDate > monthDate;
        })
        .reduce((acc, saving) => {
        const existing = acc.get(saving.name);
        if (!existing || new Date(saving.updated_at) > new Date(existing.updated_at)) {
          acc.set(saving.name, saving);
        }
        return acc;
      }, new Map<string, typeof savings[0]>());

      const total = Array.from(latestPerAccount.values())
        .reduce((sum, s) => sum + convertToILS(Number(s.amount), s.currency || 'ILS'), 0);

      return {
        month: formatMonth(monthKey),
        monthKey,
        total,
      };
    });
  }, [savings]);

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <h3 className="font-semibold mb-4">Savings Growth</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="total"
              name="Total Savings"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#savingsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
