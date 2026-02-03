-- =============================================
-- FINANCE TRACKER DATABASE SCHEMA
-- Migrated from MongoDB to Supabase/PostgreSQL
-- =============================================

-- 1. CREATE ENUMS
-- =============================================

-- Expense kind enum
CREATE TYPE public.expense_kind AS ENUM ('planned', 'payed', 'predicted');

-- Payment method enum
CREATE TYPE public.payment_method AS ENUM ('bank_transfer', 'credit_card');

-- Recurring type enum
CREATE TYPE public.recurring_type AS ENUM ('monthly', 'weekly');

-- Savings action type enum
CREATE TYPE public.savings_action AS ENUM ('deposit', 'withdrawal');

-- Transfer method enum
CREATE TYPE public.transfer_method AS ENUM ('bank_account', 'credit_card');

-- Priority enum
CREATE TYPE public.priority_level AS ENUM ('high', 'medium', 'low');

-- Big purchase category enum
CREATE TYPE public.purchase_category AS ENUM ('furniture', 'electronics', 'education', 'vehicle', 'property', 'vacation', 'other');

-- 2. CREATE TABLES
-- =============================================

-- Budgets table (monthly budget settings)
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  total_budget NUMERIC(12,2) NOT NULL,
  spent_budget NUMERIC(12,2) DEFAULT 0,
  left_budget NUMERIC(12,2),
  days_in_month INTEGER,
  daily_limit NUMERIC(12,2),
  currency VARCHAR(3) DEFAULT 'ILS',
  status VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  amount NUMERIC(12,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  kind expense_kind NOT NULL DEFAULT 'payed',
  recurring_type recurring_type,
  recurring_day_of_month INTEGER,
  payment_method payment_method NOT NULL,
  card_id VARCHAR(50),
  description TEXT NOT NULL,
  expense_month VARCHAR(7), -- For debit tracking
  month_of_expense VARCHAR(7), -- Legacy field
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Incomes table
CREATE TABLE public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  income_date DATE,
  amount NUMERIC(12,2) NOT NULL,
  name VARCHAR(100) NOT NULL, -- work, bit, mom, bonus, etc.
  description TEXT,
  recurring_type recurring_type,
  recurring_day_of_month INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Savings accounts table
CREATE TABLE public.savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  name VARCHAR(100) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ILS',
  transfer_method transfer_method NOT NULL,
  card_id VARCHAR(50),
  action savings_action,
  action_amount NUMERIC(12,2),
  recurring_type recurring_type,
  recurring_day_of_month INTEGER,
  monthly_deposit NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Savings growth history table
CREATE TABLE public.savings_growth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  savings_id UUID NOT NULL REFERENCES public.savings(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  value_after_growth NUMERIC(12,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bank accounts table
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ILS',
  current_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Big purchase goals table
CREATE TABLE public.big_purchase_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL,
  current_saved NUMERIC(12,2) NOT NULL DEFAULT 0,
  monthly_contribution NUMERIC(12,2) NOT NULL,
  target_date VARCHAR(7), -- Format: YYYY-MM
  priority priority_level NOT NULL DEFAULT 'medium',
  category purchase_category NOT NULL DEFAULT 'other',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recurring payments templates table
CREATE TABLE public.recurring_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  default_amount NUMERIC(12,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  payment_method payment_method NOT NULL,
  card_id VARCHAR(50),
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recurring savings templates table
CREATE TABLE public.recurring_savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  default_amount NUMERIC(12,2) NOT NULL,
  action_type savings_action NOT NULL,
  transfer_method transfer_method NOT NULL,
  card_id VARCHAR(50),
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recurring income templates table
CREATE TABLE public.recurring_incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  default_amount NUMERIC(12,2) NOT NULL,
  source VARCHAR(100) NOT NULL, -- work, bit, mom, other
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_budgets_user_month ON public.budgets(user_id, month);
CREATE INDEX idx_expenses_user_month ON public.expenses(user_id, month);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX idx_incomes_user_month ON public.incomes(user_id, month);
CREATE INDEX idx_savings_user_month ON public.savings(user_id, month);
CREATE INDEX idx_savings_growth_savings ON public.savings_growth(savings_id);
CREATE INDEX idx_big_purchase_goals_user ON public.big_purchase_goals(user_id);

-- 4. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_growth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.big_purchase_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_incomes ENABLE ROW LEVEL SECURITY;

-- 5. CREATE RLS POLICIES (Users can only access their own data)
-- =============================================

-- Budgets policies
CREATE POLICY "Users can view their own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- Expenses policies
CREATE POLICY "Users can view their own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- Incomes policies
CREATE POLICY "Users can view their own incomes" ON public.incomes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own incomes" ON public.incomes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own incomes" ON public.incomes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own incomes" ON public.incomes FOR DELETE USING (auth.uid() = user_id);

-- Savings policies
CREATE POLICY "Users can view their own savings" ON public.savings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own savings" ON public.savings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own savings" ON public.savings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own savings" ON public.savings FOR DELETE USING (auth.uid() = user_id);

-- Savings growth policies
CREATE POLICY "Users can view their own savings growth" ON public.savings_growth FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own savings growth" ON public.savings_growth FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own savings growth" ON public.savings_growth FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own savings growth" ON public.savings_growth FOR DELETE USING (auth.uid() = user_id);

-- Bank accounts policies
CREATE POLICY "Users can view their own bank accounts" ON public.bank_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bank accounts" ON public.bank_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bank accounts" ON public.bank_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bank accounts" ON public.bank_accounts FOR DELETE USING (auth.uid() = user_id);

-- Big purchase goals policies
CREATE POLICY "Users can view their own goals" ON public.big_purchase_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own goals" ON public.big_purchase_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.big_purchase_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.big_purchase_goals FOR DELETE USING (auth.uid() = user_id);

-- Recurring payments policies
CREATE POLICY "Users can view their own recurring payments" ON public.recurring_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own recurring payments" ON public.recurring_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recurring payments" ON public.recurring_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recurring payments" ON public.recurring_payments FOR DELETE USING (auth.uid() = user_id);

-- Recurring savings policies
CREATE POLICY "Users can view their own recurring savings" ON public.recurring_savings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own recurring savings" ON public.recurring_savings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recurring savings" ON public.recurring_savings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recurring savings" ON public.recurring_savings FOR DELETE USING (auth.uid() = user_id);

-- Recurring incomes policies
CREATE POLICY "Users can view their own recurring incomes" ON public.recurring_incomes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own recurring incomes" ON public.recurring_incomes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recurring incomes" ON public.recurring_incomes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recurring incomes" ON public.recurring_incomes FOR DELETE USING (auth.uid() = user_id);

-- 6. CREATE UPDATED_AT TRIGGER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to all tables
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_incomes_updated_at BEFORE UPDATE ON public.incomes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_savings_updated_at BEFORE UPDATE ON public.savings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_big_purchase_goals_updated_at BEFORE UPDATE ON public.big_purchase_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recurring_payments_updated_at BEFORE UPDATE ON public.recurring_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recurring_savings_updated_at BEFORE UPDATE ON public.recurring_savings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recurring_incomes_updated_at BEFORE UPDATE ON public.recurring_incomes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();