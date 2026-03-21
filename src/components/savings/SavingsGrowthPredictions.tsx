import { useState, useMemo } from 'react';
import { useFinance, Savings } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { convertToILS } from '@/lib/currencyUtils';
import { TrendingUp, TrendingDown, Minus, Eye, EyeOff, BarChart3, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

/** Compute average monthly growth % per account from historical records */
function computeAvgGrowthPerAccount(savings: Savings[], currentMonth: string) {
  // Group records by account name, sorted chronologically
  const byName = new Map<string, Savings[]>();
  for (const s of savings) {
    if (s.month > currentMonth) continue;
    const list = byName.get(s.name) || [];
    list.push(s);
    byName.set(s.name, list);
  }

  const result = new Map<string, { avgGrowthPct: number; dataPoints: number; monthlyRates: Array<{ month: string; pct: number; actual: number; prev: number }> }>();

  for (const [name, records] of byName) {
    // Get latest record per month
    const latestPerMonth = new Map<string, Savings>();
    for (const r of records) {
      const existing = latestPerMonth.get(r.month);
      if (!existing || new Date(r.updated_at) > new Date(existing.updated_at)) {
        latestPerMonth.set(r.month, r);
      }
    }

    const sortedMonths = Array.from(latestPerMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b));

    if (sortedMonths.length < 2) {
      result.set(name, { avgGrowthPct: 0, dataPoints: 0, monthlyRates: [] });
      continue;
    }

    const rates: Array<{ month: string; pct: number; actual: number; prev: number }> = [];
    for (let i = 1; i < sortedMonths.length; i++) {
      const prevAmt = Number(sortedMonths[i - 1][1].amount);
      const currAmt = Number(sortedMonths[i][1].amount);
      if (prevAmt > 0) {
        const pct = ((currAmt - prevAmt) / prevAmt) * 100;
        rates.push({ month: sortedMonths[i][0], pct, actual: currAmt, prev: prevAmt });
      }
    }

    const avgPct = rates.length > 0 ? rates.reduce((s, r) => s + r.pct, 0) / rates.length : 0;
    result.set(name, { avgGrowthPct: avgPct, dataPoints: rates.length, monthlyRates: rates });
  }

  return result;
}

