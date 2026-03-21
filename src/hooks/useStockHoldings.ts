import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface StockHolding {
  id: string;
  user_id: string;
  savings_name: string;
  ticker: string;
  name: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  currency: string;
  holding_type: 'stock' | 'provident_fund';
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export type StockHoldingInsert = Omit<StockHolding, 'id' | 'created_at' | 'updated_at' | 'user_id'>;

export const useStockHoldings = (savingsName?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ['stock-holdings', user?.id, savingsName],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('savings_stock_holdings' as any)
        .select('*')
        .eq('user_id', user.id);
      if (savingsName) {
        query = query.eq('savings_name', savingsName);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as StockHolding[];
    },
    enabled: !!user,
  });

  const addHolding = useMutation({
    mutationFn: async (holding: StockHoldingInsert) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('savings_stock_holdings' as any)
        .insert({ ...holding, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock-holdings'] });
      toast({ title: variables.holding_type === 'provident_fund' ? 'Provident fund added' : 'Stock added' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to add stock', description: error.message, variant: 'destructive' });
    },
  });

  const updateHolding = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StockHolding> & { id: string }) => {
      const { data, error } = await supabase
        .from('savings_stock_holdings' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-holdings'] });
      toast({ title: 'Stock updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update stock', description: error.message, variant: 'destructive' });
    },
  });

  const deleteHolding = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('savings_stock_holdings' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-holdings'] });
      toast({ title: 'Stock removed' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to remove stock', description: error.message, variant: 'destructive' });
    },
  });

  // Calculate totals
  const totalValue = holdings.reduce((sum, h) => sum + h.quantity * h.current_price, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.quantity * h.purchase_price, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return {
    holdings,
    isLoading,
    addHolding: addHolding.mutate,
    updateHolding: updateHolding.mutate,
    deleteHolding: deleteHolding.mutate,
    totalValue,
    totalCost,
    totalGain,
    totalGainPercent,
  };
};
