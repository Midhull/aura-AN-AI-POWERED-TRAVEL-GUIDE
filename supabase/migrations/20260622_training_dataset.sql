-- Migration: ML Training Dataset Schema
CREATE TABLE IF NOT EXISTS public.training_dataset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  features JSONB NOT NULL, -- Processed vectors, scales, and engineered indicators
  target_rating INTEGER CHECK (target_rating >= 1 AND target_rating <= 5),
  target_cost_variance NUMERIC(12, 2), -- Actual spend minus estimated budget
  raw_data JSONB NOT NULL, -- Copy of the original input records
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on training_dataset
ALTER TABLE public.training_dataset ENABLE ROW LEVEL SECURITY;

-- Allow public read access to database analysts
CREATE POLICY "Allow public read access to training dataset" ON public.training_dataset FOR SELECT USING (TRUE);
CREATE POLICY "Allow system inserts to training dataset" ON public.training_dataset FOR INSERT WITH CHECK (TRUE);
