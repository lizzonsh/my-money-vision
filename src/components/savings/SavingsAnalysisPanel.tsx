import { useState, useMemo } from 'react';
import { useFinance, Savings } from '@/contexts/FinanceContext';
import { useSavings } from '@/hooks/useSavings';
import { useStockHoldings, StockHolding } from '@/hooks/useStockHoldings';
import { formatCurrency } from '@/lib/formatters';
import { convertToILS } from '@/lib/currencyUtils';
import { TrendingUp, TrendingDown, Minus, Plus, Trash2, BarChart3, ShieldCheck, ShieldAlert, Shield, PiggyBank, ChevronRight, Download, Pencil, X, Check } from 'lucide-react';
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

const StockSection = ({ savingsName, currency, currentMonth }: { savingsName: string; currency: string; currentMonth: string }) => {
  const { holdings, addHolding, updateHolding, deleteHolding, carryForwardToMonth, allHoldings } = useStockHoldings(savingsName, currentMonth);
  const [showAdd, setShowAdd] = useState<'stock' | 'provident_fund' | null>(null);
  const [form, setForm] = useState({ ticker: '', name: '', quantity: '', purchasePrice: '', currentPrice: '' });
  const [fundForm, setFundForm] = useState({ name: '', currentValue: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ticker: '', name: '', quantity: '', purchasePrice: '', currentPrice: '' });
  const [editFundForm, setEditFundForm] = useState({ name: '', currentValue: '' });

  const stocks = holdings.filter(h => h.holding_type !== 'provident_fund');
  const funds = holdings.filter(h => h.holding_type === 'provident_fund');

  // Check if current month has its own holdings or is carrying forward
  const hasOwnMonthData = allHoldings.some(h => h.month === currentMonth && (!savingsName || h.savings_name === savingsName));
  const isCarriedForward = holdings.length > 0 && !hasOwnMonthData;

  const handleMakeEditable = () => {
    carryForwardToMonth({ fromHoldings: holdings, targetMonth: currentMonth });
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    addHolding({
      savings_name: savingsName, ticker: form.ticker.toUpperCase(), name: form.name,
      quantity: parseFloat(form.quantity), purchase_price: parseFloat(form.purchasePrice),
      current_price: parseFloat(form.currentPrice), currency, holding_type: 'stock',
      month: currentMonth, last_updated: new Date().toISOString(),
    });
    setForm({ ticker: '', name: '', quantity: '', purchasePrice: '', currentPrice: '' });
    setShowAdd(null);
  };

  const handleAddFund = (e: React.FormEvent) => {
    e.preventDefault();
    addHolding({
      savings_name: savingsName, ticker: 'FUND', name: fundForm.name,
      quantity: 1, purchase_price: 0,
      current_price: parseFloat(fundForm.currentValue), currency, holding_type: 'provident_fund',
      month: currentMonth, last_updated: new Date().toISOString(),
    });
    setFundForm({ name: '', currentValue: '' });
    setShowAdd(null);
  };

  const startEditStock = (stock: StockHolding) => {
    setEditingId(stock.id);
    setEditForm({
      ticker: stock.ticker, name: stock.name,
      quantity: String(stock.quantity), purchasePrice: String(stock.purchase_price),
      currentPrice: String(stock.current_price),
    });
  };

  const startEditFund = (fund: StockHolding) => {
    setEditingId(fund.id);
    setEditFundForm({ name: fund.name, currentValue: String(fund.current_price) });
  };

  const saveEditStock = () => {
    if (!editingId) return;
    updateHolding({
      id: editingId, ticker: editForm.ticker.toUpperCase(), name: editForm.name,
      quantity: parseFloat(editForm.quantity), purchase_price: parseFloat(editForm.purchasePrice),
      current_price: parseFloat(editForm.currentPrice), last_updated: new Date().toISOString(),
    });
    setEditingId(null);
  };

  const saveEditFund = () => {
    if (!editingId) return;
    updateHolding({
      id: editingId, name: editFundForm.name,
      current_price: parseFloat(editFundForm.currentValue), last_updated: new Date().toISOString(),
    });
    setEditingId(null);
  };

  const hasAny = holdings.length > 0;

  return (
    <div className="space-y-4">
      {/* Add Investment Button */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Investments</h4>
        <div className="flex gap-1.5">
          <Button size="sm" variant={showAdd === 'stock' ? 'default' : 'outline'} className="gap-1 h-7 text-xs" onClick={() => setShowAdd(showAdd === 'stock' ? null : 'stock')}>
            <Plus className="h-3 w-3" />
            Stock
          </Button>
          <Button size="sm" variant={showAdd === 'provident_fund' ? 'default' : 'outline'} className="gap-1 h-7 text-xs" onClick={() => setShowAdd(showAdd === 'provident_fund' ? null : 'provident_fund')}>
            <Plus className="h-3 w-3" />
            Provident Fund
          </Button>
        </div>
      </div>

      {/* Add Stock Form */}
      {showAdd === 'stock' && (
        <form onSubmit={handleAddStock} className="space-y-3 p-3 rounded-lg bg-secondary/20 border">
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Ticker</Label><Input className="h-8 text-sm" placeholder="AAPL" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} required /></div>
            <div><Label className="text-xs">Name</Label><Input className="h-8 text-sm" placeholder="Apple Inc." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-xs">Qty</Label><Input className="h-8 text-sm" type="number" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></div>
            <div><Label className="text-xs">Buy Price</Label><Input className="h-8 text-sm" type="number" step="any" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} required /></div>
            <div><Label className="text-xs">Current</Label><Input className="h-8 text-sm" type="number" step="any" value={form.currentPrice} onChange={(e) => setForm({ ...form, currentPrice: e.target.value })} required /></div>
          </div>
          <Button type="submit" size="sm" className="w-full h-8">Add Stock</Button>
        </form>
      )}

      {/* Add Fund Form */}
      {showAdd === 'provident_fund' && (
        <form onSubmit={handleAddFund} className="space-y-3 p-3 rounded-lg bg-secondary/20 border">
          <div><Label className="text-xs">Fund Name</Label><Input className="h-8 text-sm" placeholder="e.g. Migdal Provident" value={fundForm.name} onChange={(e) => setFundForm({ ...fundForm, name: e.target.value })} required /></div>
          <div><Label className="text-xs">Current Value</Label><Input className="h-8 text-sm" type="number" step="any" value={fundForm.currentValue} onChange={(e) => setFundForm({ ...fundForm, currentValue: e.target.value })} required /></div>
          <Button type="submit" size="sm" className="w-full h-8">Add Fund</Button>
        </form>
      )}

      {!hasAny && !showAdd && (
        <p className="text-xs text-muted-foreground text-center py-3">No investments tracked. Add a stock or provident fund above.</p>
      )}

      {/* Stock Holdings */}
      {stocks.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stocks</h5>
          {stocks.map((stock) => {
            const isEditing = editingId === stock.id;
            const gain = (stock.current_price - stock.purchase_price) * stock.quantity;
            const gainPct = stock.purchase_price > 0 ? ((stock.current_price - stock.purchase_price) / stock.purchase_price) * 100 : 0;
            const isUp = gain > 0;

            if (isEditing) {
              return (
                <div key={stock.id} className="p-3 rounded-lg bg-secondary/20 border border-primary/30 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Ticker</Label><Input className="h-7 text-sm" value={editForm.ticker} onChange={(e) => setEditForm({ ...editForm, ticker: e.target.value })} /></div>
                    <div><Label className="text-xs">Name</Label><Input className="h-7 text-sm" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label className="text-xs">Qty</Label><Input className="h-7 text-sm" type="number" step="any" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} /></div>
                    <div><Label className="text-xs">Buy Price</Label><Input className="h-7 text-sm" type="number" step="any" value={editForm.purchasePrice} onChange={(e) => setEditForm({ ...editForm, purchasePrice: e.target.value })} /></div>
                    <div><Label className="text-xs">Current</Label><Input className="h-7 text-sm" type="number" step="any" value={editForm.currentPrice} onChange={(e) => setEditForm({ ...editForm, currentPrice: e.target.value })} /></div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setEditingId(null)}><X className="h-3 w-3" /> Cancel</Button>
                    <Button size="sm" className="h-7 text-xs gap-1" onClick={saveEditStock}><Check className="h-3 w-3" /> Save</Button>
                  </div>
                </div>
              );
            }

            return (
              <div key={stock.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 group">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-sm">{stock.ticker}</span>
                    <span className="text-xs text-muted-foreground">{stock.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{stock.quantity} shares × {formatCurrency(stock.purchase_price, currency)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(stock.current_price, currency)}</p>
                    <p className={`text-xs ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>{isUp ? '+' : ''}{gainPct.toFixed(1)}%</p>
                  </div>
                  <button onClick={() => startEditStock(stock)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-primary/10 rounded transition-all"><Pencil className="h-3.5 w-3.5 text-primary" /></button>
                  <button onClick={() => deleteHolding(stock.id)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Provident Funds */}
      {funds.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Provident Funds</h5>
          {funds.map((fund) => {
            const isEditing = editingId === fund.id;

            if (isEditing) {
              return (
                <div key={fund.id} className="p-3 rounded-lg bg-secondary/20 border border-primary/30 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Fund Name</Label><Input className="h-7 text-sm" value={editFundForm.name} onChange={(e) => setEditFundForm({ ...editFundForm, name: e.target.value })} /></div>
                    <div><Label className="text-xs">Current Value</Label><Input className="h-7 text-sm" type="number" step="any" value={editFundForm.currentValue} onChange={(e) => setEditFundForm({ ...editFundForm, currentValue: e.target.value })} /></div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setEditingId(null)}><X className="h-3 w-3" /> Cancel</Button>
                    <Button size="sm" className="h-7 text-xs gap-1" onClick={saveEditFund}><Check className="h-3 w-3" /> Save</Button>
                  </div>
                </div>
              );
            }

            return (
              <div key={fund.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 group">
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-sm">{fund.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{formatCurrency(fund.current_price, currency)}</p>
                  <button onClick={() => startEditFund(fund)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-primary/10 rounded transition-all"><Pencil className="h-3.5 w-3.5 text-primary" /></button>
                  <button onClick={() => deleteHolding(fund.id)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Combined Total */}
      {hasAny && (
        <div className="flex items-center justify-between pt-2 border-t text-sm">
          <span className="text-muted-foreground">Investments Total</span>
          {(() => {
            const total = holdings.reduce((sum, h) => sum + (h.holding_type === 'provident_fund' ? h.current_price : h.quantity * h.current_price), 0);
            const cost = holdings.reduce((sum, h) => sum + (h.holding_type === 'provident_fund' ? h.purchase_price : h.quantity * h.purchase_price), 0);
            const gain = total - cost;
            const pct = cost > 0 ? (gain / cost) * 100 : 0;
            return (
              <div className="text-right">
                <span className="font-semibold">{formatCurrency(total, currency)}</span>
                <span className={`ml-2 text-xs ${gain >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {gain >= 0 ? '+' : ''}{formatCurrency(gain, currency)} ({pct.toFixed(1)}%)
                </span>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

const SavingsAnalysisPanel = () => {
  const { savings, updateSavings, currentMonth } = useFinance();
  const { updateSavingsByName } = useSavings();
  const { holdings: allHoldings } = useStockHoldings();
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
      if (!existing || saving.month > existing.month || 
          (saving.month === existing.month && new Date(saving.updated_at) > new Date(existing.updated_at))) {
        acc.set(saving.name, saving);
      }
      return acc;
    }, new Map<string, Savings>());

  const uniqueSavings = Array.from(latestSavingsPerName.values());

  const growthDataMap = useMemo(() => {
    const map = new Map<string, {
      lastMonthAmount: number | null; currentAmount: number;
      monthlyGrowth: number | null; monthlyGrowthPercent: number | null;
      ytdGrowth: number | null; ytdGrowthPercent: number | null;
      allTimeGrowth: number | null; allTimeGrowthPercent: number | null;
    }>();

    for (const saving of uniqueSavings) {
      // Find the most recent record from any month before the current one
      const prevRecords = savings
        .filter(s => s.name === saving.name && s.month < currentMonth)
        .sort((a, b) => b.month.localeCompare(a.month) || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      const prevRecord = prevRecords[0];

      // YTD: compare against the last record from before the current year (closing balance of last year)
      // If no pre-year records exist, fall back to earliest record of the current year
      const currentYear = currentMonth.split('-')[0];
      const janMonth = `${currentYear}-01`;
      const lastYearRecords = savings
        .filter(s => s.name === saving.name && s.month < janMonth)
        .sort((a, b) => b.month.localeCompare(a.month) || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      const lastYearClosing = lastYearRecords[0];

      // Fallback: earliest record of current year
      const ytdRecords = savings
        .filter(s => s.name === saving.name && s.month >= janMonth && s.month <= currentMonth)
        .sort((a, b) => a.month.localeCompare(b.month) || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const firstYtdRecord = ytdRecords[0];

      const ytdBaseRecord = lastYearClosing || firstYtdRecord;

      // All-time: earliest record ever
      const allRecords = savings
        .filter(s => s.name === saving.name)
        .sort((a, b) => a.month.localeCompare(b.month) || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const firstEverRecord = allRecords[0];

      const currentAmount = Number(saving.amount);
      const lastMonthAmount = prevRecord ? Number(prevRecord.amount) : null;

      const monthlyGrowth = lastMonthAmount !== null ? currentAmount - lastMonthAmount : null;
      const monthlyGrowthPercent = lastMonthAmount !== null && lastMonthAmount > 0
        ? ((currentAmount - lastMonthAmount) / lastMonthAmount) * 100 : null;

      const ytdBaseAmount = ytdBaseRecord ? Number(ytdBaseRecord.amount) : null;
      const hasYtd = ytdBaseRecord && ytdBaseRecord.id !== saving.id;
      const ytdGrowth = hasYtd && ytdBaseAmount !== null ? currentAmount - ytdBaseAmount : null;
      const ytdGrowthPercent = hasYtd && ytdBaseAmount !== null && ytdBaseAmount > 0
        ? ((currentAmount - ytdBaseAmount) / ytdBaseAmount) * 100 : null;

      const firstEverAmount = firstEverRecord ? Number(firstEverRecord.amount) : null;
      const hasAllTime = firstEverRecord && firstEverRecord.id !== saving.id;
      const allTimeGrowth = hasAllTime && firstEverAmount !== null ? currentAmount - firstEverAmount : null;
      const allTimeGrowthPercent = hasAllTime && firstEverAmount !== null && firstEverAmount > 0
        ? ((currentAmount - firstEverAmount) / firstEverAmount) * 100 : null;

      map.set(saving.name, { lastMonthAmount, currentAmount, monthlyGrowth, monthlyGrowthPercent, ytdGrowth, ytdGrowthPercent, allTimeGrowth, allTimeGrowthPercent });
    }
    return map;
  }, [uniqueSavings, savings, currentMonth]);

  const selected = selectedAccount ? uniqueSavings.find(s => s.name === selectedAccount) : null;
  const selectedGrowth = selected ? growthDataMap.get(selected.name) : null;

  const handleRiskChange = (saving: Savings, newRisk: string) => {
    updateSavingsByName({ name: saving.name, updates: { risk_level: newRisk } });
  };

  const handleExportCSV = () => {
    const rows: string[] = [];
    rows.push(['Account', 'Amount', 'Currency', 'Risk Level', 'Last Month Growth', 'Last Month Growth %', 'YTD Growth', 'YTD Growth %', 'All-Time Growth', 'All-Time Growth %'].join(','));

    for (const saving of uniqueSavings) {
      const growth = growthDataMap.get(saving.name);
      const escapeName = `"${saving.name.replace(/"/g, '""')}"`;
      rows.push([
        escapeName,
        Number(saving.amount).toFixed(2),
        saving.currency || 'ILS',
        saving.risk_level || 'medium',
        growth?.monthlyGrowth?.toFixed(2) ?? '',
        growth?.monthlyGrowthPercent != null ? growth.monthlyGrowthPercent.toFixed(1) + '%' : '',
        growth?.ytdGrowth?.toFixed(2) ?? '',
        growth?.ytdGrowthPercent != null ? growth.ytdGrowthPercent.toFixed(1) + '%' : '',
        growth?.allTimeGrowth?.toFixed(2) ?? '',
        growth?.allTimeGrowthPercent != null ? growth.allTimeGrowthPercent.toFixed(1) + '%' : '',
      ].join(','));
    }

    // Stocks section
    const stocks = allHoldings.filter(h => h.holding_type !== 'provident_fund');
    if (stocks.length > 0) {
      rows.push('');
      rows.push(['Account', 'Ticker', 'Name', 'Quantity', 'Buy Price', 'Current Price', 'Value', 'Gain/Loss', 'Gain %'].join(','));
      for (const s of stocks) {
        const value = s.quantity * s.current_price;
        const cost = s.quantity * s.purchase_price;
        const gain = value - cost;
        const pct = s.purchase_price > 0 ? ((s.current_price - s.purchase_price) / s.purchase_price) * 100 : 0;
        rows.push([
          `"${s.savings_name.replace(/"/g, '""')}"`,
          s.ticker,
          `"${s.name.replace(/"/g, '""')}"`,
          s.quantity,
          s.purchase_price.toFixed(2),
          s.current_price.toFixed(2),
          value.toFixed(2),
          gain.toFixed(2),
          pct.toFixed(1) + '%',
        ].join(','));
      }
    }

    // Provident Funds section
    const funds = allHoldings.filter(h => h.holding_type === 'provident_fund');
    if (funds.length > 0) {
      rows.push('');
      rows.push(['Account', 'Fund Name', 'Current Value'].join(','));
      for (const f of funds) {
        rows.push([
          `"${f.savings_name.replace(/"/g, '""')}"`,
          `"${f.name.replace(/"/g, '""')}"`,
          f.current_price.toFixed(2),
        ].join(','));
      }
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `savings-stats-${currentMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Account List */}
      <div className="glass rounded-xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Accounts</h3>
          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={handleExportCSV}>
            <Download className="h-3 w-3" />
            Export CSV
          </Button>
        </div>
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
            <div className="grid grid-cols-3 gap-4">
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
                  value={selectedGrowth.ytdGrowth}
                  percent={selectedGrowth.ytdGrowthPercent}
                  label="YTD Growth"
                  currency={selected.currency || 'ILS'}
                />
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <GrowthIndicator
                  value={selectedGrowth.allTimeGrowth}
                  percent={selectedGrowth.allTimeGrowthPercent}
                  label="All-Time Growth"
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
