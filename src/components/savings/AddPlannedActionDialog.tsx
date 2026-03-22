import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { SUPPORTED_CURRENCIES } from '@/lib/currencyUtils';
import type { PlannedSavingsActionInsert } from '@/hooks/usePlannedSavingsActions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountNames: string[];
  currentMonth: string;
  onSubmit: (action: PlannedSavingsActionInsert) => void;
  defaultFromAccount?: string;
}

const AddPlannedActionDialog = ({ open, onOpenChange, accountNames, currentMonth, onSubmit, defaultFromAccount }: Props) => {
  const [actionType, setActionType] = useState<'deposit' | 'withdrawal' | 'transfer'>('transfer');
  const [fromAccount, setFromAccount] = useState(defaultFromAccount || '');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ILS');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setActionType('transfer');
    setFromAccount(defaultFromAccount || '');
    setToAccount('');
    setAmount('');
    setCurrency('ILS');
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      action_type: actionType,
      from_account: actionType === 'deposit' ? null : fromAccount || null,
      to_account: actionType === 'withdrawal' ? null : toAccount || null,
      amount: parseFloat(amount),
      currency,
      month: currentMonth,
      notes: notes || null,
      is_executed: false,
    });
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="glass max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Plan Savings Action</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Action Type</Label>
            <Select value={actionType} onValueChange={(v) => setActionType(v as any)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="transfer">🔄 Transfer between accounts</SelectItem>
                <SelectItem value="deposit">📥 Planned deposit</SelectItem>
                <SelectItem value="withdrawal">📤 Planned withdrawal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(actionType === 'withdrawal' || actionType === 'transfer') && (
            <div className="space-y-1.5">
              <Label className="text-xs">From Account</Label>
              <Select value={fromAccount} onValueChange={setFromAccount}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accountNames.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(actionType === 'deposit' || actionType === 'transfer') && (
            <div className="space-y-1.5">
              <Label className="text-xs">To Account</Label>
              <Select value={toAccount} onValueChange={setToAccount}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accountNames.filter(n => n !== fromAccount).map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

          <div className="space-y-1.5">
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Moving to higher risk fund" className="text-xs min-h-[60px]" />
          </div>

          <Button type="submit" size="sm" className="w-full text-xs">Add Planned Action</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlannedActionDialog;
