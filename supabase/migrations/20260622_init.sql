-- Create custom types / enums matching our TS types
CREATE TYPE travel_style AS ENUM ('LUXURY', 'BOUTIQUE', 'BUDGET', 'ADVENTURE', 'BACKPACKING', 'RELAXING', 'CULTURAL');
CREATE TYPE food_preference AS ENUM ('VEGETARIAN', 'VEGAN', 'GLUTEN_FREE', 'HALAL', 'KOSHER', 'NO_RESTRICTIONS');
CREATE TYPE accommodation_type AS ENUM ('HOTEL', 'HOSTEL', 'RESORT', 'VILLA', 'RYOKAN', 'APARTMENT');
CREATE TYPE trip_status AS ENUM ('planning', 'confirmed', 'completed');

-- 1. Users table (mirrors auth.users, synced via triggers)
CREATE TABLE IF NOT EXISTS public.users (
  uid UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  preferences JSONB DEFAULT '{"styles": [], "food": [], "accommodation": [], "currency": "USD", "maxDailyBudget": 500}'::jsonb,
  is_pro BOOLEAN DEFAULT FALSE,
  pro_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to active users"
  ON public.users FOR SELECT
  USING (TRUE);

CREATE POLICY "Allow users to update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = uid);

-- 2. Traveler Profiles
CREATE TABLE IF NOT EXISTS public.traveler_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  passport_number TEXT,
  nationality TEXT,
  emergency_contact JSONB DEFAULT '{"name": "", "relationship": "", "phone": ""}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.traveler_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own traveler profiles"
  ON public.traveler_profiles FOR ALL
  USING (auth.uid() = user_id);

-- 3. Trips
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER NOT NULL,
  travelers_count INTEGER DEFAULT 1 NOT NULL,
  status trip_status DEFAULT 'planning'::trip_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own trips"
  ON public.trips FOR ALL
  USING (auth.uid() = user_id);

-- 4. Budgets
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  limit_amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own budgets"
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id);

-- 5. Budget Breakdowns
CREATE TABLE IF NOT EXISTS public.budget_breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  flights NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  accommodation NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  activities NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  dining NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  transport NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  other NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  total NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.budget_breakdowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own budget breakdowns"
  ON public.budget_breakdowns FOR ALL
  USING (auth.uid() = user_id);

-- 6. Itineraries
CREATE TABLE IF NOT EXISTS public.itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  days JSONB NOT NULL, -- Contains array of DailyItinerary
  version INTEGER DEFAULT 1 NOT NULL,
  is_current BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own itineraries"
  ON public.itineraries FOR ALL
  USING (auth.uid() = user_id);

-- 7. Chat Sessions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  messages JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own chat sessions"
  ON public.chat_sessions FOR ALL
  USING (auth.uid() = user_id);

-- 8. Trip Ratings
CREATE TABLE IF NOT EXISTS public.trip_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.trip_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own trip ratings"
  ON public.trip_ratings FOR ALL
  USING (auth.uid() = user_id);

-- 9. Learning Data (For personalization and model alignment)
CREATE TABLE IF NOT EXISTS public.learning_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  interaction_type TEXT NOT NULL, -- e.g., 'click_recommendation', 'modify_itinerary'
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.learning_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own learning data"
  ON public.learning_data FOR ALL
  USING (auth.uid() = user_id);

-- Triggers for Users Synchronization from Auth.Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (uid, email, display_name, photo_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
