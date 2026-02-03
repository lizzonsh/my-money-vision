import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Savings = Tables<'savings'>;
export type SavingsInsert = TablesInsert<'savings'>;
export type SavingsUpdate = TablesUpdate<'savings'>;

export const useSavings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savings = [], isLoading, error } = useQuery({
    queryKey: ['savings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('savings')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: false });
      
      if (error) throw error;
      return data as Savings[];
    },
    enabled: !!user,
  });

  const addSavings = useMutation({
    mutationFn: async (saving: Omit<SavingsInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('savings')
        .insert({ ...saving, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      toast({ title: 'Savings added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add savings', description: error.message, variant: 'destructive' });
    },
  });

  const updateSavings = useMutation({
    mutationFn: async ({ id, ...updates }: SavingsUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('savings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      toast({ title: 'Savings updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update savings', description: error.message, variant: 'destructive' });
    },
  });

  // Soft delete - marks the account as closed from a specific month forward
  const closeSavingsAccount = useMutation({
    mutationFn: async ({ name, fromMonth }: { name: string; fromMonth: string }) => {
      if (!user) throw new Error('Not authenticated');
      // Set closed_at to the first day of the selected month
      // This means it will be hidden from this month forward, but visible in previous months
      const closedDate = new Date(fromMonth + '-01T00:00:00.000Z').toISOString();
      const { error } = await supabase
        .from('savings')
        .update({ closed_at: closedDate })
        .eq('user_id', user.id)
        .eq('name', name);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      toast({ title: 'Savings account closed', description: 'Historical data has been preserved for previous months' });
    },
    onError: (error) => {
      toast({ title: 'Failed to close account', description: error.message, variant: 'destructive' });
    },
  });

  // Hard delete - only for specific records (used internally)
  const deleteSavings = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('savings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      toast({ title: 'Savings record deleted' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete savings', description: error.message, variant: 'destructive' });
    },
  });

  return {
    savings,
    isLoading,
    error,
    addSavings: addSavings.mutate,
    updateSavings: updateSavings.mutate,
    deleteSavings: deleteSavings.mutate,
    closeSavingsAccount: closeSavingsAccount.mutate,
  };
};
