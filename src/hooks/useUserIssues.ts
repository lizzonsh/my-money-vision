import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserIssue {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export type UserIssueInsert = Omit<UserIssue, 'id' | 'created_at' | 'updated_at'>;
export type UserIssueUpdate = Partial<Omit<UserIssue, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export const useUserIssues = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: issues = [], isLoading, error } = useQuery({
    queryKey: ['user-issues', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_issues')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserIssue[];
    },
    enabled: !!user?.id,
  });

  const addIssue = useMutation({
    mutationFn: async (issue: Omit<UserIssueInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('user_issues')
        .insert({ ...issue, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-issues'] });
      toast({ title: 'Issue reported successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to report issue', description: error.message, variant: 'destructive' });
    },
  });

  const updateIssue = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & UserIssueUpdate) => {
      const { data, error } = await supabase
        .from('user_issues')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-issues'] });
      toast({ title: 'Issue updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update issue', description: error.message, variant: 'destructive' });
    },
  });

  const deleteIssue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_issues')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-issues'] });
      toast({ title: 'Issue deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete issue', description: error.message, variant: 'destructive' });
    },
  });

  return {
    issues,
    isLoading,
    error,
    addIssue: addIssue.mutate,
    updateIssue: updateIssue.mutate,
    deleteIssue: deleteIssue.mutate,
  };
};
