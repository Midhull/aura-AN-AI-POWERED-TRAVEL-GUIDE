-- Migration: Expense Tracking Schema
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Food', 'Transport', 'Hotel', 'Activities', 'Shopping', 'Emergency')),
  description TEXT NOT NULL,
  spent_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Define RLS policies
CREATE POLICY "Users can manage their own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id);
