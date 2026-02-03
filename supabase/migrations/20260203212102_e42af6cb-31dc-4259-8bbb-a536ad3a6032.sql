-- Add optional end_date column to recurring_payments
ALTER TABLE public.recurring_payments
ADD COLUMN end_date date NULL;

-- Add optional end_date column to recurring_incomes
ALTER TABLE public.recurring_incomes
ADD COLUMN end_date date NULL;

-- Add optional end_date column to recurring_savings
ALTER TABLE public.recurring_savings
ADD COLUMN end_date date NULL;