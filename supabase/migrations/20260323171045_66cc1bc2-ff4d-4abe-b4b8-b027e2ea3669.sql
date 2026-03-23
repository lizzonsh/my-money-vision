
CREATE TABLE public.monthly_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  month character varying NOT NULL,
  page_type character varying NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, month, page_type)
);

ALTER TABLE public.monthly_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own monthly notes" ON public.monthly_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own monthly notes" ON public.monthly_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own monthly notes" ON public.monthly_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own monthly notes" ON public.monthly_notes FOR DELETE USING (auth.uid() = user_id);
