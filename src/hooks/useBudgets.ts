import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Budget = Tables<'budgets'>;
export type BudgetInsert = TablesInsert<'budgets'>;
export type BudgetUpdate = TablesUpdate<'budgets'>;

export const useBudgets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading, error } = useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: false });
      
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user,
  });

  const addBudget = useMutation({
    mutationFn: async (budget: Omit<BudgetInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('budgets')
        .insert({ ...budget, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add budget', description: error.message, variant: 'destructive' });
    },
  });

  const updateBudget = useMutation({
    mutationFn: async ({ id, ...updates }: BudgetUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update budget', description: error.message, variant: 'destructive' });
    },
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete budget', description: error.message, variant: 'destructive' });
    },
  });

  const getBudgetForMonth = (month: string) => {
    return budgets.find(b => b.month === month);
  };

  return {
    budgets,
    isLoading,
    error,
    addBudget: addBudget.mutate,
    updateBudget: updateBudget.mutate,
    deleteBudget: deleteBudget.mutate,
    getBudgetForMonth,
  };
};
