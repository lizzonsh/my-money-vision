import { useState, useMemo } from 'react';
import { useFinance, Savings } from '@/contexts/FinanceContext';
import { useSavingsPlanEvents, SavingsPlanEventInsert, SavingsPlanEvent } from '@/hooks/useSavingsPlanEvents';
import { formatCurrency } from '@/lib/formatters';
import { convertToILS } from '@/lib/currencyUtils';
import { SUPPORTED_CURRENCIES } from '@/lib/currencyUtils';
import { cn } from '@/lib/utils';
import { Plus, Trash2, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, FolderOpen, FolderX, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

// ---- helpers ----
function addMonths(month: string, offset: number): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year, monthNum - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function monthsBetween(a: string, b: string): number {
  const [y1, m1] = a.split('-').map(Number);
  const [y2, m2] = b.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

function getMonthRange(start: string, count: number): string[] {
  const months: string[] = [start];
  for (let i = 1; i <= count; i++) months.push(addMonths(start, i));
  return months;
}

const EVENT_ICONS = {
  transfer: ArrowRightLeft,
  deposit: ArrowDownToLine,
  withdrawal: ArrowUpFromLine,
  open_account: FolderOpen,
  close_account: FolderX,
};

const EVENT_LABELS = {
  transfer: 'Transfer',
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  open_account: 'Open Account',
  close_account: 'Close Account',
};

const EVENT_COLORS = {
  transfer: 'text-primary',
  deposit: 'text-success',
  withdrawal: 'text-destructive',
  open_account: 'text-primary',
  close_account: 'text-muted-foreground',
};

// ---- compute growth ----
function computeAvgGrowthPerAccount(
  savings: Savings[],
  currentMonth: string,
  recurringNetByName: Map<string, number>
) {
  const byName = new Map<string, Savings[]>();
  for (const s of savings) {
    if (s.month > currentMonth) continue;
    const list = byName.get(s.name) || [];
    list.push(s);
    byName.set(s.name, list);
  }

  const result = new Map<string, number>();

  for (const [name, records] of byName) {
    const latestPerMonth = new Map<string, Savings>();
    const explicitNet = new Map<string, number>();
    const explicitMonths = new Set<string>();

    for (const r of records) {
      const ex = latestPerMonth.get(r.month);
      if (!ex || new Date(r.updated_at) > new Date(ex.updated_at)) latestPerMonth.set(r.month, r);
      if (r.action) {
        explicitMonths.add(r.month);
        const cur = explicitNet.get(r.month) || 0;
        explicitNet.set(r.month, cur + (r.action === 'deposit' ? Number(r.action_amount || 0) : -Number(r.action_amount || 0)));
      }
    }

    const sorted = Array.from(latestPerMonth.entries()).sort(([a], [b]) => a.localeCompare(b));
    if (sorted.length <= 1) { result.set(name, 0); continue; }

    let wSum = 0, wCount = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prev = Number(sorted[i - 1][1].amount);
      const curr = Number(sorted[i][1].amount);
      const gap = monthsBetween(sorted[i - 1][0], sorted[i][0]);
      if (prev <= 0 || gap <= 0) continue;

      let totalNet = 0;
      for (let s = 1; s <= gap; s++) {
        const m = addMonths(sorted[i - 1][0], s);
        totalNet += explicitMonths.has(m) ? (explicitNet.get(m) || 0) : (recurringNetByName.get(name) || 0);
      }

      const adj = curr - totalNet;
      const pct = adj > 0 ? (Math.pow(adj / prev, 1 / gap) - 1) * 100 : ((curr - prev - totalNet) / prev) * 100 / gap;
      wSum += pct * gap;
      wCount += gap;
    }

    result.set(name, wCount > 0 ? wSum / wCount : 0);
  }

  return result;
}

// ---- main component ----
const SavingsPlanner = () => {
  const { savings, recurringSavings, currentMonth } = useFinance();
  const { planEvents, addEvent, deleteEvent } = useSavingsPlanEvents();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [eventType, setEventType] = useState<SavingsPlanEvent['event_type']>('transfer');
  const [targetMonth, setTargetMonth] = useState(addMonths(currentMonth, 3));
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ILS');
  const [description, setDescription] = useState('');

  const currentMonthDate = new Date(currentMonth + '-01');

  // Get current balances
  const latestPerName = useMemo(() => {
    return savings
      .filter(s => s.month <= currentMonth)
      .filter(s => !s.closed_at || new Date(s.closed_at) > currentMonthDate)
      .reduce((acc, s) => {
        const ex = acc.get(s.name);
        if (!ex || s.month > ex.month || (s.month === ex.month && new Date(s.updated_at) > new Date(ex.updated_at)))
          acc.set(s.name, s);
        return acc;
      }, new Map<string, Savings>());
  }, [savings, currentMonth]);

  const accountNames = Array.from(latestPerName.keys());

  // Recurring net per account
  const recurringNetByAccount = useMemo(() => {
    const map = new Map<string, number>();
    for (const rs of recurringSavings) {
      if (!rs.is_active) continue;
      const cur = map.get(rs.name) || 0;
      map.set(rs.name, cur + (rs.action_type === 'deposit' ? Number(rs.default_amount) : -Number(rs.default_amount)));
    }
    return map;
  }, [recurringSavings]);

  // Growth rates
  const growthRates = useMemo(
    () => computeAvgGrowthPerAccount(savings, currentMonth, recurringNetByAccount),
    [savings, currentMonth, recurringNetByAccount]
  );

  // Recurring deposit-only per account
  const recurringDepositPerAccount = useMemo(() => {
    const map = new Map<string, number>();
    for (const rs of recurringSavings) {
      if (!rs.is_active || rs.action_type !== 'deposit') continue;
      map.set(rs.name, (map.get(rs.name) || 0) + Number(rs.default_amount));
    }
    return map;
  }, [recurringSavings]);

  // Build timeline: 12 months forward
  const timelineMonths = useMemo(() => getMonthRange(currentMonth, 12), [currentMonth]);

  // Build baseline projection (no events) + with-events projection
  const { baselineData, scenarioData } = useMemo(() => {
    const baseline: Array<Record<string, any>> = [];
    const scenario: Array<Record<string, any>> = [];

    // Running balances per account
    const baseBalances = new Map<string, number>();
    const scenBalances = new Map<string, number>();
    const scenCurrencies = new Map<string, string>();

    for (const [name, s] of latestPerName) {
      baseBalances.set(name, Number(s.amount));
      scenBalances.set(name, Number(s.amount));
      scenCurrencies.set(name, s.currency || 'ILS');
    }

    for (const month of timelineMonths) {
      const isFirst = month === currentMonth;

      if (!isFirst) {
        // Apply growth + recurring deposits to both baseline and scenario
        for (const name of baseBalances.keys()) {
          const growth = growthRates.get(name) || 0;
          const deposit = recurringDepositPerAccount.get(name) || 0;

          const baseVal = baseBalances.get(name)!;
          baseBalances.set(name, baseVal * (1 + growth / 100) + deposit);

          const scenVal = scenBalances.get(name)!;
          scenBalances.set(name, scenVal * (1 + growth / 100) + deposit);
        }

        // Apply plan events for this month to scenario only
        const monthEvents = planEvents.filter(e => e.target_month === month);
        for (const evt of monthEvents) {
          const amt = Number(evt.amount);
          if (evt.event_type === 'transfer') {
            if (evt.from_account && scenBalances.has(evt.from_account)) {
              scenBalances.set(evt.from_account, scenBalances.get(evt.from_account)! - amt);
            }
            if (evt.to_account && scenBalances.has(evt.to_account)) {
              scenBalances.set(evt.to_account, scenBalances.get(evt.to_account)! + amt);
            } else if (evt.to_account && !scenBalances.has(evt.to_account)) {
              // New account created by transfer
              scenBalances.set(evt.to_account, amt);
              scenCurrencies.set(evt.to_account, evt.currency || 'ILS');
            }
          } else if (evt.event_type === 'deposit') {
            const target = evt.to_account;
            if (target && scenBalances.has(target)) {
              scenBalances.set(target, scenBalances.get(target)! + amt);
            }
          } else if (evt.event_type === 'withdrawal') {
            const source = evt.from_account;
            if (source && scenBalances.has(source)) {
              scenBalances.set(source, scenBalances.get(source)! - amt);
            }
          } else if (evt.event_type === 'open_account') {
            const name = evt.to_account || evt.description || 'New Account';
            if (!scenBalances.has(name)) {
              scenBalances.set(name, amt);
              scenCurrencies.set(name, evt.currency || 'ILS');
            }
          } else if (evt.event_type === 'close_account') {
            const name = evt.from_account;
            if (name) scenBalances.delete(name);
          }
        }
      }

      // Sum totals in ILS
      let baseTotal = 0;
      for (const [name, bal] of baseBalances) {
        const cur = latestPerName.get(name)?.currency || 'ILS';
        baseTotal += convertToILS(bal, cur);
      }

      let scenTotal = 0;
      for (const [name, bal] of scenBalances) {
        const cur = scenCurrencies.get(name) || latestPerName.get(name)?.currency || 'ILS';
        scenTotal += convertToILS(bal, cur);
      }

      const baseRow: Record<string, any> = { month, total: Math.round(baseTotal) };
      const scenRow: Record<string, any> = { month, total: Math.round(scenTotal) };

      // Per-account values for scenario
      for (const [name, bal] of scenBalances) {
        scenRow[name] = Math.round(bal);
      }

      baseline.push(baseRow);
      scenario.push(scenRow);
    }

    return { baselineData: baseline, scenarioData: scenario };
  }, [timelineMonths, latestPerName, growthRates, recurringDepositPerAccount, planEvents]);

  // Events by month for markers
  const eventsByMonth = useMemo(() => {
    const map = new Map<string, SavingsPlanEvent[]>();
    for (const e of planEvents) {
      const list = map.get(e.target_month) || [];
      list.push(e);
      map.set(e.target_month, list);
    }
    return map;
  }, [planEvents]);

  // Month options for the select
  const monthOptions = useMemo(() => {
    const opts: string[] = [];
    for (let i = 1; i <= 12; i++) opts.push(addMonths(currentMonth, i));
    return opts;
  }, [currentMonth]);

  const resetForm = () => {
    setEventType('transfer');
    setTargetMonth(addMonths(currentMonth, 3));
    setFromAccount('');
    setToAccount('');
    setNewAccountName('');
    setAmount('');
    setCurrency('ILS');
    setDescription('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEvent({
      event_type: eventType,
      target_month: targetMonth,
      from_account: ['withdrawal', 'transfer', 'close_account'].includes(eventType) ? fromAccount || null : null,
      to_account: eventType === 'open_account' ? newAccountName || null
        : ['deposit', 'transfer'].includes(eventType) ? toAccount || null : null,
      amount: parseFloat(amount) || 0,
      currency,
      description: description || null,
    });
    resetForm();
    setDialogOpen(false);
  };

  // Combined chart data
  const chartData = useMemo(() => {
    return timelineMonths.map((month, i) => ({
      month,
      baseline: baselineData[i]?.total || 0,
      scenario: scenarioData[i]?.total || 0,
      hasEvent: eventsByMonth.has(month),
    }));
  }, [timelineMonths, baselineData, scenarioData, eventsByMonth]);

  // Scenario end diff
  const endBaseline = chartData[chartData.length - 1]?.baseline || 0;
  const endScenario = chartData[chartData.length - 1]?.scenario || 0;
  const endDiff = endScenario - endBaseline;

  // Custom dot for events
  const EventDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload?.hasEvent) return null;
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={3} fill="hsl(var(--background))" />
      </g>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base sm:text-lg">Savings Timeline Planner</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Plan future moves and see how they affect your portfolio</p>
        </div>
        <Button size="sm" className="gap-1 text-xs" onClick={() => setDialogOpen(true)}>
          <CalendarPlus className="h-3.5 w-3.5" />
          Add Event
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="glass rounded-xl p-3 sm:p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Current Portfolio</p>
          <p className="text-base sm:text-lg font-bold mt-1">{formatCurrency(chartData[0]?.baseline || 0)}</p>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Baseline (12mo)</p>
          <p className="text-base sm:text-lg font-bold mt-1">{formatCurrency(endBaseline)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Without events</p>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 shadow-card">
          <p className="text-xs text-muted-foreground">With Planned Events</p>
          <p className="text-base sm:text-lg font-bold mt-1">{formatCurrency(endScenario)}</p>
          {endDiff !== 0 && (
            <p className={cn("text-xs mt-0.5", endDiff > 0 ? "text-success" : "text-destructive")}>
              {endDiff > 0 ? '+' : ''}{formatCurrency(endDiff)} difference
            </p>
          )}
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="glass rounded-xl p-3 sm:p-5 shadow-card">
        <h4 className="font-semibold text-sm mb-3">Portfolio Timeline</h4>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="month" tickFormatter={formatMonth} className="text-xs" />
            <YAxis tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}k`} className="text-xs" />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'baseline' ? 'Baseline' : 'With Events',
              ]}
              labelFormatter={(label) => {
                const events = eventsByMonth.get(label as string);
                const monthLabel = formatMonth(label as string);
                if (!events) return monthLabel;
                return `${monthLabel} — ${events.length} event${events.length > 1 ? 's' : ''}`;
              }}
            />
            <Legend formatter={(v) => v === 'baseline' ? 'Baseline' : 'With Planned Events'} />
            <ReferenceLine x={currentMonth} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label="Now" />
            {/* Event month markers */}
            {Array.from(eventsByMonth.keys()).map(month => (
              <ReferenceLine key={month} x={month} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeOpacity={0.5} />
            ))}
            <Line
              type="monotone"
              dataKey="baseline"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="scenario"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={<EventDot />}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-account impact at event months */}
      {planEvents.length > 0 && (
        <div className="glass rounded-xl p-3 sm:p-5 shadow-card">
          <h4 className="font-semibold text-sm mb-3">Planned Events</h4>
          <div className="space-y-2">
            {planEvents.map(evt => {
              const Icon = EVENT_ICONS[evt.event_type];
              return (
                <div key={evt.id} className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-secondary/30 group hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className={cn("p-1.5 rounded-lg bg-secondary", EVENT_COLORS[evt.event_type])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{formatMonth(evt.target_month)}</Badge>
                        <span className="text-xs sm:text-sm font-medium">{EVENT_LABELS[evt.event_type]}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {evt.event_type === 'transfer' && `${evt.from_account} → ${evt.to_account}`}
                        {evt.event_type === 'deposit' && `→ ${evt.to_account}`}
                        {evt.event_type === 'withdrawal' && `${evt.from_account} →`}
                        {evt.event_type === 'open_account' && `New: ${evt.to_account}`}
                        {evt.event_type === 'close_account' && `Close: ${evt.from_account}`}
                        {evt.description && ` • ${evt.description}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {evt.amount > 0 && (
                      <span className="text-sm font-semibold">{formatCurrency(evt.amount, evt.currency)}</span>
                    )}
                    <button
                      onClick={() => deleteEvent(evt.id)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Account balances snapshot at end */}
      {planEvents.length > 0 && scenarioData.length > 0 && (
        <div className="glass rounded-xl p-3 sm:p-5 shadow-card">
          <h4 className="font-semibold text-sm mb-3">Portfolio Snapshot at {formatMonth(timelineMonths[timelineMonths.length - 1])}</h4>
          <div className="space-y-2">
            {Object.entries(scenarioData[scenarioData.length - 1])
              .filter(([key]) => key !== 'month' && key !== 'total')
              .map(([name, value]) => {
                const cur = latestPerName.get(name)?.currency || 'ILS';
                const currentBal = latestPerName.get(name) ? Number(latestPerName.get(name)!.amount) : 0;
                const diff = (value as number) - currentBal;
                return (
                  <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20">
                    <span className="text-xs sm:text-sm font-medium">{name}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(value as number, cur)}</p>
                      {currentBal > 0 && (
                        <p className={cn("text-xs", diff >= 0 ? "text-success" : "text-destructive")}>
                          {diff >= 0 ? '+' : ''}{formatCurrency(diff, cur)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Add Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="glass max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Plan Future Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Event Type</Label>
                <Select value={eventType} onValueChange={(v) => setEventType(v as any)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">🔄 Transfer</SelectItem>
                    <SelectItem value="deposit">📥 Deposit</SelectItem>
                    <SelectItem value="withdrawal">📤 Withdrawal</SelectItem>
                    <SelectItem value="open_account">📂 Open Account</SelectItem>
                    <SelectItem value="close_account">📁 Close Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Target Month</Label>
                <Select value={targetMonth} onValueChange={setTargetMonth}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(m => (
                      <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {['withdrawal', 'transfer', 'close_account'].includes(eventType) && (
              <div className="space-y-1.5">
                <Label className="text-xs">From Account</Label>
                <Select value={fromAccount} onValueChange={setFromAccount}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accountNames.map(n => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {['deposit', 'transfer'].includes(eventType) && (
              <div className="space-y-1.5">
                <Label className="text-xs">To Account</Label>
                <Select value={toAccount} onValueChange={setToAccount}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accountNames.filter(n => n !== fromAccount).map(n => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {eventType === 'open_account' && (
              <div className="space-y-1.5">
                <Label className="text-xs">New Account Name</Label>
                <Input value={newAccountName} onChange={e => setNewAccountName(e.target.value)} placeholder="e.g., New Investment Fund" className="h-8 text-xs" required />
              </div>
            )}

            {eventType !== 'close_account' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount</Label>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="h-8 text-xs" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Description (optional)</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., bank-saving opens, move funds to new investment" className="text-xs min-h-[50px]" />
            </div>

            <Button type="submit" size="sm" className="w-full text-xs">Add to Plan</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavingsPlanner;
