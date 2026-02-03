import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type BigPurchaseGoal = Tables<'big_purchase_goals'>;
export type BigPurchaseGoalInsert = TablesInsert<'big_purchase_goals'>;
export type BigPurchaseGoalUpdate = TablesUpdate<'big_purchase_goals'>;

export const useBigPurchases = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bigPurchases = [], isLoading, error } = useQuery({
    queryKey: ['big_purchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('big_purchase_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });
      
      if (error) throw error;
      return data as BigPurchaseGoal[];
    },
    enabled: !!user,
  });

  const addBigPurchase = useMutation({
    mutationFn: async (goal: Omit<BigPurchaseGoalInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('big_purchase_goals')
        .insert({ ...goal, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['big_purchases'] });
      toast({ title: 'Goal added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add goal', description: error.message, variant: 'destructive' });
    },
  });

  const updateBigPurchase = useMutation({
    mutationFn: async ({ id, ...updates }: BigPurchaseGoalUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('big_purchase_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['big_purchases'] });
      toast({ title: 'Goal updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update goal', description: error.message, variant: 'destructive' });
    },
  });

  const deleteBigPurchase = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('big_purchase_goals')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['big_purchases'] });
      toast({ title: 'Goal deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete goal', description: error.message, variant: 'destructive' });
    },
  });

  return {
    bigPurchases,
    isLoading,
    error,
    addBigPurchase: addBigPurchase.mutate,
    updateBigPurchase: updateBigPurchase.mutate,
    deleteBigPurchase: deleteBigPurchase.mutate,
  };
};
