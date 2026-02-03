import { useState } from 'react';
import { useFinance, RecurringPayment } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { getCurrentMonth } from '@/lib/dateUtils';
import { Plus, Trash2, Pencil, Repeat, Play, Pause } from 'lucide-react';
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

const RecurringPaymentsPanel = () => {
  const { 
    recurringPayments, 
    addRecurringPayment, 
    updateRecurringPayment, 
    deleteRecurringPayment,
    addExpense,
    currentMonth,
  } = useFinance();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<RecurringPayment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    defaultAmount: '',
    category: 'other',
    paymentMethod: 'bank_transfer',
    cardId: '',
    dayOfMonth: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      defaultAmount: '',
      category: 'other',
      paymentMethod: 'bank_transfer',
      cardId: '',
      dayOfMonth: '',
      notes: '',
    });
    setEditingPayment(null);
  };

  const handleOpenEdit = (payment: RecurringPayment) => {
    setEditingPayment(payment);
    setFormData({
      name: payment.name,
      defaultAmount: payment.default_amount.toString(),
      category: payment.category,
      paymentMethod: payment.payment_method,
      cardId: payment.card_id || '',
      dayOfMonth: payment.day_of_month.toString(),
      notes: payment.notes || '',
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dayOfMonth = parseInt(formData.dayOfMonth) || 1;
    const paymentData = {
      name: formData.name,
      default_amount: parseFloat(formData.defaultAmount),
      category: formData.category,
      payment_method: formData.paymentMethod as 'bank_transfer' | 'credit_card',
      card_id: formData.cardId || null,
      day_of_month: dayOfMonth,
      is_active: true,
      notes: formData.notes || null,
    };

    if (editingPayment) {
      updateRecurringPayment({ id: editingPayment.id, ...paymentData });
    } else {
      addRecurringPayment(paymentData);
      
      // Automatically add an expense for the current month
      const [year, month] = currentMonth.split('-').map(Number);
      const expenseDate = `${year}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
      
      addExpense({
        description: formData.name,
        amount: parseFloat(formData.defaultAmount),
        category: formData.category,
        payment_method: formData.paymentMethod as 'bank_transfer' | 'credit_card',
        card_id: formData.cardId || null,
        expense_date: expenseDate,
        month: currentMonth,
        kind: 'planned',
        expense_month: null,
        month_of_expense: null,
        recurring_day_of_month: dayOfMonth,
        recurring_type: 'monthly',
      });
    }
    resetForm();
    setIsOpen(false);
  };

  const toggleActive = (payment: RecurringPayment) => {
    updateRecurringPayment({ id: payment.id, is_active: !payment.is_active });
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

  const totalMonthly = recurringPayments
    .filter(p => p.is_active)
    .reduce((sum, p) => sum + Number(p.default_amount), 0);

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Repeat className="h-4 w-4 text-primary" />
            Recurring Payments
          </h3>
          <p className="text-lg font-bold">{formatCurrency(totalMonthly)}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
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
              <DialogTitle>{editingPayment ? 'Edit Recurring Payment' : 'Add Recurring Payment'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Spotify, Gym"
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
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="room">Room/Rent</SelectItem>
                      <SelectItem value="psychologist">Psychologist</SelectItem>
                      <SelectItem value="college">Education</SelectItem>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.paymentMethod === 'credit_card' && (
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
                {editingPayment ? 'Save Changes' : 'Add Payment'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {recurringPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recurring payments set up
          </p>
        ) : (
          recurringPayments.map((payment) => (
            <div
              key={payment.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg transition-colors group',
                payment.is_active 
                  ? 'bg-secondary/30 hover:bg-secondary/50' 
                  : 'bg-muted/20 opacity-60'
              )}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleActive(payment)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    payment.is_active 
                      ? 'bg-success/20 text-success' 
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {payment.is_active ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
                <div>
                  <p className="text-sm font-medium">{payment.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Day {payment.day_of_month}</span>
                    {payment.card_id && (
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {formatCardName(payment.card_id)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(Number(payment.default_amount))}</p>
                </div>
                <button
                  onClick={() => handleOpenEdit(payment)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-secondary rounded transition-all"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => deleteRecurringPayment(payment.id)}
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

export default RecurringPaymentsPanel;
