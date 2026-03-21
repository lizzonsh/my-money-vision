import { useState, useMemo } from 'react';
import { useFinance, Savings } from '@/contexts/FinanceContext';
import { useSavings } from '@/hooks/useSavings';
import { useStockHoldings } from '@/hooks/useStockHoldings';
import { formatCurrency } from '@/lib/formatters';
import { convertToILS } from '@/lib/currencyUtils';
import { TrendingUp, TrendingDown, Minus, Plus, Trash2, BarChart3, ShieldCheck, ShieldAlert, Shield, PiggyBank, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const riskConfig = {
  low: { label: 'Low Risk', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  medium: { label: 'Medium Risk', icon: Shield, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  high: { label: 'High Risk', icon: ShieldAlert, color: 'text-red-600 bg-red-50 border-red-200' },
};

const GrowthIndicator = ({ value, percent, label, currency }: { value: number | null; percent: number | null; label: string; currency: string }) => {
  if (value === null) return <span className="text-xs text-muted-foreground">{label}: N/A</span>;
  const isPositive = value > 0;
  const isZero = value === 0;
  const Icon = isPositive ? TrendingUp : isZero ? Minus : TrendingDown;
  const colorClass = isPositive ? 'text-emerald-600' : isZero ? 'text-muted-foreground' : 'text-red-600';

  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground mb-1">{label}</span>
      <div className={`flex items-center gap-1.5 ${colorClass}`}>
        <Icon className="h-4 w-4" />
        <span className="font-semibold text-sm">
          {isPositive ? '+' : ''}{formatCurrency(value, currency)}
        </span>
        {percent !== null && (
          <span className="text-xs opacity-80">({isPositive ? '+' : ''}{percent.toFixed(1)}%)</span>
        )}
      </div>
    </div>
  );
};

const StockSection = ({ savingsName, currency }: { savingsName: string; currency: string }) => {
  const { holdings, addHolding, deleteHolding, totalValue, totalGain, totalGainPercent } = useStockHoldings(savingsName);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ticker: '', name: '', quantity: '', purchasePrice: '', currentPrice: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addHolding({
      savings_name: savingsName,
      ticker: form.ticker.toUpperCase(),
      name: form.name,
      quantity: parseFloat(form.quantity),
      purchase_price: parseFloat(form.purchasePrice),
      current_price: parseFloat(form.currentPrice),
      currency,
      last_updated: new Date().toISOString(),
    });
    setForm({ ticker: '', name: '', quantity: '', purchasePrice: '', currentPrice: '' });
    setShowAdd(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Stock Holdings</h4>
        <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3 w-3" />
          Add Stock
        </Button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="space-y-3 p-3 rounded-lg bg-secondary/20 border">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Ticker</Label>
              <Input className="h-8 text-sm" placeholder="AAPL" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} required />
            </div>
            <div>
              <Label className="text-xs">Name</Label>
              <Input className="h-8 text-sm" placeholder="Apple Inc." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Qty</Label>
              <Input className="h-8 text-sm" type="number" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            </div>
            <div>
              <Label className="text-xs">Buy Price</Label>
              <Input className="h-8 text-sm" type="number" step="any" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} required />
            </div>
            <div>
              <Label className="text-xs">Current</Label>
              <Input className="h-8 text-sm" type="number" step="any" value={form.currentPrice} onChange={(e) => setForm({ ...form, currentPrice: e.target.value })} required />
            </div>
          </div>
          <Button type="submit" size="sm" className="w-full h-8">Add</Button>
        </form>
      )}

      {holdings.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">No stocks tracked</p>
      ) : (
        <div className="space-y-2">
          {holdings.map((stock) => {
            const gain = (stock.current_price - stock.purchase_price) * stock.quantity;
            const gainPct = stock.purchase_price > 0 ? ((stock.current_price - stock.purchase_price) / stock.purchase_price) * 100 : 0;
            const isUp = gain > 0;
            return (
              <div key={stock.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 group">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-sm">{stock.ticker}</span>
                    <span className="text-xs text-muted-foreground">{stock.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stock.quantity} shares × {formatCurrency(stock.current_price, currency)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(stock.quantity * stock.current_price, currency)}</p>
                    <p className={`text-xs ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isUp ? '+' : ''}{formatCurrency(gain, currency)} ({isUp ? '+' : ''}{gainPct.toFixed(1)}%)
                    </p>
                  </div>
                  <button onClick={() => deleteHolding(stock.id)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-2 border-t text-sm">
            <span className="text-muted-foreground">Stocks Total</span>
            <div className="text-right">
              <span className="font-semibold">{formatCurrency(totalValue, currency)}</span>
              <span className={`ml-2 text-xs ${totalGain >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain, currency)} ({totalGainPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SavingsAnalysisPanel = () => {
  const { savings, updateSavings, currentMonth } = useFinance();
  const { updateSavingsByName } = useSavings();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const currentMonthDate = new Date(currentMonth + '-01');

  const latestSavingsPerName = savings
    .filter(s => s.month <= currentMonth)
    .filter(s => {
      if (!s.closed_at) return true;
      return new Date(s.closed_at) > currentMonthDate;
    })
    .reduce((acc, saving) => {
      const existing = acc.get(saving.name);
      if (!existing || new Date(saving.updated_at) > new Date(existing.updated_at)) {
        acc.set(saving.name, saving);
      }
      return acc;
    }, new Map<string, Savings>());

  const uniqueSavings = Array.from(latestSavingsPerName.values());

  const growthDataMap = useMemo(() => {
    const map = new Map<string, { lastMonthAmount: number | null; currentAmount: number; monthlyGrowth: number | null; monthlyGrowthPercent: number | null; firstAmount: number | null; totalGrowth: number | null; totalGrowthPercent: number | null }>();

    for (const saving of uniqueSavings) {
      const [y, m] = currentMonth.split('-').map(Number);
      const prevDate = new Date(y, m - 2, 1);
      const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

      // Find the latest record for this account in the previous month (any record, not just non-action)
      const prevRecords = savings
        .filter(s => s.name === saving.name && s.month === prevMonth)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      const prevRecord = prevRecords[0];

      // Find the earliest record from the beginning of the current year for YTD growth
      const currentYear = currentMonth.split('-')[0];
      const janMonth = `${currentYear}-01`;
      const ytdRecords = savings
        .filter(s => s.name === saving.name && s.month >= janMonth && s.month <= currentMonth)
        .sort((a, b) => a.month.localeCompare(b.month) || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const firstYtdRecord = ytdRecords[0];

      const currentAmount = Number(saving.amount);
      const lastMonthAmount = prevRecord ? Number(prevRecord.amount) : null;
      const firstYtdAmount = firstYtdRecord ? Number(firstYtdRecord.amount) : null;

      const monthlyGrowth = lastMonthAmount !== null ? currentAmount - lastMonthAmount : null;
      const monthlyGrowthPercent = lastMonthAmount !== null && lastMonthAmount > 0
        ? ((currentAmount - lastMonthAmount) / lastMonthAmount) * 100 : null;

      // YTD growth: compare current amount vs first record of the year
      const hasYtdHistory = firstYtdRecord && firstYtdRecord.id !== saving.id;
      const totalGrowth = hasYtdHistory && firstYtdAmount !== null ? currentAmount - firstYtdAmount : null;
      const totalGrowthPercent = hasYtdHistory && firstYtdAmount !== null && firstYtdAmount > 0
        ? ((currentAmount - firstYtdAmount) / firstYtdAmount) * 100 : null;

      map.set(saving.name, { lastMonthAmount, currentAmount, monthlyGrowth, monthlyGrowthPercent, firstAmount: firstYtdAmount, totalGrowth, totalGrowthPercent });
    }
    return map;
  }, [uniqueSavings, savings, currentMonth]);

  const selected = selectedAccount ? uniqueSavings.find(s => s.name === selectedAccount) : null;
  const selectedGrowth = selected ? growthDataMap.get(selected.name) : null;

  const handleRiskChange = (saving: Savings, newRisk: string) => {
    updateSavings({ id: saving.id, risk_level: newRisk });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Account List */}
      <div className="glass rounded-xl p-5 shadow-card">
        <h3 className="font-semibold mb-4">Accounts</h3>
        <div className="space-y-2">
          {uniqueSavings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No savings accounts</p>
          ) : (
            uniqueSavings.map((saving) => {
              const riskLevel = saving.risk_level || 'medium';
              const risk = riskConfig[riskLevel as keyof typeof riskConfig] || riskConfig.medium;
              const RiskIcon = risk.icon;
              const growth = growthDataMap.get(saving.name);
              const isSelected = selectedAccount === saving.name;

              return (
                <button
                  key={saving.id}
                  onClick={() => setSelectedAccount(saving.name)}
                  className={`w-full text-left p-3 rounded-lg transition-colors flex items-center justify-between group ${
                    isSelected ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/30 hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <PiggyBank className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm truncate">{saving.name}</p>
                        <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 gap-0.5 shrink-0 ${risk.color}`}>
                          <RiskIcon className="h-2.5 w-2.5" />
                          {risk.label.split(' ')[0]}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold mt-0.5">{formatCurrency(Number(saving.amount), saving.currency || 'ILS')}</p>
                      {growth?.monthlyGrowthPercent !== null && growth?.monthlyGrowthPercent !== undefined && (
                        <span className={`text-[10px] ${growth.monthlyGrowthPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {growth.monthlyGrowthPercent >= 0 ? '▲' : '▼'} {Math.abs(growth.monthlyGrowthPercent).toFixed(1)}% this month
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 shrink-0 transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="lg:col-span-2">
        {selected && selectedGrowth ? (
          <div className="glass rounded-xl p-5 shadow-card space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">{selected.name}</h3>
              </div>
              <p className="text-xl font-bold">{formatCurrency(Number(selected.amount), selected.currency || 'ILS')}</p>
            </div>

            {/* Risk Level Selector */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground">Risk Level</Label>
              <Select
                value={selected.risk_level || 'medium'}
                onValueChange={(value) => handleRiskChange(selected, value)}
              >
                <SelectTrigger className="w-44 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low Risk</SelectItem>
                  <SelectItem value="medium">🟡 Medium Risk</SelectItem>
                  <SelectItem value="high">🔴 High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Growth Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-secondary/30">
                <GrowthIndicator
                  value={selectedGrowth.monthlyGrowth}
                  percent={selectedGrowth.monthlyGrowthPercent}
                  label="vs Last Month"
                  currency={selected.currency || 'ILS'}
                />
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <GrowthIndicator
                  value={selectedGrowth.totalGrowth}
                  percent={selectedGrowth.totalGrowthPercent}
                  label="YTD Growth"
                  currency={selected.currency || 'ILS'}
                />
              </div>
            </div>

            {/* Stocks */}
            <StockSection savingsName={selected.name} currency={selected.currency || 'ILS'} />
          </div>
        ) : (
          <div className="glass rounded-xl p-5 shadow-card flex items-center justify-center h-64">
            <p className="text-muted-foreground text-sm">Select an account to view analysis</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavingsAnalysisPanel;
