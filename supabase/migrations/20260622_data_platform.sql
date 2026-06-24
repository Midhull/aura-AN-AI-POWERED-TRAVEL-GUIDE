-- Migration: Travel Intelligence Data Platform Schema
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('viewed', 'clicked', 'saved', 'ignored', 'deleted')),
  item_type TEXT NOT NULL, -- destination, hotel, activity, itinerary
  item_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_behavior (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  original_plan JSONB NOT NULL,
  modified_plan JSONB NOT NULL,
  removed_items JSONB DEFAULT '[]'::jsonb NOT NULL,
  added_items JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trip_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE UNIQUE NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('completed', 'partially_completed', 'cancelled')),
  completed_activities_count INTEGER DEFAULT 0 NOT NULL,
  total_activities_count INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.budget_accuracy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE UNIQUE NOT NULL,
  estimated_budget NUMERIC(12, 2) NOT NULL,
  planned_budget NUMERIC(12, 2) NOT NULL,
  actual_spend NUMERIC(12, 2) NOT NULL,
  overspend_amount NUMERIC(12, 2) NOT NULL,
  actual_flight_cost NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  actual_hotel_cost NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  actual_food_cost NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  actual_transport_cost NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  actual_activity_cost NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  accuracy_score NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
  prediction_error NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  correction_factors JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_accuracy ENABLE ROW LEVEL SECURITY;

-- Define RLS policies
CREATE POLICY "Users can manage their own analytics events" ON public.analytics_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own user behavior logs" ON public.user_behavior FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own trip outcomes" ON public.trip_outcomes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own budget accuracy logs" ON public.budget_accuracy FOR ALL USING (auth.uid() = user_id);
