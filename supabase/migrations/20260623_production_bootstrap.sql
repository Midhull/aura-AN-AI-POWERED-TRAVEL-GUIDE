-- Production Bootstrap Migration for Aria Travel AI
-- Compatible with Supabase PostgreSQL (Postgres 15+)
-- Includes core tables, ML datasets, analytics tracking, soft deletes, indexing, triggers, and RLS policies.

BEGIN;

-- =============================================================================
-- 0. EXTENSIONS & CUSTOM TYPES
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'travel_style') THEN
    CREATE TYPE travel_style AS ENUM ('LUXURY', 'BOUTIQUE', 'BUDGET', 'ADVENTURE', 'BACKPACKING', 'RELAXING', 'CULTURAL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'food_preference') THEN
    CREATE TYPE food_preference AS ENUM ('VEGETARIAN', 'VEGAN', 'GLUTEN_FREE', 'HALAL', 'KOSHER', 'NO_RESTRICTIONS');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'accommodation_type') THEN
    CREATE TYPE accommodation_type AS ENUM ('HOTEL', 'HOSTEL', 'RESORT', 'VILLA', 'RYOKAN', 'APARTMENT');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_status') THEN
    CREATE TYPE trip_status AS ENUM ('planning', 'confirmed', 'completed');
  END IF;
END $$;

-- Helper function for updating timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1. CORE TABLES
-- =============================================================================

