import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ExpenseCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type ExpenseCategoryInsert = Omit<ExpenseCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// Default categories that are always available
export const DEFAULT_CATEGORIES = [
  { name: 'room', label: 'Room/Rent', color: 'hsl(var(--chart-1))' },
  { name: 'gifts', label: 'Gifts', color: 'hsl(var(--chart-2))' },
  { name: 'psychologist', label: 'Psychologist', color: 'hsl(var(--chart-3))' },
  { name: 'college', label: 'College', color: 'hsl(var(--chart-4))' },
  { name: 'vacation', label: 'Vacation', color: 'hsl(var(--chart-5))' },
  { name: 'debit_from_credit_card', label: 'Debit from Credit Card', color: 'hsl(var(--warning))' },
  { name: 'budget', label: 'Budget', color: 'hsl(var(--accent))' },
  { name: 'goal', label: 'Goal', color: 'hsl(var(--primary))' },
  { name: 'other', label: 'Other', color: 'hsl(var(--muted))' },
];

export const useExpenseCategories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customCategories = [], isLoading, error } = useQuery({
    queryKey: ['expense_categories', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as ExpenseCategory[];
    },
    enabled: !!user,
  });

  // Combine default and custom categories
  const allCategories = [
    ...DEFAULT_CATEGORIES.map(c => ({
      name: c.name,
      label: c.label,
      color: c.color,
      isDefault: true,
    })),
    ...customCategories.map(c => ({
      name: c.name,
      label: c.name.charAt(0).toUpperCase() + c.name.slice(1).replace(/_/g, ' '),
      color: c.color,
      isDefault: false,
      id: c.id,
    })),
  ];

  const addCategory = useMutation({
    mutationFn: async (category: ExpenseCategoryInsert) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('expense_categories')
        .insert({ ...category, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense_categories'] });
      toast({ title: 'Category added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add category', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense_categories'] });
      toast({ title: 'Category deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete category', description: error.message, variant: 'destructive' });
    },
  });

  return {
    categories: allCategories,
    customCategories,
    isLoading,
    error,
    addCategory: addCategory.mutate,
    deleteCategory: deleteCategory.mutate,
    isAddingCategory: addCategory.isPending,
  };
};
