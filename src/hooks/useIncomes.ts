import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Income = Tables<'incomes'>;
export type IncomeInsert = TablesInsert<'incomes'>;
export type IncomeUpdate = TablesUpdate<'incomes'>;

export const useIncomes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: incomes = [], isLoading, error } = useQuery({
    queryKey: ['incomes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('income_date', { ascending: false });
      
      if (error) throw error;
      return data as Income[];
    },
    enabled: !!user,
  });

  const addIncome = useMutation({
    mutationFn: async (income: Omit<IncomeInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('incomes')
        .insert({ ...income, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      toast({ title: 'Income added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add income', description: error.message, variant: 'destructive' });
    },
  });

  const updateIncome = useMutation({
    mutationFn: async ({ id, ...updates }: IncomeUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('incomes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      toast({ title: 'Income updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update income', description: error.message, variant: 'destructive' });
    },
  });

  const deleteIncome = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      toast({ title: 'Income deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete income', description: error.message, variant: 'destructive' });
    },
  });

  return {
    incomes,
    isLoading,
    error,
    addIncome: addIncome.mutate,
    updateIncome: updateIncome.mutate,
    deleteIncome: deleteIncome.mutate,
  };
};
