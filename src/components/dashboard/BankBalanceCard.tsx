import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const BankBalanceCard = () => {
  const { bankAccounts, totalBankBalance, addBankAccount, updateBankAccount, deleteBankAccount } = useFinance();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<{ id: string; name: string; balance: string } | null>(null);
  const [newAccount, setNewAccount] = useState({ name: '', balance: '' });

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    addBankAccount({
      name: newAccount.name,
      current_balance: parseFloat(newAccount.balance) || 0,
      currency: 'ILS',
      last_updated: new Date().toISOString(),
    });
    setNewAccount({ name: '', balance: '' });
    setIsAddOpen(false);
  };

  const handleUpdateBalance = (id: string, balance: string) => {
    updateBankAccount({
      id,
      current_balance: parseFloat(balance) || 0,
      last_updated: new Date().toISOString(),
    });
    setEditingAccount(null);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="glass rounded-lg px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Bank Balance</p>
            <p className="font-semibold">{formatCurrency(totalBankBalance)}</p>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Bank Accounts</h4>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="glass">
                <DialogHeader>
                  <DialogTitle>Add Bank Account</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddAccount} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Account Name</Label>
                    <Input
                      id="name"
                      value={newAccount.name}
                      onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                      placeholder="e.g., Main Account"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="balance">Current Balance (₪)</Label>
                    <Input
                      id="balance"
                      type="number"
                      value={newAccount.balance}
                      onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">Add Account</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {bankAccounts.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              No bank accounts yet
            </p>
          ) : (
            <div className="divide-y">
              {bankAccounts.map((account) => (
                <div key={account.id} className="p-3 flex items-center justify-between group">
                  {editingAccount?.id === account.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        type="number"
                        value={editingAccount.balance}
                        onChange={(e) => setEditingAccount({ ...editingAccount, balance: e.target.value })}
                        className="h-8"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateBalance(account.id, editingAccount.balance);
                          if (e.key === 'Escape') setEditingAccount(null);
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-8"
                        onClick={() => handleUpdateBalance(account.id, editingAccount.balance)}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-medium">{account.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(account.current_balance)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingAccount({
                            id: account.id,
                            name: account.name,
                            balance: account.current_balance.toString(),
                          })}
                          className="p-1.5 hover:bg-secondary rounded"
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => deleteBankAccount(account.id)}
                          className="p-1.5 hover:bg-destructive/10 rounded"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total</span>
            <span className="font-bold">{formatCurrency(totalBankBalance)}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default BankBalanceCard;
