import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { Plus, Trash2, Pencil, Repeat, Play, Pause, TrendingUp, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { RecurringSavingsTemplate } from '@/types/finance';

const RecurringSavingsPanel = () => {
  const { 
    recurringSavings, 
    addRecurringSavings, 
    updateRecurringSavings, 
    deleteRecurringSavings,
    createSavingsFromRecurring 
  } = useFinance();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringSavingsTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    defaultAmount: '',
    actionType: 'deposit',
    transferMethod: 'bank_account',
    cardId: '',
    dayOfMonth: '',
    notes: '',
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
    });
    setEditingTemplate(null);
  };

  const handleOpenEdit = (template: RecurringSavingsTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      defaultAmount: template.defaultAmount.toString(),
      actionType: template.actionType,
      transferMethod: template.transferMethod,
      cardId: template.cardId || '',
      dayOfMonth: template.dayOfMonth.toString(),
      notes: template.notes || '',
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const templateData = {
      name: formData.name,
      defaultAmount: parseFloat(formData.defaultAmount),
      actionType: formData.actionType as 'deposit' | 'withdrawal',
      transferMethod: formData.transferMethod as 'bank_account' | 'credit_card',
      cardId: formData.cardId || undefined,
      dayOfMonth: parseInt(formData.dayOfMonth) || 1,
      isActive: true,
      notes: formData.notes || undefined,
    };

    if (editingTemplate) {
      updateRecurringSavings(editingTemplate._id, templateData);
    } else {
      addRecurringSavings(templateData);
    }
    resetForm();
    setIsOpen(false);
  };

  const toggleActive = (template: RecurringSavingsTemplate) => {
    updateRecurringSavings(template._id, { isActive: !template.isActive });
  };

  const formatCardName = (cardId?: string) => {
    if (!cardId) return '';
    const cardNames: Record<string, string> = {
      'fly-card': 'Fly Card',
      'hever': 'Hever',
      'visa': 'Visa',
    };
    return cardNames[cardId] || cardId;
  };

  const totalMonthlyDeposits = recurringSavings
    .filter(t => t.isActive && t.actionType === 'deposit')
    .reduce((sum, t) => sum + t.defaultAmount, 0);

  const totalMonthlyWithdrawals = recurringSavings
    .filter(t => t.isActive && t.actionType === 'withdrawal')
    .reduce((sum, t) => sum + t.defaultAmount, 0);

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
                  <Label htmlFor="defaultAmount">Default Amount (₪)</Label>
                  <Input
                    id="defaultAmount"
                    type="number"
                    value={formData.defaultAmount}
                    onChange={(e) => setFormData({ ...formData, defaultAmount: e.target.value })}
                    placeholder="0"
                    required
                  />
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
              key={template._id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg transition-colors group',
                !template.isActive 
                  ? 'bg-muted/20 opacity-60'
                  : template.actionType === 'withdrawal'
                    ? 'bg-destructive/10 hover:bg-destructive/15'
                    : 'bg-secondary/30 hover:bg-secondary/50'
              )}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleActive(template)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    !template.isActive 
                      ? 'bg-muted text-muted-foreground'
                      : template.actionType === 'withdrawal'
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-success/20 text-success'
                  )}
                >
                  {template.isActive ? (
                    template.actionType === 'withdrawal' ? (
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
                    <span>Day {template.dayOfMonth}</span>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded',
                      template.actionType === 'withdrawal' 
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-success/10 text-success'
                    )}>
                      {template.actionType}
                    </span>
                    {template.cardId && (
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {formatCardName(template.cardId)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className={cn(
                    'text-sm font-semibold',
                    template.actionType === 'withdrawal' ? 'text-destructive' : 'text-success'
                  )}>
                    {template.actionType === 'withdrawal' ? '-' : '+'}{formatCurrency(template.defaultAmount)}
                  </p>
                </div>
                <button
                  onClick={() => createSavingsFromRecurring(template._id)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-primary/10 rounded transition-all"
                  title="Add to this month's savings"
                >
                  <Plus className="h-4 w-4 text-primary" />
                </button>
                <button
                  onClick={() => handleOpenEdit(template)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-secondary rounded transition-all"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => deleteRecurringSavings(template._id)}
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
