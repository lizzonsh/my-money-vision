import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type RecurringIncome = Tables<'recurring_incomes'>;
export type RecurringIncomeInsert = TablesInsert<'recurring_incomes'>;
export type RecurringIncomeUpdate = TablesUpdate<'recurring_incomes'>;

export const useRecurringIncomes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recurringIncomes = [], isLoading, error } = useQuery({
    queryKey: ['recurring_incomes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('recurring_incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as RecurringIncome[];
    },
    enabled: !!user,
  });

  const addRecurringIncome = useMutation({
    mutationFn: async (income: Omit<RecurringIncomeInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('recurring_incomes')
        .insert({ ...income, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_incomes'] });
      toast({ title: 'Recurring income added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add recurring income', description: error.message, variant: 'destructive' });
    },
  });

  const updateRecurringIncome = useMutation({
    mutationFn: async ({ id, ...updates }: RecurringIncomeUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('recurring_incomes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_incomes'] });
      toast({ title: 'Recurring income updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update recurring income', description: error.message, variant: 'destructive' });
    },
  });

  const deleteRecurringIncome = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_incomes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_incomes'] });
      toast({ title: 'Recurring income deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete recurring income', description: error.message, variant: 'destructive' });
    },
  });

  return {
    recurringIncomes,
    isLoading,
    error,
    addRecurringIncome: addRecurringIncome.mutate,
    updateRecurringIncome: updateRecurringIncome.mutate,
    deleteRecurringIncome: deleteRecurringIncome.mutate,
  };
};
