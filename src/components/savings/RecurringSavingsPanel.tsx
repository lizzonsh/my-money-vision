import { useState } from 'react';
import { useFinance, RecurringSavings } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { convertToILS, SUPPORTED_CURRENCIES } from '@/lib/currencyUtils';
import { format } from 'date-fns';
import { Plus, Trash2, Pencil, Repeat, Pause, TrendingUp, ArrowDownRight, CalendarIcon, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';

const RecurringSavingsPanel = () => {
  const { 
    recurringSavings, 
    addRecurringSavings, 
    updateRecurringSavings, 
    deleteRecurringSavings,
  } = useFinance();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringSavings | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    defaultAmount: '',
    actionType: 'deposit',
    transferMethod: 'bank_account',
    cardId: '',
    dayOfMonth: '',
    notes: '',
    endDate: null as Date | null,
    currency: 'ILS',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      defaultAmount: '',
      actionType: 'deposit',
      transferMethod: 'bank_account',
      cardId: '',
      dayOfMonth: '',
      notes: '',
      endDate: null,
      currency: 'ILS',
    });
    setEditingTemplate(null);
  };

  const handleOpenEdit = (template: RecurringSavings) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      defaultAmount: template.default_amount.toString(),
      actionType: template.action_type,
      transferMethod: template.transfer_method,
      cardId: template.card_id || '',
      dayOfMonth: template.day_of_month.toString(),
      notes: template.notes || '',
      endDate: template.end_date ? new Date(template.end_date) : null,
      currency: template.currency || 'ILS',
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const templateData = {
      name: formData.name,
      default_amount: parseFloat(formData.defaultAmount),
      action_type: formData.actionType as 'deposit' | 'withdrawal',
      transfer_method: formData.transferMethod as 'bank_account' | 'credit_card',
      card_id: formData.cardId || null,
      day_of_month: parseInt(formData.dayOfMonth) || 1,
      is_active: true,
      notes: formData.notes || null,
      end_date: formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : null,
      currency: formData.currency,
    };

    if (editingTemplate) {
      updateRecurringSavings({ id: editingTemplate.id, ...templateData });
    } else {
      addRecurringSavings(templateData);
    }
    resetForm();
    setIsOpen(false);
  };

  const toggleActive = (template: RecurringSavings) => {
    updateRecurringSavings({ id: template.id, is_active: !template.is_active });
  };

  const formatCardName = (cardId?: string | null) => {
    if (!cardId) return '';
    const cardNames: Record<string, string> = {
      'fly-card': 'Fly Card',
      'hever': 'Hever',
      'visa': 'Visa',
    };
    return cardNames[cardId] || cardId;
  };

  // Convert all amounts to ILS before summing
  const totalMonthlyDeposits = recurringSavings
    .filter(t => t.is_active && t.action_type === 'deposit')
    .reduce((sum, t) => sum + convertToILS(Number(t.default_amount), t.currency || 'ILS'), 0);

  const totalMonthlyWithdrawals = recurringSavings
    .filter(t => t.is_active && t.action_type === 'withdrawal')
    .reduce((sum, t) => sum + convertToILS(Number(t.default_amount), t.currency || 'ILS'), 0);

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Repeat className="h-4 w-4 text-primary" />
            Recurring Savings
          </h3>
          <div className="flex gap-3 mt-1">
            <p className="text-sm text-success">
              +{formatCurrency(totalMonthlyDeposits)}<span className="text-xs text-muted-foreground">/mo</span>
            </p>
            {totalMonthlyWithdrawals > 0 && (
              <p className="text-sm text-destructive">
                -{formatCurrency(totalMonthlyWithdrawals)}<span className="text-xs text-muted-foreground">/mo</span>
              </p>
            )}
          </div>
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
              <DialogTitle>{editingTemplate ? 'Edit Recurring Savings' : 'Add Recurring Savings'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Investment, Emergency Fund"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultAmount">Default Amount</Label>
                  <div className="flex gap-2">
                    <Input
                      id="defaultAmount"
                      type="number"
                      value={formData.defaultAmount}
                      onChange={(e) => setFormData({ ...formData, defaultAmount: e.target.value })}
                      placeholder="0"
                      className="flex-1"
                      required
                    />
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_CURRENCIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.symbol} {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.currency !== 'ILS' && formData.defaultAmount && (
                    <p className="text-xs text-muted-foreground">
                      ≈ {formatCurrency(convertToILS(parseFloat(formData.defaultAmount) || 0, formData.currency))} ILS
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dayOfMonth">Day of Month</Label>
                  <Input
                    id="dayOfMonth"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dayOfMonth}
                    onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                    placeholder="1"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Action Type</Label>
                  <Select
                    value={formData.actionType}
                    onValueChange={(value) => setFormData({ ...formData, actionType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Transfer Method</Label>
                  <Select
                    value={formData.transferMethod}
                    onValueChange={(value) => setFormData({ ...formData, transferMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_account">Bank Account</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.transferMethod === 'credit_card' && (
                <div className="space-y-2">
                  <Label>Card</Label>
                  <Select
                    value={formData.cardId}
                    onValueChange={(value) => setFormData({ ...formData, cardId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select card" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fly-card">Fly Card</SelectItem>
                      <SelectItem value="hever">Hever</SelectItem>
                      <SelectItem value="visa">Visa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : "No end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate || undefined}
                      onSelect={(date) => setFormData({ ...formData, endDate: date || null })}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                    {formData.endDate && (
                      <div className="p-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setFormData({ ...formData, endDate: null })}
                        >
                          Clear end date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingTemplate ? 'Save Changes' : 'Add Recurring Savings'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {recurringSavings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recurring savings set up
          </p>
        ) : (
          recurringSavings.map((template) => (
            <div
              key={template.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg transition-colors group',
                !template.is_active 
                  ? 'bg-muted/20 opacity-60'
                  : template.action_type === 'withdrawal'
                    ? 'bg-destructive/10 hover:bg-destructive/15'
                    : 'bg-secondary/30 hover:bg-secondary/50'
              )}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleActive(template)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    !template.is_active 
                      ? 'bg-muted text-muted-foreground'
                      : template.action_type === 'withdrawal'
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-success/20 text-success'
                  )}
                >
                  {template.is_active ? (
                    template.action_type === 'withdrawal' ? (
                      <ArrowDownRight className="h-4 w-4" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                </button>
                <div>
                  <p className="text-sm font-medium">{template.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Day {template.day_of_month}</span>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded',
                      template.action_type === 'withdrawal' 
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-success/10 text-success'
                    )}>
                      {template.action_type}
                    </span>
                    {template.card_id && (
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {formatCardName(template.card_id)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div>
                    <p className={cn(
                      'text-sm font-semibold',
                      template.action_type === 'withdrawal' ? 'text-destructive' : 'text-success'
                    )}>
                      {template.action_type === 'withdrawal' ? '-' : '+'}
                      {formatCurrency(Number(template.default_amount), template.currency || 'ILS')}
                    </p>
                    {template.currency && template.currency !== 'ILS' && (
                      <p className="text-[10px] text-muted-foreground">
                        ≈ {formatCurrency(convertToILS(Number(template.default_amount), template.currency))}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleOpenEdit(template)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-secondary rounded transition-all"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => deleteRecurringSavings(template.id)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecurringSavingsPanel;