-- USERS (Mirrors auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  uid UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  photo_url TEXT,
  preferences JSONB DEFAULT '{"styles": [], "food": [], "accommodation": [], "currency": "USD", "maxDailyBudget": 500}'::jsonb,
  is_pro BOOLEAN DEFAULT FALSE,
  pro_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TRAVELER PROFILES
CREATE TABLE IF NOT EXISTS public.traveler_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  passport_number TEXT,
  nationality TEXT,
  emergency_contact JSONB DEFAULT '{"name": "", "relationship": "", "phone": ""}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TRIPS
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
  deleted_at TIMESTAMPTZ, -- Soft delete support
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BUDGETS
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  limit_amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BUDGET BREAKDOWNS
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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ITINERARIES
CREATE TABLE IF NOT EXISTS public.itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  days JSONB NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  is_current BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- SAVED TRIPS
CREATE TABLE IF NOT EXISTS public.saved_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  deleted_at TIMESTAMPTZ, -- Soft delete support
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- LEARNING DATA
CREATE TABLE IF NOT EXISTS public.learning_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  interaction_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- FEEDBACK
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  item_id UUID,
  item_type TEXT NOT NULL, -- 'trip', 'destination', 'activity'
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comments TEXT,
  actual_spend NUMERIC(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- 2. ML DATASET & PREDICTION TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ml_trip_dataset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  features JSONB NOT NULL,
  raw_data JSONB NOT NULL,
  target_rating INTEGER CHECK (target_rating >= 1 AND target_rating <= 5),
  data_source TEXT DEFAULT 'user' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ml_budget_dataset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  features JSONB NOT NULL,
  raw_data JSONB NOT NULL,
  target_actual_spend NUMERIC(12, 2) NOT NULL,
  data_source TEXT DEFAULT 'user' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ml_activity_dataset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE SET NULL,
  activity_id UUID,
  features JSONB NOT NULL,
  raw_data JSONB NOT NULL,
  target_rating INTEGER CHECK (target_rating >= 1 AND target_rating <= 5),
  data_source TEXT DEFAULT 'user' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ml_destination_shadow_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE SET NULL,
  input_destinations JSONB NOT NULL,
  rule_ranking JSONB NOT NULL,
  ml_ranking JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.activity_model_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE SET NULL,
  destination TEXT NOT NULL,
  recommended_by_rules JSONB NOT NULL,
  recommended_by_model JSONB NOT NULL,
  user_selected JSONB DEFAULT '[]'::jsonb NOT NULL,
  user_rejected JSONB DEFAULT '[]'::jsonb NOT NULL,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- 3. ANALYTICS TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'gemini', 'grok', etc.
  model_name TEXT NOT NULL,
  prompt_template TEXT,
  input_tokens INTEGER DEFAULT 0 NOT NULL,
  output_tokens INTEGER DEFAULT 0 NOT NULL,
  estimated_cost NUMERIC(10, 6) DEFAULT 0.000000 NOT NULL,
  latency_ms INTEGER,
  status TEXT NOT NULL, -- 'success', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE SET NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  tokens_consumed INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE SET NULL,
  service_type TEXT NOT NULL, -- 'llm_generation', 'ml_inference', 'vector_search'
  cost_amount NUMERIC(10, 6) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.model_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  metric_name TEXT NOT NULL, -- 'mae', 'rmse', 'mape', 'precision@k', 'ndcg'
  metric_value NUMERIC(10, 6) NOT NULL,
  evaluation_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL
);

-- =============================================================================
-- 4. INDEXES (Performance Optimizations)
-- =============================================================================
CREATE INDEX IF NOT EXISTS traveler_profiles_user_id_idx ON public.traveler_profiles(user_id);
CREATE INDEX IF NOT EXISTS trips_user_id_idx ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS trips_deleted_at_idx ON public.trips(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS budgets_trip_id_idx ON public.budgets(trip_id);
CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS budget_breakdowns_budget_id_idx ON public.budget_breakdowns(budget_id);
CREATE INDEX IF NOT EXISTS budget_breakdowns_user_id_idx ON public.budget_breakdowns(user_id);
CREATE INDEX IF NOT EXISTS itineraries_trip_id_idx ON public.itineraries(trip_id);
CREATE INDEX IF NOT EXISTS itineraries_user_id_idx ON public.itineraries(user_id);
CREATE INDEX IF NOT EXISTS saved_trips_user_id_idx ON public.saved_trips(user_id);
CREATE INDEX IF NOT EXISTS saved_trips_trip_id_idx ON public.saved_trips(trip_id);
CREATE INDEX IF NOT EXISTS learning_data_user_id_idx ON public.learning_data(user_id);
CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS feedback_trip_id_idx ON public.feedback(trip_id);

CREATE INDEX IF NOT EXISTS ml_trip_dataset_user_id_idx ON public.ml_trip_dataset(user_id);
CREATE INDEX IF NOT EXISTS ml_budget_dataset_user_id_idx ON public.ml_budget_dataset(user_id);
CREATE INDEX IF NOT EXISTS ml_activity_dataset_user_id_idx ON public.ml_activity_dataset(user_id);
CREATE INDEX IF NOT EXISTS ai_usage_logs_user_id_idx ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS ai_usage_logs_created_at_idx ON public.ai_usage_logs(created_at DESC);

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traveler_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ml_trip_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_budget_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_activity_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_budget_shadow_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_destination_shadow_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_model_predictions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_metrics ENABLE ROW LEVEL SECURITY;

-- General User policies (restricted to owned records)
CREATE POLICY "Users read/write own user record" ON public.users FOR ALL USING (auth.uid() = uid);
CREATE POLICY "Users read/write own profiles" ON public.traveler_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users read/write own trips" ON public.trips FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users read/write own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users read/write own breakdowns" ON public.budget_breakdowns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users read/write own itineraries" ON public.itineraries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users read/write own saved_trips" ON public.saved_trips FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users read/write own learning_data" ON public.learning_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users read/write own feedback" ON public.feedback FOR ALL USING (auth.uid() = user_id);

-- ML policies (exposing inputs for pipelines, but retaining security context where possible)
CREATE POLICY "Users manage own ml_trip records" ON public.ml_trip_dataset FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own ml_budget records" ON public.ml_budget_dataset FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own ml_activity records" ON public.ml_activity_dataset FOR ALL USING (auth.uid() = user_id);

-- Shadow analytics & predictions (write allowed for authenticated users, reading user-scoped or system allowed)
CREATE POLICY "Authenticated users log shadow budget" ON public.ml_budget_shadow_analytics FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users view shadow budget" ON public.ml_budget_shadow_analytics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users manage own destination shadow records" ON public.ml_destination_shadow_analytics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own predictions" ON public.activity_model_predictions FOR ALL USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Users manage own ai logs" ON public.ai_usage_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own token usage" ON public.token_usage FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own cost tracking" ON public.cost_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Read-only access to model metrics" ON public.model_metrics FOR SELECT USING (TRUE);

-- =============================================================================
-- 6. TRIGGERS & TRIGGERS SYNC
-- =============================================================================

-- Sync auth.users to public.users automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (uid, email, display_name, photo_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger update timestamps
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_traveler_profiles_updated_at BEFORE UPDATE ON public.traveler_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_budget_breakdowns_updated_at BEFORE UPDATE ON public.budget_breakdowns FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_itineraries_updated_at BEFORE UPDATE ON public.itineraries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_saved_trips_updated_at BEFORE UPDATE ON public.saved_trips FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_feedback_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 7. ROLES & GRANTS (PostgREST Schema cache resolution)
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
