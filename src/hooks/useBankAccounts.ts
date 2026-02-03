import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type BankAccount = Tables<'bank_accounts'>;
export type BankAccountInsert = TablesInsert<'bank_accounts'>;
export type BankAccountUpdate = TablesUpdate<'bank_accounts'>;

export const useBankAccounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bankAccounts = [], isLoading, error } = useQuery({
    queryKey: ['bank_accounts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as BankAccount[];
    },
    enabled: !!user,
  });

  const addBankAccount = useMutation({
    mutationFn: async (account: Omit<BankAccountInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({ ...account, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank_accounts'] });
      toast({ title: 'Bank account added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add bank account', description: error.message, variant: 'destructive' });
    },
  });

  const updateBankAccount = useMutation({
    mutationFn: async ({ id, ...updates }: BankAccountUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank_accounts'] });
      toast({ title: 'Bank account updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update bank account', description: error.message, variant: 'destructive' });
    },
  });

  const deleteBankAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank_accounts'] });
      toast({ title: 'Bank account deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete bank account', description: error.message, variant: 'destructive' });
    },
  });

  // Get total balance across all accounts
  const totalBalance = bankAccounts.reduce((sum, account) => sum + Number(account.current_balance), 0);

  return {
    bankAccounts,
    isLoading,
    error,
    totalBalance,
    addBankAccount: addBankAccount.mutate,
    updateBankAccount: updateBankAccount.mutate,
    deleteBankAccount: deleteBankAccount.mutate,
  };
};
