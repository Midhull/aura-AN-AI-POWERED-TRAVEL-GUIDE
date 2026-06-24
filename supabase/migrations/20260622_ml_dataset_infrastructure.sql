-- Migration: ML Dataset Infrastructure Schema
CREATE TABLE IF NOT EXISTS public.ml_trip_dataset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  features JSONB NOT NULL,
  raw_data JSONB NOT NULL,
  target_rating INTEGER CHECK (target_rating >= 1 AND target_rating <= 5) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, trip_id)
);

CREATE TABLE IF NOT EXISTS public.ml_budget_dataset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  features JSONB NOT NULL,
  raw_data JSONB NOT NULL,
  target_actual_spend NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, trip_id)
);

CREATE TABLE IF NOT EXISTS public.ml_destination_dataset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE SET NULL,
  destination_id TEXT NOT NULL,
  features JSONB NOT NULL,
  raw_data JSONB NOT NULL,
  target_selected INTEGER CHECK (target_selected = 0 OR target_selected = 1) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, destination_id)
);

CREATE TABLE IF NOT EXISTS public.ml_activity_dataset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE SET NULL,
  activity_id TEXT NOT NULL,
  features JSONB NOT NULL,
  raw_data JSONB NOT NULL,
  target_rating INTEGER CHECK (target_rating >= 1 AND target_rating <= 5) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

-- Enable RLS on all tables
ALTER TABLE public.ml_trip_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_budget_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_destination_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_activity_dataset ENABLE ROW LEVEL SECURITY;

-- Define RLS policies for database access
CREATE POLICY "Allow public read access to ml_trip_dataset" ON public.ml_trip_dataset FOR SELECT USING (TRUE);
CREATE POLICY "Allow public read access to ml_budget_dataset" ON public.ml_budget_dataset FOR SELECT USING (TRUE);
CREATE POLICY "Allow public read access to ml_destination_dataset" ON public.ml_destination_dataset FOR SELECT USING (TRUE);
CREATE POLICY "Allow public read access to ml_activity_dataset" ON public.ml_activity_dataset FOR SELECT USING (TRUE);

CREATE POLICY "Allow inserts to ml_trip_dataset" ON public.ml_trip_dataset FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow inserts to ml_budget_dataset" ON public.ml_budget_dataset FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow inserts to ml_destination_dataset" ON public.ml_destination_dataset FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow inserts to ml_activity_dataset" ON public.ml_activity_dataset FOR INSERT WITH CHECK (TRUE);
