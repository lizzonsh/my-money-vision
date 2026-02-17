import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface IssueComment {
  id: string;
  issue_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export const useIssueComments = (issueId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['issue-comments', issueId],
    queryFn: async () => {
      if (!issueId || !user?.id) return [];
      const { data, error } = await supabase
        .from('issue_comments')
        .select('*')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as IssueComment[];
    },
    enabled: !!issueId && !!user?.id,
  });

  const addComment = useMutation({
    mutationFn: async ({ issueId, content }: { issueId: string; content: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('issue_comments')
        .insert({ issue_id: issueId, user_id: user.id, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issue-comments', variables.issueId] });
      queryClient.invalidateQueries({ queryKey: ['issue-comments-count'] });
    },
    onError: (error) => {
      toast({ title: 'Failed to add comment', description: error.message, variant: 'destructive' });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('issue_comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue-comments', issueId] });
      queryClient.invalidateQueries({ queryKey: ['issue-comments-count'] });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete comment', description: error.message, variant: 'destructive' });
    },
  });

  return {
    comments,
    isLoading,
    addComment: addComment.mutate,
    deleteComment: deleteComment.mutate,
  };
};

export const useIssueCommentCounts = (issueIds: string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['issue-comments-count', issueIds],
    queryFn: async () => {
      if (!user?.id || issueIds.length === 0) return {};
      const { data, error } = await supabase
        .from('issue_comments')
        .select('issue_id')
        .in('issue_id', issueIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((c) => {
        counts[c.issue_id] = (counts[c.issue_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user?.id && issueIds.length > 0,
  });
};
