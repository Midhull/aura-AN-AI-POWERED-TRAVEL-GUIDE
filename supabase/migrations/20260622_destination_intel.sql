-- Migration: Destination Intelligence Schema
CREATE TABLE IF NOT EXISTS public.countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL UNIQUE,
  safety_score INTEGER CHECK (safety_score >= 1 AND safety_score <= 10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  coordinates JSONB NOT NULL, -- { lat: number, lng: number }
  timezone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_id, name)
);

CREATE TABLE IF NOT EXISTS public.destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  best_season TEXT NOT NULL,
  average_budget NUMERIC(12, 2) NOT NULL,
  travel_difficulty INTEGER CHECK (travel_difficulty >= 1 AND travel_difficulty <= 5) NOT NULL,
  family_friendly_score INTEGER CHECK (family_friendly_score >= 1 AND family_friendly_score <= 10) NOT NULL,
  nightlife_score INTEGER CHECK (nightlife_score >= 1 AND nightlife_score <= 10) NOT NULL,
  food_score INTEGER CHECK (food_score >= 1 AND food_score <= 10) NOT NULL,
  interests TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  styles TEXT[] DEFAULT '{}'::TEXT[] NOT NULL, -- TravelStyle enum array
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID REFERENCES public.destinations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  description TEXT,
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID REFERENCES public.destinations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  food_score INTEGER CHECK (food_score >= 1 AND food_score <= 10) NOT NULL,
  price_range VARCHAR(5) NOT NULL, -- $, $$, $$$
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transport_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- metro, bus, tram, taxi
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.visa_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE NOT NULL,
  passport_country TEXT NOT NULL,
  requirement_type TEXT NOT NULL, -- free, visa_on_arrival, required
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.weather_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE NOT NULL,
  month INTEGER CHECK (month >= 1 AND month <= 12) NOT NULL,
  avg_temp_c NUMERIC(5, 2) NOT NULL,
  avg_rainfall_mm NUMERIC(6, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(city_id, month)
);

-- Enable RLS on all tables
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access (necessary for users to search/view destinations)
CREATE POLICY "Allow public read access to countries" ON public.countries FOR SELECT USING (TRUE);
CREATE POLICY "Allow public read access to cities" ON public.cities FOR SELECT USING (TRUE);
CREATE POLICY "Allow public read access to destinations" ON public.destinations FOR SELECT USING (TRUE);
CREATE POLICY "Allow public read access to attractions" ON public.attractions FOR SELECT USING (TRUE);
CREATE POLICY "Allow public read access to restaurants" ON public.restaurants FOR SELECT USING (TRUE);
CREATE POLICY "Allow public read access to transport" ON public.transport_options FOR SELECT USING (TRUE);
CREATE POLICY "Allow public read access to visa requirements" ON public.visa_requirements FOR SELECT USING (TRUE);
CREATE POLICY "Allow public read access to weather profiles" ON public.weather_profiles FOR SELECT USING (TRUE);
