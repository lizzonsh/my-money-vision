-- Create goal items table for tracking individual purchases within a goal
CREATE TABLE public.goal_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.big_purchase_goals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  estimated_cost NUMERIC NOT NULL DEFAULT 0,
  planned_month TEXT NOT NULL, -- YYYY-MM format
  payment_method TEXT NOT NULL DEFAULT 'credit_card', -- 'credit_card' or 'bank_transfer'
  card_id TEXT, -- e.g., 'fly-card', 'visa', 'hever'
  is_purchased BOOLEAN NOT NULL DEFAULT false,
  purchased_at TIMESTAMPTZ,
  expense_id UUID, -- Links to the expense created when purchased
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goal_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own goal items"
  ON public.goal_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goal items"
  ON public.goal_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goal items"
  ON public.goal_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goal items"
  ON public.goal_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_goal_items_updated_at
  BEFORE UPDATE ON public.goal_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();