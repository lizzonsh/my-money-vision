import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface BankBalanceHistory {
  id: string;
  user_id: string;
  bank_account_id: string;
  month: string;
  balance: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type BankBalanceHistoryInsert = Omit<BankBalanceHistory, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export const useBankBalanceHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: balanceHistory = [], isLoading, error } = useQuery({
    queryKey: ['bank_balance_history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('bank_balance_history')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: false });
      
      if (error) throw error;
      return data as BankBalanceHistory[];
    },
    enabled: !!user,
  });

  const upsertBalanceHistory = useMutation({
    mutationFn: async (entry: BankBalanceHistoryInsert) => {
      if (!user) throw new Error('Not authenticated');
      
      // Check if entry exists for this account and month
      const { data: existing } = await supabase
        .from('bank_balance_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('bank_account_id', entry.bank_account_id)
        .eq('month', entry.month)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('bank_balance_history')
          .update({ balance: entry.balance, notes: entry.notes })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('bank_balance_history')
          .insert({ ...entry, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank_balance_history'] });
      toast({ title: 'Balance history saved' });
    },
    onError: (error) => {
      toast({ title: 'Failed to save balance history', description: error.message, variant: 'destructive' });
    },
  });

  const deleteBalanceHistory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bank_balance_history')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank_balance_history'] });
      toast({ title: 'Balance history deleted' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete balance history', description: error.message, variant: 'destructive' });
    },
  });

  // Get balance for a specific account and month, falling back to previous months
  const getBalanceForMonth = (bankAccountId: string, month: string) => {
    const exact = balanceHistory.find(h => h.bank_account_id === bankAccountId && h.month === month);
    if (exact) return exact;
    
    // Fall back to the most recent previous month's entry
    const previous = balanceHistory
      .filter(h => h.bank_account_id === bankAccountId && h.month < month)
      .sort((a, b) => b.month.localeCompare(a.month));
    return previous.length > 0 ? previous[0] : undefined;
  };

  // Get total balance across all accounts for a specific month
  const getTotalBalanceForMonth = (bankAccountIds: string[], month: string) => {
    return bankAccountIds.reduce((total, accountId) => {
      const history = getBalanceForMonth(accountId, month);
      return total + (history?.balance || 0);
    }, 0);
  };

  return {
    balanceHistory,
    isLoading,
    error,
    upsertBalanceHistory: upsertBalanceHistory.mutate,
    deleteBalanceHistory: deleteBalanceHistory.mutate,
    getBalanceForMonth,
    getTotalBalanceForMonth,
  };
};
