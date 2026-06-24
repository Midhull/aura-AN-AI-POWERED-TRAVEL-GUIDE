-- Drop existing tables to recreate with the requested ML Data Collection Schema
DROP TABLE IF EXISTS public.ml_trip_dataset CASCADE;
DROP TABLE IF EXISTS public.ml_budget_dataset CASCADE;
DROP TABLE IF EXISTS public.ml_activity_dataset CASCADE;

-- Create ml_trip_dataset table
CREATE TABLE public.ml_trip_dataset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  traveler_profile JSONB NOT NULL,
  destination TEXT NOT NULL,
  duration INTEGER NOT NULL,
  budget NUMERIC(12, 2) NOT NULL,
  interests JSONB NOT NULL,
  generated_itinerary JSONB NOT NULL,
  user_edits JSONB DEFAULT '[]'::jsonb NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ml_budget_dataset table
CREATE TABLE public.ml_budget_dataset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  traveler_profile JSONB NOT NULL,
  destination TEXT NOT NULL,
  duration INTEGER NOT NULL,
  budget NUMERIC(12, 2) NOT NULL,
  interests JSONB NOT NULL,
  generated_itinerary JSONB NOT NULL,
  user_edits JSONB DEFAULT '[]'::jsonb NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ml_activity_dataset table
CREATE TABLE public.ml_activity_dataset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  traveler_profile JSONB NOT NULL,
  destination TEXT NOT NULL,
  duration INTEGER NOT NULL,
  budget NUMERIC(12, 2) NOT NULL,
  interests JSONB NOT NULL,
  generated_itinerary JSONB NOT NULL,
  user_edits JSONB DEFAULT '[]'::jsonb NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ml_trip_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_budget_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_activity_dataset ENABLE ROW LEVEL SECURITY;

-- Create policies to allow inserts and select (public or authenticated)
CREATE POLICY "Allow public access to ml_trip_dataset" ON public.ml_trip_dataset FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow public access to ml_budget_dataset" ON public.ml_budget_dataset FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow public access to ml_activity_dataset" ON public.ml_activity_dataset FOR ALL USING (TRUE) WITH CHECK (TRUE);
