
CREATE TABLE public.savings_plan_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('transfer', 'deposit', 'withdrawal', 'open_account', 'close_account')),
  target_month TEXT NOT NULL,
  from_account TEXT,
  to_account TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'ILS',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.savings_plan_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plan events" ON public.savings_plan_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own plan events" ON public.savings_plan_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plan events" ON public.savings_plan_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own plan events" ON public.savings_plan_events FOR DELETE USING (auth.uid() = user_id);
