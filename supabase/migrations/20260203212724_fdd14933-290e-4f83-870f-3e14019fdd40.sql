-- Add closed_at column to savings table for soft delete functionality
-- When set, the account is considered closed from that date forward
ALTER TABLE public.savings
ADD COLUMN closed_at timestamp with time zone NULL;