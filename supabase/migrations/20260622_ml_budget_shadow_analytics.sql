-- Migration: Create ML budget shadow analytics table
CREATE TABLE IF NOT EXISTS public.ml_budget_shadow_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination TEXT NOT NULL,
  duration INTEGER NOT NULL,
  travelers INTEGER NOT NULL,
  travel_style TEXT NOT NULL,
  season TEXT NOT NULL,
  rule_budget NUMERIC(12, 2) NOT NULL,
  ml_budget NUMERIC(12, 2) NOT NULL,
  difference NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ml_budget_shadow_analytics ENABLE ROW LEVEL SECURITY;

-- Create public insert/select policies
CREATE POLICY "Allow public insert to ml_budget_shadow_analytics" ON public.ml_budget_shadow_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select from ml_budget_shadow_analytics" ON public.ml_budget_shadow_analytics FOR SELECT USING (true);
