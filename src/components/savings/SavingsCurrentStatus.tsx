import { useState, useMemo } from 'react';
import { useFinance, Savings } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { convertToILS, SUPPORTED_CURRENCIES } from '@/lib/currencyUtils';
import { Plus, Trash2, PiggyBank, Pencil, TrendingUp, TrendingDown, Minus, ShieldCheck, Shield, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import SavingsAccountDetail from './SavingsAccountDetail';

const riskConfig = {
  low: { label: 'Low', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  medium: { label: 'Med', icon: Shield, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  high: { label: 'High', icon: ShieldAlert, color: 'text-red-600 bg-red-50 border-red-200' },
};

const SavingsCurrentStatus = () => {
  const { savings, recurringSavings, addSavings, updateSavings, closeSavingsAccount, currentMonth } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [editingSaving, setEditingSaving] = useState<Savings | null>(null);
  const [detailSaving, setDetailSaving] = useState<Savings | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    transferMethod: 'bank_account',
    cardId: '',
    currency: 'ILS',
    riskLevel: 'medium',
  });

  const currentMonthDate = new Date(currentMonth + '-01');

  const latestSavingsPerName = savings
    .filter(s => s.month <= currentMonth)
    .filter(s => {
      if (!s.closed_at) return true;
      const closedDate = new Date(s.closed_at);
      return closedDate > currentMonthDate;
    })
    .reduce((acc, saving) => {
      const existing = acc.get(saving.name);
      if (!existing || new Date(saving.updated_at) > new Date(existing.updated_at)) {
        acc.set(saving.name, saving);
      }
      return acc;
    }, new Map<string, Savings>());

  const uniqueSavings = Array.from(latestSavingsPerName.values());

  // Calculate growth data for each account
  const growthDataMap = useMemo(() => {
    const map = new Map<string, { lastMonthAmount: number | null; currentAmount: number; monthlyGrowth: number | null; monthlyGrowthPercent: number | null; firstAmount: number | null; totalGrowth: number | null; totalGrowthPercent: number | null }>();

    for (const saving of uniqueSavings) {
      // Get previous month
      const [y, m] = currentMonth.split('-').map(Number);
      const prevDate = new Date(y, m - 2, 1);
      const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

      // Find last month's record for same account name
      const prevRecord = savings
        .filter(s => s.name === saving.name && s.month === prevMonth && !s.action)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

      // Find the earliest record for total growth
      const allRecords = savings
        .filter(s => s.name === saving.name && !s.action)
        .sort((a, b) => a.month.localeCompare(b.month));
      const firstRecord = allRecords[0];

      const currentAmount = Number(saving.amount);
      const lastMonthAmount = prevRecord ? Number(prevRecord.amount) : null;
      const firstAmount = firstRecord ? Number(firstRecord.amount) : null;

      const monthlyGrowth = lastMonthAmount !== null ? currentAmount - lastMonthAmount : null;
      const monthlyGrowthPercent = lastMonthAmount !== null && lastMonthAmount > 0
        ? ((currentAmount - lastMonthAmount) / lastMonthAmount) * 100 : null;

      const totalGrowth = firstAmount !== null && firstRecord?.month !== currentMonth
        ? currentAmount - firstAmount : null;
      const totalGrowthPercent = firstAmount !== null && firstAmount > 0 && firstRecord?.month !== currentMonth
        ? ((currentAmount - firstAmount) / firstAmount) * 100 : null;

      map.set(saving.name, { lastMonthAmount, currentAmount, monthlyGrowth, monthlyGrowthPercent, firstAmount, totalGrowth, totalGrowthPercent });
    }
    return map;
  }, [uniqueSavings, savings, currentMonth]);

  const totalPortfolioValue = uniqueSavings.reduce(
    (sum, s) => sum + convertToILS(Number(s.amount), s.currency || 'ILS'),
    0
  );

  const resetForm = () => {
    setFormData({ name: '', amount: '', transferMethod: 'bank_account', cardId: '', currency: 'ILS', riskLevel: 'medium' });
    setEditingSaving(null);
  };

  const handleOpenEdit = (saving: Savings, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSaving(saving);
    setFormData({
      name: saving.name,
      amount: saving.amount.toString(),
      transferMethod: saving.transfer_method,
      cardId: saving.card_id || '',
      currency: saving.currency || 'ILS',
      riskLevel: (saving as any).risk_level || 'medium',
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savingData = {
      month: currentMonth,
      name: formData.name,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      transfer_method: formData.transferMethod as 'bank_account' | 'credit_card',
      card_id: formData.cardId || null,
      action: null,
      action_amount: null,
      monthly_deposit: null,
      recurring_type: null,
      recurring_day_of_month: null,
      closed_at: null,
      is_completed: false,
      risk_level: formData.riskLevel,
    };

    if (editingSaving) {
      updateSavings({ id: editingSaving.id, ...savingData });
    } else {
      addSavings(savingData);
    }
    resetForm();
    setIsOpen(false);
  };

  const GrowthBadge = ({ value, percent }: { value: number | null; percent: number | null }) => {
    if (value === null) return null;
    const isUp = value > 0;
    const isZero = value === 0;
    const Icon = isUp ? TrendingUp : isZero ? Minus : TrendingDown;
    const cls = isUp ? 'text-emerald-600' : isZero ? 'text-muted-foreground' : 'text-red-600';
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs ${cls}`}>
        <Icon className="h-3 w-3" />
        {percent !== null && <span>{isUp ? '+' : ''}{percent.toFixed(1)}%</span>}
      </span>
    );
  };

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Current Portfolio</h3>
          <p className="text-lg font-bold">{formatCurrency(totalPortfolioValue)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {uniqueSavings.length} account{uniqueSavings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>{editingSaving ? 'Edit Savings' : 'Add Savings Account'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Account Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Altshuler Investment" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Current Amount</Label>
                  <Input id="amount" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0" required />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Transfer Method</Label>
                  <Select value={formData.transferMethod} onValueChange={(value) => setFormData({ ...formData, transferMethod: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_account">Bank Account</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Risk Level</Label>
                  <Select value={formData.riskLevel} onValueChange={(value) => setFormData({ ...formData, riskLevel: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Low Risk</SelectItem>
                      <SelectItem value="medium">🟡 Medium Risk</SelectItem>
                      <SelectItem value="high">🔴 High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.transferMethod === 'credit_card' && (
                <div className="space-y-2">
                  <Label>Card</Label>
                  <Select value={formData.cardId} onValueChange={(value) => setFormData({ ...formData, cardId: value })}>
                    <SelectTrigger><SelectValue placeholder="Select card" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fly-card">Fly Card</SelectItem>
                      <SelectItem value="hever">Hever</SelectItem>
                      <SelectItem value="visa">Visa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full">
                {editingSaving ? 'Save Changes' : 'Add Savings'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {uniqueSavings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No savings accounts</p>
        ) : (
          uniqueSavings.map((saving) => {
            const growth = growthDataMap.get(saving.name);
            const riskLevel = (saving as any).risk_level || 'medium';
            const risk = riskConfig[riskLevel as keyof typeof riskConfig] || riskConfig.medium;
            const RiskIcon = risk.icon;

            return (
              <div
                key={saving.id}
                className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group cursor-pointer"
                onClick={() => setDetailSaving(saving)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                      <PiggyBank className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{saving.name}</p>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 gap-0.5 ${risk.color}`}>
                          <RiskIcon className="h-2.5 w-2.5" />
                          {risk.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {growth && (
                          <>
                            <GrowthBadge value={growth.monthlyGrowth} percent={growth.monthlyGrowthPercent} />
                            {growth.totalGrowth !== null && (
                              <span className="text-[10px] text-muted-foreground">
                                total: {growth.totalGrowth >= 0 ? '+' : ''}{growth.totalGrowthPercent?.toFixed(1)}%
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(Number(saving.amount), saving.currency || 'ILS')}</p>
                      {saving.currency && saving.currency !== 'ILS' && (
                        <p className="text-xs text-muted-foreground">
                          ≈ {formatCurrency(convertToILS(Number(saving.amount), saving.currency))}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleOpenEdit(saving, e)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-secondary rounded transition-all"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); closeSavingsAccount(saving.name, currentMonth); }}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"
                      title="Close account from this month (preserves history)"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Dialog */}
      {detailSaving && (
        <SavingsAccountDetail
          saving={detailSaving}
          growthData={growthDataMap.get(detailSaving.name) || { lastMonthAmount: null, currentAmount: Number(detailSaving.amount), monthlyGrowth: null, monthlyGrowthPercent: null, firstAmount: null, totalGrowth: null, totalGrowthPercent: null }}
          open={!!detailSaving}
          onOpenChange={(open) => { if (!open) setDetailSaving(null); }}
        />
      )}
    </div>
  );
};

export default SavingsCurrentStatus;
