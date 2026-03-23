import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useMonthlyNotes = (month: string, pageType: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: note, isLoading } = useQuery({
    queryKey: ['monthly_notes', user?.id, month, pageType],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('monthly_notes' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('page_type', pageType)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; content: string } | null;
    },
    enabled: !!user && !!month,
  });

  const upsertNote = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('monthly_notes' as any)
        .upsert(
          { user_id: user.id, month, page_type: pageType, content, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,month,page_type' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly_notes', user?.id, month, pageType] });
    },
  });

  return { note: note?.content || '', isLoading, saveNote: upsertNote.mutate, isSaving: upsertNote.isPending };
};
