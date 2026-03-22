import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface SavingsPlanEvent {
  id: string;
  user_id: string;
  event_type: 'transfer' | 'deposit' | 'withdrawal' | 'open_account' | 'close_account';
  target_month: string;
  from_account: string | null;
  to_account: string | null;
  amount: number;
  currency: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type SavingsPlanEventInsert = Omit<SavingsPlanEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export const useSavingsPlanEvents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: planEvents = [], isLoading } = useQuery({
    queryKey: ['savings_plan_events', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('savings_plan_events' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('target_month', { ascending: true });
      if (error) throw error;
      return (data as any[]) as SavingsPlanEvent[];
    },
    enabled: !!user,
  });

  const addEvent = useMutation({
    mutationFn: async (event: SavingsPlanEventInsert) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('savings_plan_events' as any)
        .insert({ ...event, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_plan_events'] });
      toast({ title: 'Plan event added' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add event', description: error.message, variant: 'destructive' });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SavingsPlanEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from('savings_plan_events' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_plan_events'] });
      toast({ title: 'Plan event updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update event', description: error.message, variant: 'destructive' });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('savings_plan_events' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_plan_events'] });
      toast({ title: 'Plan event removed' });
    },
    onError: (error) => {
      toast({ title: 'Failed to remove event', description: error.message, variant: 'destructive' });
    },
  });

  return {
    planEvents,
    isLoading,
    addEvent: addEvent.mutate,
    updateEvent: updateEvent.mutate,
    deleteEvent: deleteEvent.mutate,
  };
};
