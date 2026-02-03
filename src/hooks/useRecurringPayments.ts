import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type RecurringPayment = Tables<'recurring_payments'>;
export type RecurringPaymentInsert = TablesInsert<'recurring_payments'>;
export type RecurringPaymentUpdate = TablesUpdate<'recurring_payments'>;

export const useRecurringPayments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recurringPayments = [], isLoading, error } = useQuery({
    queryKey: ['recurring_payments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('recurring_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as RecurringPayment[];
    },
    enabled: !!user,
  });

  const addRecurringPayment = useMutation({
    mutationFn: async (payment: Omit<RecurringPaymentInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('recurring_payments')
        .insert({ ...payment, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_payments'] });
      toast({ title: 'Recurring payment added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add recurring payment', description: error.message, variant: 'destructive' });
    },
  });

  const updateRecurringPayment = useMutation({
    mutationFn: async ({ id, ...updates }: RecurringPaymentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('recurring_payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_payments'] });
      toast({ title: 'Recurring payment updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update recurring payment', description: error.message, variant: 'destructive' });
    },
  });

  const deleteRecurringPayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_payments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_payments'] });
      toast({ title: 'Recurring payment deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete recurring payment', description: error.message, variant: 'destructive' });
    },
  });

  return {
    recurringPayments,
    isLoading,
    error,
    addRecurringPayment: addRecurringPayment.mutate,
    updateRecurringPayment: updateRecurringPayment.mutate,
    deleteRecurringPayment: deleteRecurringPayment.mutate,
  };
};
