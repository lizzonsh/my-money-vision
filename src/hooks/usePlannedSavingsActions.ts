import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PlannedSavingsAction {
  id: string;
  user_id: string;
  action_type: 'deposit' | 'withdrawal' | 'transfer';
  from_account: string | null;
  to_account: string | null;
  amount: number;
  currency: string;
  month: string;
  notes: string | null;
  is_executed: boolean;
  created_at: string;
  updated_at: string;
}

export type PlannedSavingsActionInsert = Omit<PlannedSavingsAction, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export const usePlannedSavingsActions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plannedActions = [], isLoading } = useQuery({
    queryKey: ['planned_savings_actions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('planned_savings_actions' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]) as PlannedSavingsAction[];
    },
    enabled: !!user,
  });

  const addAction = useMutation({
    mutationFn: async (action: PlannedSavingsActionInsert) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('planned_savings_actions' as any)
        .insert({ ...action, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_savings_actions'] });
      toast({ title: 'Planned action added' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add planned action', description: error.message, variant: 'destructive' });
    },
  });

  const updateAction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PlannedSavingsAction> & { id: string }) => {
      const { data, error } = await supabase
        .from('planned_savings_actions' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_savings_actions'] });
      toast({ title: 'Planned action updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update action', description: error.message, variant: 'destructive' });
    },
  });

  const deleteAction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('planned_savings_actions' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_savings_actions'] });
      toast({ title: 'Planned action removed' });
    },
    onError: (error) => {
      toast({ title: 'Failed to remove action', description: error.message, variant: 'destructive' });
    },
  });

  const markExecuted = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('planned_savings_actions' as any)
        .update({ is_executed: true } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned_savings_actions'] });
      toast({ title: 'Action marked as executed' });
    },
    onError: (error) => {
      toast({ title: 'Failed to mark action', description: error.message, variant: 'destructive' });
    },
  });

  return {
    plannedActions,
    isLoading,
    addAction: addAction.mutate,
    updateAction: updateAction.mutate,
    deleteAction: deleteAction.mutate,
    markExecuted: markExecuted.mutate,
  };
};
