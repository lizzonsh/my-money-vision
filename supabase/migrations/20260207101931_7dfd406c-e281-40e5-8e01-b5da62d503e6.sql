-- Create a table for user-reported bugs/issues
CREATE TABLE public.user_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_issues ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own issues" 
ON public.user_issues 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own issues" 
ON public.user_issues 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own issues" 
ON public.user_issues 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own issues" 
ON public.user_issues 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_issues_updated_at
BEFORE UPDATE ON public.user_issues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();