 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { useToast } from '@/hooks/use-toast';
 
 export interface GoalItem {
   id: string;
   user_id: string;
   goal_id: string;
   name: string;
   estimated_cost: number;
   planned_month: string;
   payment_method: string;
   card_id: string | null;
   is_purchased: boolean;
   purchased_at: string | null;
   expense_id: string | null;
   notes: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export interface GoalItemInsert {
   goal_id: string;
   name: string;
   estimated_cost: number;
   planned_month: string;
   payment_method?: string;
   card_id?: string | null;
   notes?: string | null;
 }
 
 export interface GoalItemUpdate {
   id: string;
   name?: string;
   estimated_cost?: number;
   planned_month?: string;
   payment_method?: string;
   card_id?: string | null;
   is_purchased?: boolean;
   purchased_at?: string | null;
   expense_id?: string | null;
   notes?: string | null;
 }
 
 export const useGoalItems = (goalId?: string) => {
   const { user } = useAuth();
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   const { data: goalItems = [], isLoading, error } = useQuery({
     queryKey: ['goal_items', user?.id, goalId],
     queryFn: async () => {
       if (!user) return [];
       let query = supabase
         .from('goal_items')
         .select('*')
         .eq('user_id', user.id)
         .order('planned_month', { ascending: true });
       
       if (goalId) {
         query = query.eq('goal_id', goalId);
       }
       
       const { data, error } = await query;
       if (error) throw error;
       return data as GoalItem[];
     },
     enabled: !!user,
   });
 
   const addGoalItem = useMutation({
     mutationFn: async (item: GoalItemInsert) => {
       if (!user) throw new Error('Not authenticated');
       const { data, error } = await supabase
         .from('goal_items')
         .insert({ ...item, user_id: user.id })
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['goal_items'] });
       toast({ title: 'Item added to goal' });
     },
     onError: (error) => {
       toast({ title: 'Failed to add item', description: error.message, variant: 'destructive' });
     },
   });
 
   const updateGoalItem = useMutation({
     mutationFn: async ({ id, ...updates }: GoalItemUpdate) => {
       const { data, error } = await supabase
         .from('goal_items')
         .update(updates)
         .eq('id', id)
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['goal_items'] });
       toast({ title: 'Item updated' });
     },
     onError: (error) => {
       toast({ title: 'Failed to update item', description: error.message, variant: 'destructive' });
     },
   });
 
   const deleteGoalItem = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('goal_items')
         .delete()
         .eq('id', id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['goal_items'] });
       toast({ title: 'Item deleted' });
     },
     onError: (error) => {
       toast({ title: 'Failed to delete item', description: error.message, variant: 'destructive' });
     },
   });
 
   const markAsPurchased = useMutation({
     mutationFn: async ({ itemId, expenseId }: { itemId: string; expenseId?: string }) => {
       const { data, error } = await supabase
         .from('goal_items')
         .update({
           is_purchased: true,
           purchased_at: new Date().toISOString(),
           expense_id: expenseId || null,
         })
         .eq('id', itemId)
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['goal_items'] });
       toast({ title: 'Item marked as purchased' });
     },
     onError: (error) => {
       toast({ title: 'Failed to update item', description: error.message, variant: 'destructive' });
     },
   });
 
   const unmarkAsPurchased = useMutation({
     mutationFn: async (itemId: string) => {
       const { data, error } = await supabase
         .from('goal_items')
         .update({
           is_purchased: false,
           purchased_at: null,
           expense_id: null,
         })
         .eq('id', itemId)
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['goal_items'] });
       toast({ title: 'Item unmarked as purchased' });
     },
     onError: (error) => {
       toast({ title: 'Failed to update item', description: error.message, variant: 'destructive' });
     },
   });
 
   return {
     goalItems,
     isLoading,
     error,
     addGoalItem: addGoalItem.mutate,
     updateGoalItem: updateGoalItem.mutate,
     deleteGoalItem: deleteGoalItem.mutate,
     markAsPurchased: markAsPurchased.mutate,
     unmarkAsPurchased: unmarkAsPurchased.mutate,
   };
 };