
CREATE TABLE public.planned_savings_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('deposit', 'withdrawal', 'transfer')),
  from_account TEXT,
  to_account TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'ILS',
  month TEXT NOT NULL,
  notes TEXT,
  is_executed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.planned_savings_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own planned actions" ON public.planned_savings_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own planned actions" ON public.planned_savings_actions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own planned actions" ON public.planned_savings_actions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own planned actions" ON public.planned_savings_actions FOR DELETE USING (auth.uid() = user_id);
