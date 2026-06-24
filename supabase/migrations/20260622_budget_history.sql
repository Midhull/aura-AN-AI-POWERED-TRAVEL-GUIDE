-- Migration: Budget History Schema
CREATE TABLE IF NOT EXISTS public.budget_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE SET NULL,
  destination TEXT NOT NULL,
  travelers_count INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  travel_style TEXT NOT NULL,
  estimated_budget NUMERIC(12, 2) NOT NULL,
  actual_budget NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on budget_history
ALTER TABLE public.budget_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access and authenticated inserts
CREATE POLICY "Allow public read access to budget history" ON public.budget_history FOR SELECT USING (TRUE);
CREATE POLICY "Allow users to log their own budget history" ON public.budget_history FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
