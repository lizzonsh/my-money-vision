-- Add currency field to recurring_savings table
ALTER TABLE public.recurring_savings 
ADD COLUMN currency character varying DEFAULT 'ILS';