-- Create bank balance history table
CREATE TABLE public.bank_balance_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  month VARCHAR NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bank_account_id, month)
);

-- Enable RLS
ALTER TABLE public.bank_balance_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own balance history"
ON public.bank_balance_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own balance history"
ON public.bank_balance_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own balance history"
ON public.bank_balance_history FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own balance history"
ON public.bank_balance_history FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_bank_balance_history_updated_at
BEFORE UPDATE ON public.bank_balance_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();