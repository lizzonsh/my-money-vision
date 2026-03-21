import { useState } from 'react';
import { useFinance, Savings } from '@/contexts/FinanceContext';
import { useStockHoldings, StockHoldingInsert, StockHolding } from '@/hooks/useStockHoldings';
import { formatCurrency } from '@/lib/formatters';
import { convertToILS } from '@/lib/currencyUtils';
import { TrendingUp, TrendingDown, Minus, Plus, Trash2, BarChart3, ShieldCheck, ShieldAlert, Shield, Pencil, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GrowthData {
  lastMonthAmount: number | null;
  currentAmount: number;
  monthlyGrowth: number | null;
  monthlyGrowthPercent: number | null;
  firstAmount: number | null;
  totalGrowth: number | null;
  totalGrowthPercent: number | null;
}

interface Props {
  saving: Savings;
  growthData: GrowthData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const riskConfig = {
  low: { label: 'Low Risk', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  medium: { label: 'Medium Risk', icon: Shield, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  high: { label: 'High Risk', icon: ShieldAlert, color: 'text-red-600 bg-red-50 border-red-200' },
};

const SavingsAccountDetail = ({ saving, growthData, open, onOpenChange }: Props) => {
  const { holdings, addHolding, updateHolding, deleteHolding, totalValue, totalCost, totalGain, totalGainPercent } = useStockHoldings(saving.name);
  const [showAddStock, setShowAddStock] = useState(false);
  const [stockForm, setStockForm] = useState({ ticker: '', name: '', quantity: '', purchasePrice: '', currentPrice: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ticker: '', name: '', quantity: '', purchasePrice: '', currentPrice: '' });

  const riskLevel = (saving as any).risk_level || 'medium';
  const risk = riskConfig[riskLevel as keyof typeof riskConfig] || riskConfig.medium;
  const RiskIcon = risk.icon;

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    addHolding({
      savings_name: saving.name,
      ticker: stockForm.ticker.toUpperCase(),
      name: stockForm.name,
      quantity: parseFloat(stockForm.quantity),
      purchase_price: parseFloat(stockForm.purchasePrice),
      current_price: parseFloat(stockForm.currentPrice),
      currency: saving.currency || 'ILS',
      holding_type: 'stock',
      last_updated: new Date().toISOString(),
    });
    setStockForm({ ticker: '', name: '', quantity: '', purchasePrice: '', currentPrice: '' });
    setShowAddStock(false);
  };

  const startEdit = (stock: StockHolding) => {
    setEditingId(stock.id);
    setEditForm({
      ticker: stock.ticker,
      name: stock.name,
      quantity: String(stock.quantity),
      purchasePrice: String(stock.purchase_price),
      currentPrice: String(stock.current_price),
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateHolding({
      id: editingId,
      ticker: editForm.ticker.toUpperCase(),
      name: editForm.name,
      quantity: parseFloat(editForm.quantity),
      purchase_price: parseFloat(editForm.purchasePrice),
      current_price: parseFloat(editForm.currentPrice),
      last_updated: new Date().toISOString(),
    });
    setEditingId(null);
  };

  const GrowthIndicator = ({ value, percent, label }: { value: number | null; percent: number | null; label: string }) => {
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
            {isPositive ? '+' : ''}{formatCurrency(value, saving.currency || 'ILS')}
          </span>
          {percent !== null && (
            <span className="text-xs opacity-80">({isPositive ? '+' : ''}{percent.toFixed(1)}%)</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            {saving.name}
          </DialogTitle>
        </DialogHeader>

        {/* Risk Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`gap-1 ${risk.color}`}>
            <RiskIcon className="h-3 w-3" />
            {risk.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Balance: {formatCurrency(Number(saving.amount), saving.currency || 'ILS')}
          </span>
        </div>

        {/* Growth Summary */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/30">
          <GrowthIndicator
            value={growthData.monthlyGrowth}
            percent={growthData.monthlyGrowthPercent}
            label="vs Last Month"
          />
          <GrowthIndicator
            value={growthData.totalGrowth}
            percent={growthData.totalGrowthPercent}
            label="Total Growth"
          />
        </div>

        {/* Stock Holdings Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Stock Holdings</h4>
            <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => setShowAddStock(!showAddStock)}>
              <Plus className="h-3 w-3" />
              Add Stock
            </Button>
          </div>

          {showAddStock && (
            <form onSubmit={handleAddStock} className="space-y-3 p-3 rounded-lg bg-secondary/20 border">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Ticker</Label>
                  <Input className="h-8 text-sm" placeholder="AAPL" value={stockForm.ticker} onChange={(e) => setStockForm({ ...stockForm, ticker: e.target.value })} required />
                </div>
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input className="h-8 text-sm" placeholder="Apple Inc." value={stockForm.name} onChange={(e) => setStockForm({ ...stockForm, name: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Qty</Label>
                  <Input className="h-8 text-sm" type="number" step="any" placeholder="10" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} required />
                </div>
                <div>
                  <Label className="text-xs">Buy Price</Label>
                  <Input className="h-8 text-sm" type="number" step="any" placeholder="150" value={stockForm.purchasePrice} onChange={(e) => setStockForm({ ...stockForm, purchasePrice: e.target.value })} required />
                </div>
                <div>
                  <Label className="text-xs">Current</Label>
                  <Input className="h-8 text-sm" type="number" step="any" placeholder="175" value={stockForm.currentPrice} onChange={(e) => setStockForm({ ...stockForm, currentPrice: e.target.value })} required />
                </div>
              </div>
              <Button type="submit" size="sm" className="w-full h-8">Add</Button>
            </form>
          )}

          {holdings.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No stocks tracked for this account</p>
          ) : (
            <div className="space-y-2">
              {holdings.map((stock) => {
                const isEditing = editingId === stock.id;
                const gain = (stock.current_price - stock.purchase_price) * stock.quantity;
                const gainPct = stock.purchase_price > 0 ? ((stock.current_price - stock.purchase_price) / stock.purchase_price) * 100 : 0;
                const isUp = gain > 0;

                if (isEditing) {
                  return (
                    <div key={stock.id} className="p-3 rounded-lg bg-secondary/20 border border-primary/30 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Ticker</Label>
                          <Input className="h-7 text-sm" value={editForm.ticker} onChange={(e) => setEditForm({ ...editForm, ticker: e.target.value })} />
                        </div>
                        <div>
                          <Label className="text-xs">Name</Label>
                          <Input className="h-7 text-sm" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Qty</Label>
                          <Input className="h-7 text-sm" type="number" step="any" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} />
                        </div>
                        <div>
                          <Label className="text-xs">Buy Price</Label>
                          <Input className="h-7 text-sm" type="number" step="any" value={editForm.purchasePrice} onChange={(e) => setEditForm({ ...editForm, purchasePrice: e.target.value })} />
                        </div>
                        <div>
                          <Label className="text-xs">Current</Label>
                          <Input className="h-7 text-sm" type="number" step="any" value={editForm.currentPrice} onChange={(e) => setEditForm({ ...editForm, currentPrice: e.target.value })} />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setEditingId(null)}>
                          <X className="h-3 w-3" /> Cancel
                        </Button>
                        <Button size="sm" className="h-7 text-xs gap-1" onClick={saveEdit}>
                          <Check className="h-3 w-3" /> Save
                        </Button>
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
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {stock.quantity} shares × {formatCurrency(stock.current_price, saving.currency || 'ILS')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(stock.quantity * stock.current_price, saving.currency || 'ILS')}</p>
                        <p className={`text-xs ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isUp ? '+' : ''}{formatCurrency(gain, saving.currency || 'ILS')} ({isUp ? '+' : ''}{gainPct.toFixed(1)}%)
                        </p>
                      </div>
                      <button
                        onClick={() => startEdit(stock)}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-primary/10 rounded transition-all"
                      >
                        <Pencil className="h-3.5 w-3.5 text-primary" />
                      </button>
                      <button
                        onClick={() => deleteHolding(stock.id)}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Stock totals */}
              <div className="flex items-center justify-between pt-2 border-t text-sm">
                <span className="text-muted-foreground">Stocks Total</span>
                <div className="text-right">
                  <span className="font-semibold">{formatCurrency(totalValue, saving.currency || 'ILS')}</span>
                  <span className={`ml-2 text-xs ${totalGain >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain, saving.currency || 'ILS')} ({totalGainPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SavingsAccountDetail;
