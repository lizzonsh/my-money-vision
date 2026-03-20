
-- Add risk_level column to savings table
ALTER TABLE public.savings ADD COLUMN risk_level text DEFAULT 'medium';

-- Create stock holdings table for savings accounts
CREATE TABLE public.savings_stock_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  savings_name text NOT NULL,
  ticker text NOT NULL,
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  purchase_price numeric NOT NULL DEFAULT 0,
  current_price numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'ILS',
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.savings_stock_holdings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own stock holdings" ON public.savings_stock_holdings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own stock holdings" ON public.savings_stock_holdings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stock holdings" ON public.savings_stock_holdings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stock holdings" ON public.savings_stock_holdings FOR DELETE USING (auth.uid() = user_id);
