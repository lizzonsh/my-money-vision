import { useState, useMemo } from 'react';
import { useFinance, Savings } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { convertToILS } from '@/lib/currencyUtils';
import { TrendingUp, TrendingDown, Minus, Eye, EyeOff, BarChart3, Target, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

/** Calculate the number of months between two YYYY-MM strings */
function monthsBetween(a: string, b: string): number {
  const [y1, m1] = a.split('-').map(Number);
  const [y2, m2] = b.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

function addMonths(month: string, offset: number): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year, monthNum - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Compute average monthly MARKET growth % per account from historical records.
 * Excludes deposits/withdrawals to isolate pure market/interest growth.
 * For gaps between recorded months, recurring monthly contributions are
 * included for each missing month and the resulting return is normalized
 * to a monthly rate across the gap.
 */
function computeAvgGrowthPerAccount(
  savings: Savings[],
  currentMonth: string,
  recurringMonthlyNetByName: Map<string, number>
) {
  const byName = new Map<string, Savings[]>();
  for (const s of savings) {
    if (s.month > currentMonth) continue;
    const list = byName.get(s.name) || [];
    list.push(s);
    byName.set(s.name, list);
  }

  const result = new Map<string, {
    avgGrowthPct: number;
    dataPoints: number;
    baselineMonth: string | null;
    monthlyRates: Array<{ month: string; pct: number; actual: number; prev: number; netDeposits: number; monthSpan: number }>;
  }>();

  for (const [name, records] of byName) {
    const latestPerMonth = new Map<string, Savings>();
    const explicitNetDepositsPerMonth = new Map<string, number>();
    const monthsWithExplicitActions = new Set<string>();

    for (const r of records) {
      const existing = latestPerMonth.get(r.month);
      if (!existing || new Date(r.updated_at) > new Date(existing.updated_at)) {
        latestPerMonth.set(r.month, r);
      }

      if (r.action) {
        monthsWithExplicitActions.add(r.month);
        const currentNet = explicitNetDepositsPerMonth.get(r.month) || 0;
        if (r.action === 'deposit') {
          explicitNetDepositsPerMonth.set(r.month, currentNet + Number(r.action_amount || 0));
        } else if (r.action === 'withdrawal') {
          explicitNetDepositsPerMonth.set(r.month, currentNet - Number(r.action_amount || 0));
        }
      }
    }

    const sortedMonths = Array.from(latestPerMonth.entries()).sort(([a], [b]) => a.localeCompare(b));

    if (sortedMonths.length === 0) {
      result.set(name, { avgGrowthPct: 0, dataPoints: 0, baselineMonth: null, monthlyRates: [] });
      continue;
    }

    if (sortedMonths.length === 1) {
      result.set(name, {
        avgGrowthPct: 0,
        dataPoints: 1,
        baselineMonth: sortedMonths[0][0],
        monthlyRates: [],
      });
      continue;
    }

    const rates: Array<{ month: string; pct: number; actual: number; prev: number; netDeposits: number; monthSpan: number }> = [];
    let weightedPctSum = 0;
    let weightedMonthCount = 0;

    for (let i = 1; i < sortedMonths.length; i++) {
      const prevMonth = sortedMonths[i - 1][0];
      const currMonth = sortedMonths[i][0];
      const prevAmt = Number(sortedMonths[i - 1][1].amount);
      const currAmt = Number(sortedMonths[i][1].amount);
      const gap = monthsBetween(prevMonth, currMonth);

      if (prevAmt <= 0 || gap <= 0) continue;

      let totalNetDep = 0;
      for (let step = 1; step <= gap; step++) {
        const month = addMonths(prevMonth, step);
        if (monthsWithExplicitActions.has(month)) {
          totalNetDep += explicitNetDepositsPerMonth.get(month) || 0;
        } else {
          totalNetDep += recurringMonthlyNetByName.get(name) || 0;
        }
      }

      const adjustedEnding = currAmt - totalNetDep;
      const monthlyPct = adjustedEnding > 0
        ? (Math.pow(adjustedEnding / prevAmt, 1 / gap) - 1) * 100
        : ((currAmt - prevAmt - totalNetDep) / prevAmt) * 100 / gap;

      rates.push({
        month: currMonth,
        pct: monthlyPct,
        actual: currAmt,
        prev: prevAmt,
        netDeposits: totalNetDep,
        monthSpan: gap,
      });

      weightedPctSum += monthlyPct * gap;
      weightedMonthCount += gap;
    }

    result.set(name, {
      avgGrowthPct: weightedMonthCount > 0 ? weightedPctSum / weightedMonthCount : 0,
      dataPoints: sortedMonths.length,
      baselineMonth: sortedMonths[0][0],
      monthlyRates: rates,
    });
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
  const { savings, currentMonth, recurringSavings } = useFinance();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [showActual, setShowActual] = useState(true);
  const [showMethodology, setShowMethodology] = useState(false);

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

  const recurringNetByAccount = useMemo(() => {
    const map = new Map<string, number>();
    for (const rs of recurringSavings) {
      if (!rs.is_active) continue;
      const current = map.get(rs.name) || 0;
      const amount = Number(rs.default_amount || 0);
      map.set(
        rs.name,
        current + (rs.action_type === 'deposit' ? amount : -amount)
      );
    }
    return map;
  }, [recurringSavings]);

  // Compute growth stats
  const growthStats = useMemo(
    () => computeAvgGrowthPerAccount(savings, currentMonth, recurringNetByAccount),
    [savings, currentMonth, recurringNetByAccount]
  );

  // Build predictions per account
  const predictions = useMemo(() => {
    const result = new Map<string, Array<{ month: string; predicted: number; actual: number | null }>>();

    for (const [name, saving] of latestPerName) {
      const stats = growthStats.get(name);
      const avgPct = stats?.avgGrowthPct || 0;
      const currentAmt = Number(saving.amount);
      const monthlyDeposit = recurringDepositPerAccount.get(name) || 0;

      const items: Array<{ month: string; predicted: number; actual: number | null }> = [];
      let runningAmt = currentAmt;

      for (const fm of futureMonths) {
        // Apply market growth first, then add recurring deposit
        runningAmt = runningAmt * (1 + avgPct / 100) + monthlyDeposit;

        // Check if actual data exists for this future month (latest record)
        const actualRecords = savings
          .filter(s => s.name === name && s.month === fm)
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        const actualAmt = actualRecords.length > 0 ? Number(actualRecords[0].amount) : null;

        items.push({ month: fm, predicted: runningAmt, actual: actualAmt });
      }

      result.set(name, items);
    }

    return result;
  }, [latestPerName, growthStats, futureMonths, savings, recurringDepositPerAccount]);

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
                  Based on {selectedStats?.dataPoints || 0} recorded months
                  {selectedStats?.baselineMonth ? ` starting from ${formatMonth(selectedStats.baselineMonth)}` : ''}
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
                      {r.monthSpan > 1 && (
                        <span className="text-muted-foreground/60 ml-1">({r.monthSpan}mo gap)</span>
                      )}
                      <span className={cn('ml-1.5 font-medium', r.pct >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {r.pct >= 0 ? '+' : ''}{r.pct.toFixed(2)}%/mo
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

      {/* Methodology Explanation */}
      <div className="glass rounded-xl p-5 shadow-card">
        <button
          onClick={() => setShowMethodology(!showMethodology)}
          className="flex items-center gap-2 w-full text-left"
        >
          <Info className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm">How Predictions Work</h4>
          {showMethodology ? <ChevronUp className="h-4 w-4 ml-auto text-muted-foreground" /> : <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />}
        </button>
        {showMethodology && (
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-1">1. Market Growth Rate (excluding deposits)</p>
              <p>For each account, we compare balances between consecutive months and <strong>subtract any deposits/withdrawals</strong> to isolate pure market/interest growth. This gives us the real return rate independent of money you added or removed.</p>
              <p className="mt-1 italic">Formula: market_growth% = (balance_now − balance_prev − net_deposits) / balance_prev × 100</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">2. Average Growth Rate</p>
              <p>We average all monthly market growth rates across the account's entire history to get a single average monthly growth percentage.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">3. Prediction Calculation</p>
              <p>Starting from the current balance, each future month is projected by:</p>
              <p className="mt-1 italic">predicted = previous_balance × (1 + avg_growth%) + expected_monthly_deposit</p>
              <p className="mt-1">Expected monthly deposits come from your active recurring savings templates.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">4. Actual vs Predicted</p>
              <p>When real data exists for a future month, we show it alongside the prediction so you can compare — this is especially useful for stock-dependent accounts where actual returns vary from the average.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavingsGrowthPredictions;
