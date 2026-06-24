-- Migration: Create ML activity training and shadow model predictions tables
CREATE TABLE IF NOT EXISTS public.activity_training_dataset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  traveler_type TEXT,
  age_group TEXT,
  budget_tier TEXT,
  travel_style TEXT,
  food_preference TEXT,
  mobility_level TEXT,
  destination TEXT NOT NULL,
  season TEXT,
  trip_duration INTEGER,
  travel_dna JSONB,
  activity_id TEXT NOT NULL,
  activity_selected BOOLEAN NOT NULL DEFAULT FALSE,
  activity_completed BOOLEAN NOT NULL DEFAULT FALSE,
  activity_rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_model_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  destination TEXT NOT NULL,
  recommended_by_rules JSONB NOT NULL,
  recommended_by_model JSONB NOT NULL,
  user_selected JSONB DEFAULT '[]'::jsonb NOT NULL,
  user_rejected JSONB DEFAULT '[]'::jsonb NOT NULL,
  user_rating JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activity_training_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_model_predictions ENABLE ROW LEVEL SECURITY;

-- Create public insert/select policies
CREATE POLICY "Allow public access to activity_training_dataset" ON public.activity_training_dataset FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to activity_model_predictions" ON public.activity_model_predictions FOR ALL USING (true) WITH CHECK (true);
