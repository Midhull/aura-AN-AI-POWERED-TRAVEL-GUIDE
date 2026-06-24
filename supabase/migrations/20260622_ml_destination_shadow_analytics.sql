-- Migration: Create ML destination shadow analytics table
CREATE TABLE IF NOT EXISTS public.ml_destination_shadow_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  input_destinations JSONB NOT NULL,
  rule_ranking JSONB NOT NULL,
  ml_ranking JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ml_destination_shadow_analytics ENABLE ROW LEVEL SECURITY;

-- Create public insert/select policies
CREATE POLICY "Allow public insert to ml_destination_shadow_analytics" ON public.ml_destination_shadow_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select from ml_destination_shadow_analytics" ON public.ml_destination_shadow_analytics FOR SELECT USING (true);
