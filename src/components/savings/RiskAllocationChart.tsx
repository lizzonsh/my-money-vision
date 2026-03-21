import { useMemo } from 'react';
import { useFinance, Savings } from '@/contexts/FinanceContext';
import { convertToILS } from '@/lib/currencyUtils';
import { formatCurrency } from '@/lib/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ShieldCheck, Shield, ShieldAlert } from 'lucide-react';

const RISK_META = {
  low: { label: 'Low Risk', color: 'hsl(152, 57%, 40%)', icon: ShieldCheck },
  medium: { label: 'Medium Risk', color: 'hsl(38, 80%, 50%)', icon: Shield },
  high: { label: 'High Risk', color: 'hsl(0, 72%, 51%)', icon: ShieldAlert },
} as const;

const RiskAllocationChart = () => {
  const { savings, currentMonth } = useFinance();
  const currentMonthDate = new Date(currentMonth + '-01');

  const uniqueSavings = useMemo(() => {
    return Array.from(
      savings
        .filter(s => s.month <= currentMonth)
        .filter(s => !s.closed_at || new Date(s.closed_at) > currentMonthDate)
        .reduce((acc, saving) => {
          const existing = acc.get(saving.name);
          if (!existing || new Date(saving.updated_at) > new Date(existing.updated_at)) {
            acc.set(saving.name, saving);
          }
          return acc;
        }, new Map<string, Savings>())
        .values()
    );
  }, [savings, currentMonth]);

  const data = useMemo(() => {
    const buckets: Record<string, number> = { low: 0, medium: 0, high: 0 };
    uniqueSavings.forEach(s => {
      const risk = (s as any).risk_level || 'medium';
      const key = ['low', 'medium', 'high'].includes(risk) ? risk : 'medium';
      buckets[key] += convertToILS(Number(s.amount), s.currency || 'ILS');
    });
    return Object.entries(buckets)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => ({
        name: RISK_META[key as keyof typeof RISK_META].label,
        value,
        color: RISK_META[key as keyof typeof RISK_META].color,
        key,
      }));
  }, [uniqueSavings]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="glass rounded-xl p-3 sm:p-5 shadow-card animate-slide-up flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">No savings data for risk allocation</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-3 sm:p-5 shadow-card animate-slide-up">
      <h3 className="font-semibold mb-4">Risk Allocation</h3>

      <div className="flex items-center gap-4">
        <div className="w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3 flex-1">
          {data.map((d) => {
            const meta = RISK_META[d.key as keyof typeof RISK_META];
            const Icon = meta.icon;
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
            return (
              <div key={d.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <Icon className="h-3.5 w-3.5" style={{ color: d.color }} />
                  <span className="text-sm">{meta.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold">{pct}%</span>
                  <span className="text-xs text-muted-foreground ml-2">{formatCurrency(d.value)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RiskAllocationChart;
