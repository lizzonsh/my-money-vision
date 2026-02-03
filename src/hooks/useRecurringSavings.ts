import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type RecurringSavings = Tables<'recurring_savings'>;
export type RecurringSavingsInsert = TablesInsert<'recurring_savings'>;
export type RecurringSavingsUpdate = TablesUpdate<'recurring_savings'>;

export const useRecurringSavings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recurringSavings = [], isLoading, error } = useQuery({
    queryKey: ['recurring_savings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('recurring_savings')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as RecurringSavings[];
    },
    enabled: !!user,
  });

  const addRecurringSavings = useMutation({
    mutationFn: async (saving: Omit<RecurringSavingsInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('recurring_savings')
        .insert({ ...saving, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_savings'] });
      toast({ title: 'Recurring savings added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add recurring savings', description: error.message, variant: 'destructive' });
    },
  });

  const updateRecurringSavings = useMutation({
    mutationFn: async ({ id, ...updates }: RecurringSavingsUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('recurring_savings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_savings'] });
      toast({ title: 'Recurring savings updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update recurring savings', description: error.message, variant: 'destructive' });
    },
  });

  const deleteRecurringSavings = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_savings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_savings'] });
      toast({ title: 'Recurring savings deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete recurring savings', description: error.message, variant: 'destructive' });
    },
  });

  return {
    recurringSavings,
    isLoading,
    error,
    addRecurringSavings: addRecurringSavings.mutate,
    updateRecurringSavings: updateRecurringSavings.mutate,
    deleteRecurringSavings: deleteRecurringSavings.mutate,
  };
};