function getNextMonths(currentMonth: string, count: number): string[] {
  const [year, month] = currentMonth.split('-').map(Number);
  const months: string[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(year, month - 1 + i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

const SavingsGrowthPredictions = () => {
  const { savings, currentMonth } = useFinance();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [showActual, setShowActual] = useState(true);

  const currentMonthDate = new Date(currentMonth + '-01');

  // Get latest balance per account
  const latestPerName = useMemo(() => {
    return savings
      .filter(s => s.month <= currentMonth)
      .filter(s => !s.closed_at || new Date(s.closed_at) > currentMonthDate)
      .reduce((acc, s) => {
        const ex = acc.get(s.name);
        if (!ex || s.month > ex.month || (s.month === ex.month && new Date(s.updated_at) > new Date(ex.updated_at))) {
          acc.set(s.name, s);
        }
        return acc;
      }, new Map<string, Savings>());
  }, [savings, currentMonth]);

  const accounts = Array.from(latestPerName.values());

  // Compute growth stats
  const growthStats = useMemo(() => computeAvgGrowthPerAccount(savings, currentMonth), [savings, currentMonth]);

  // Future months
  const futureMonths = useMemo(() => getNextMonths(currentMonth, 6), [currentMonth]);

  // Build predictions per account
  const predictions = useMemo(() => {
    const result = new Map<string, Array<{ month: string; predicted: number; actual: number | null }>>();

    for (const [name, saving] of latestPerName) {
      const stats = growthStats.get(name);
      const avgPct = stats?.avgGrowthPct || 0;
      const currentAmt = Number(saving.amount);
      const currency = saving.currency || 'ILS';

      const items: Array<{ month: string; predicted: number; actual: number | null }> = [];
      let runningAmt = currentAmt;

      for (const fm of futureMonths) {
        runningAmt = runningAmt * (1 + avgPct / 100);

        // Check if actual data exists for this future month
        const actualRecords = savings
          .filter(s => s.name === name && s.month === fm)
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        const actualAmt = actualRecords.length > 0 ? Number(actualRecords[0].amount) : null;

        items.push({ month: fm, predicted: runningAmt, actual: actualAmt });
      }

      result.set(name, items);
    }

    return result;
  }, [latestPerName, growthStats, futureMonths, savings]);

  // Portfolio-level prediction (sum in ILS)
  const portfolioPrediction = useMemo(() => {
    return futureMonths.map(fm => {
      let totalPredicted = 0;
      let totalActual: number | null = 0;
      let hasAnyActual = false;

      for (const [name, items] of predictions) {
        const saving = latestPerName.get(name)!;
        const currency = saving.currency || 'ILS';
        const item = items.find(i => i.month === fm);
        if (item) {
          totalPredicted += convertToILS(item.predicted, currency);
          if (item.actual !== null) {
            hasAnyActual = true;
            totalActual! += convertToILS(item.actual, currency);
          }
        }
      }

      return { month: fm, predicted: totalPredicted, actual: hasAnyActual ? totalActual : null };
    });
  }, [predictions, futureMonths, latestPerName]);

  const currentTotalILS = Array.from(latestPerName.values())
    .reduce((sum, s) => sum + convertToILS(Number(s.amount), s.currency || 'ILS'), 0);

  const selected = selectedAccount || '__portfolio__';
  const isPortfolio = selected === '__portfolio__';

  const chartData = useMemo(() => {
    const baseMonth = { month: currentMonth, predicted: 0, actual: 0 };

    if (isPortfolio) {
      baseMonth.predicted = currentTotalILS;
      baseMonth.actual = currentTotalILS;
      return [baseMonth, ...portfolioPrediction.map(p => ({
        month: p.month,
        predicted: Math.round(p.predicted),
        actual: p.actual !== null ? Math.round(p.actual) : undefined,
      }))];
    }

    const saving = latestPerName.get(selected);
    const items = predictions.get(selected);
    if (!saving || !items) return [];

    baseMonth.predicted = Number(saving.amount);
    baseMonth.actual = Number(saving.amount);
    return [baseMonth, ...items.map(i => ({
      month: i.month,
      predicted: Math.round(i.predicted),
      actual: i.actual !== null ? Math.round(i.actual) : undefined,
    }))];
  }, [isPortfolio, selected, currentTotalILS, portfolioPrediction, latestPerName, predictions, currentMonth]);

  const selectedStats = !isPortfolio ? growthStats.get(selected) : null;
  const selectedCurrency = !isPortfolio ? (latestPerName.get(selected)?.currency || 'ILS') : 'ILS';

  return (
    <div className="space-y-6">
      {/* Account Selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedAccount(null)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            isPortfolio ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 hover:bg-secondary'
          )}
        >
          Total Portfolio
        </button>
        {accounts.map(a => (
          <button
            key={a.name}
            onClick={() => setSelectedAccount(a.name)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              selected === a.name ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 hover:bg-secondary'
            )}
          >
            {a.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="space-y-4">
          {/* Avg Growth */}
          <div className="glass rounded-xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Avg Monthly Growth</h4>
            </div>
            {isPortfolio ? (
              <div className="space-y-2">
                {accounts.map(a => {
                  const stats = growthStats.get(a.name);
                  const pct = stats?.avgGrowthPct || 0;
                  const isUp = pct > 0;
                  return (
                    <div key={a.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate mr-2">{a.name}</span>
                      <span className={cn('font-medium', isUp ? 'text-emerald-600' : pct < 0 ? 'text-red-600' : 'text-muted-foreground')}>
                        {isUp ? '+' : ''}{pct.toFixed(2)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <p className={cn('text-2xl font-bold', (selectedStats?.avgGrowthPct || 0) >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                  {(selectedStats?.avgGrowthPct || 0) >= 0 ? '+' : ''}{(selectedStats?.avgGrowthPct || 0).toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {selectedStats?.dataPoints || 0} months of data
                </p>
              </div>
            )}
          </div>

          {/* 6-Month Predicted End */}
          <div className="glass rounded-xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">6-Month Projection</h4>
            </div>
            {(() => {
              const lastPrediction = isPortfolio
                ? portfolioPrediction[portfolioPrediction.length - 1]
                : predictions.get(selected)?.[5];
              const currentAmt = isPortfolio ? currentTotalILS : Number(latestPerName.get(selected)?.amount || 0);
              const predictedAmt = lastPrediction?.predicted || currentAmt;
              const diff = predictedAmt - currentAmt;
              const diffPct = currentAmt > 0 ? (diff / currentAmt) * 100 : 0;

              return (
                <div>
                  <p className="text-xl font-bold">{formatCurrency(predictedAmt, selectedCurrency)}</p>
                  <p className={cn('text-sm mt-1', diff >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {diff >= 0 ? '+' : ''}{formatCurrency(diff, selectedCurrency)} ({diff >= 0 ? '+' : ''}{diffPct.toFixed(1)}%)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    from {formatCurrency(currentAmt, selectedCurrency)}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 glass rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Growth Forecast</h4>
            <button
              onClick={() => setShowActual(!showActual)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showActual ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {showActual ? 'Hide' : 'Show'} Actual
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" tickFormatter={formatMonth} className="text-xs" />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value, selectedCurrency),
                  name === 'predicted' ? 'Predicted' : 'Actual',
                ]}
                labelFormatter={formatMonth}
              />
              <Legend formatter={(value) => value === 'predicted' ? 'Predicted' : 'Actual'} />
              <ReferenceLine x={currentMonth} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label="Now" />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.15)"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              {showActual && (
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2) / 0.15)"
                  strokeWidth={2}
                  connectNulls={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-Month Comparison Table */}
      {!isPortfolio && (
        <div className="glass rounded-xl p-5 shadow-card">
          <h4 className="font-semibold mb-4">Predicted vs Actual Comparison</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Month</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Predicted</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Actual</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Difference</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {predictions.get(selected)?.map(item => {
                  const diff = item.actual !== null ? item.actual - item.predicted : null;
                  const accuracy = item.actual !== null && item.predicted > 0
                    ? 100 - Math.abs((item.actual - item.predicted) / item.predicted * 100)
                    : null;

                  return (
                    <tr key={item.month} className="border-b border-border/50 hover:bg-secondary/20">
                      <td className="py-2.5 px-3">{formatMonth(item.month)}</td>
                      <td className="text-right py-2.5 px-3 font-medium">
                        {formatCurrency(item.predicted, selectedCurrency)}
                      </td>
                      <td className="text-right py-2.5 px-3">
                        {item.actual !== null ? formatCurrency(item.actual, selectedCurrency) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="text-right py-2.5 px-3">
                        {diff !== null ? (
                          <span className={cn(diff >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                            {diff >= 0 ? '+' : ''}{formatCurrency(diff, selectedCurrency)}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="text-center py-2.5 px-3">
                        {accuracy !== null ? (
                          <Badge variant="outline" className={cn(
                            'text-xs',
                            accuracy >= 95 ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                            accuracy >= 85 ? 'text-amber-600 border-amber-200 bg-amber-50' :
                            'text-red-600 border-red-200 bg-red-50'
                          )}>
                            {accuracy.toFixed(1)}%
                          </Badge>
                        ) : <span className="text-muted-foreground text-xs">Pending</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Historical accuracy from past predictions */}
          {(() => {
            const stats = growthStats.get(selected);
            if (!stats || stats.monthlyRates.length < 2) return null;

            return (
              <div className="mt-5 pt-4 border-t">
                <h5 className="font-medium text-sm mb-3">Historical Monthly Growth Rates</h5>
                <div className="flex flex-wrap gap-2">
                  {stats.monthlyRates.map((r, i) => (
                    <div key={i} className="px-3 py-1.5 rounded-lg bg-secondary/30 text-xs">
                      <span className="text-muted-foreground">{formatMonth(r.month)}</span>
                      <span className={cn('ml-1.5 font-medium', r.pct >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {r.pct >= 0 ? '+' : ''}{r.pct.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Portfolio comparison table */}
      {isPortfolio && (
        <div className="glass rounded-xl p-5 shadow-card">
          <h4 className="font-semibold mb-4">Portfolio Forecast</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Month</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Predicted Total</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Actual Total</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Difference</th>
                </tr>
              </thead>
              <tbody>
                {portfolioPrediction.map(item => {
                  const diff = item.actual !== null ? item.actual - item.predicted : null;
                  return (
                    <tr key={item.month} className="border-b border-border/50 hover:bg-secondary/20">
                      <td className="py-2.5 px-3">{formatMonth(item.month)}</td>
                      <td className="text-right py-2.5 px-3 font-medium">{formatCurrency(item.predicted)}</td>
                      <td className="text-right py-2.5 px-3">
                        {item.actual !== null ? formatCurrency(item.actual) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="text-right py-2.5 px-3">
                        {diff !== null ? (
                          <span className={cn(diff >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                            {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsGrowthPredictions;
