-- Migration Audit Reconcile (idempotent)
-- Fixes: API grants, PostgREST schema cache, missing indexes, RLS policy gaps, migration history
-- Safe to run multiple times.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Ensure roles can access public schema objects via PostgREST
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Indexes (from 20260622_indexes.sql)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS trips_user_id_idx ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS traveler_profiles_user_id_idx ON public.traveler_profiles(user_id);
CREATE INDEX IF NOT EXISTS budgets_trip_id_idx ON public.budgets(trip_id);
CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS budget_breakdowns_budget_id_idx ON public.budget_breakdowns(budget_id);
CREATE INDEX IF NOT EXISTS budget_breakdowns_user_id_idx ON public.budget_breakdowns(user_id);
CREATE INDEX IF NOT EXISTS itineraries_trip_id_idx ON public.itineraries(trip_id);
CREATE INDEX IF NOT EXISTS itineraries_user_id_idx ON public.itineraries(user_id);
CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS trip_ratings_trip_id_idx ON public.trip_ratings(trip_id);
CREATE INDEX IF NOT EXISTS learning_data_user_id_idx ON public.learning_data(user_id);
CREATE INDEX IF NOT EXISTS expenses_trip_id_idx ON public.expenses(trip_id);
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS item_feedback_item_id_type_idx ON public.item_feedback(item_id, item_type);

-- pgvector extension + HNSW index (requires vector extension)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE INDEX IF NOT EXISTS travel_memories_embedding_hnsw_idx
  ON public.travel_memories
  USING hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- 3. ML dataset data_source columns (from 20260622_ml_synthetic_data_source.sql)
-- ---------------------------------------------------------------------------
ALTER TABLE public.ml_trip_dataset ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'user' NOT NULL;
ALTER TABLE public.ml_budget_dataset ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'user' NOT NULL;
ALTER TABLE public.ml_activity_dataset ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'user' NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. RLS — ensure enabled on all audited tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traveler_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_trip_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_budget_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_activity_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_budget_shadow_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_destination_shadow_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_model_predictions ENABLE ROW LEVEL SECURITY;

-- Helper: create policy only if missing
CREATE OR REPLACE FUNCTION public.__audit_ensure_policy(
  p_table regclass,
  p_name text,
  p_cmd text,
  p_using text DEFAULT NULL,
  p_check text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  tbl text := p_table::text;
  sql text;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = split_part(tbl, '.', 2)
      AND policyname = p_name
  ) THEN
    RETURN;
  END IF;

  sql := format('CREATE POLICY %I ON %s FOR %s', p_name, tbl, p_cmd);
  IF p_using IS NOT NULL THEN
    sql := sql || format(' USING (%s)', p_using);
  END IF;
  IF p_check IS NOT NULL THEN
    sql := sql || format(' WITH CHECK (%s)', p_check);
  END IF;
  EXECUTE sql;
END;
$$;

SELECT public.__audit_ensure_policy('public.users'::regclass, 'Allow public read access to active users', 'SELECT', 'TRUE');
SELECT public.__audit_ensure_policy('public.users'::regclass, 'Allow users to update their own profile', 'UPDATE', 'auth.uid() = uid');

SELECT public.__audit_ensure_policy('public.traveler_profiles'::regclass, 'Users can manage their own traveler profiles', 'ALL', 'auth.uid() = user_id');
SELECT public.__audit_ensure_policy('public.trips'::regclass, 'Users can manage their own trips', 'ALL', 'auth.uid() = user_id');
SELECT public.__audit_ensure_policy('public.budgets'::regclass, 'Users can manage their own budgets', 'ALL', 'auth.uid() = user_id');
SELECT public.__audit_ensure_policy('public.itineraries'::regclass, 'Users can manage their own itineraries', 'ALL', 'auth.uid() = user_id');
SELECT public.__audit_ensure_policy('public.learning_data'::regclass, 'Users can manage their own learning data', 'ALL', 'auth.uid() = user_id');

SELECT public.__audit_ensure_policy('public.ml_trip_dataset'::regclass, 'Allow public access to ml_trip_dataset', 'ALL', 'TRUE', 'TRUE');
SELECT public.__audit_ensure_policy('public.ml_budget_dataset'::regclass, 'Allow public access to ml_budget_dataset', 'ALL', 'TRUE', 'TRUE');
SELECT public.__audit_ensure_policy('public.ml_activity_dataset'::regclass, 'Allow public access to ml_activity_dataset', 'ALL', 'TRUE', 'TRUE');
SELECT public.__audit_ensure_policy('public.ml_budget_shadow_analytics'::regclass, 'Allow public insert to ml_budget_shadow_analytics', 'INSERT', NULL, 'true');
SELECT public.__audit_ensure_policy('public.ml_budget_shadow_analytics'::regclass, 'Allow public select from ml_budget_shadow_analytics', 'SELECT', 'true');
SELECT public.__audit_ensure_policy('public.ml_destination_shadow_analytics'::regclass, 'Allow public insert to ml_destination_shadow_analytics', 'INSERT', NULL, 'true');
SELECT public.__audit_ensure_policy('public.ml_destination_shadow_analytics'::regclass, 'Allow public select from ml_destination_shadow_analytics', 'SELECT', 'true');
SELECT public.__audit_ensure_policy('public.activity_model_predictions'::regclass, 'Allow public access to activity_model_predictions', 'ALL', 'true', 'true');

DROP FUNCTION public.__audit_ensure_policy(regclass, text, text, text, text);

-- ---------------------------------------------------------------------------
-- 5. Record local migration files if tracking table exists
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  migration_name text;
  migrations text[] := ARRAY[
    '20260622_init',
    '20260622_destination_intel',
    '20260622_budget_history',
    '20260622_expenses',
    '20260622_feedback',
    '20260622_pgvector_memory',
    '20260622_data_platform',
    '20260622_ml_dataset_infrastructure',
    '20260622_training_dataset',
    '20260622_indexes',
    '20260622_ml_data_collection_infra',
    '20260622_ml_synthetic_data_source',
    '20260622_ml_budget_shadow_analytics',
    '20260622_ml_destination_shadow_analytics',
    '20260622_ml_activity_recommendation',
    '20260622_ml_performance_monitoring',
    '20260622_audit_reconcile'
  ];
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations'
  ) THEN
    FOREACH migration_name IN ARRAY migrations LOOP
      INSERT INTO supabase_migrations.schema_migrations (version, name)
      VALUES (migration_name, migration_name)
      ON CONFLICT (version) DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 6. Reload PostgREST schema cache
-- ---------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

COMMIT;
