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
      toast({ title: 'Savings deleted successfully' });
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
  };
};
