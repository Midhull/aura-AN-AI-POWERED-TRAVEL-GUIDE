-- Migration: Feedback & Review Tracking Schema
CREATE TABLE IF NOT EXISTS public.item_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('destination', 'activity', 'hotel', 'restaurant', 'itinerary')),
  item_id TEXT NOT NULL, -- references the specific item key/id
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on feedback
ALTER TABLE public.item_feedback ENABLE ROW LEVEL SECURITY;

-- Define RLS policies
CREATE POLICY "Users can manage their own feedback" ON public.item_feedback FOR ALL USING (auth.uid() = user_id);
