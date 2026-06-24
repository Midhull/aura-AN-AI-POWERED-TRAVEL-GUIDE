-- Database verification queries (run in Supabase SQL Editor or psql)
-- Returns audit results for tables, indexes, RLS, and migration history

-- =============================================================================
-- 1. TABLE EXISTENCE + ROW COUNTS
-- =============================================================================
SELECT
  t.table_name,
  CASE
    WHEN c.relname IS NOT NULL THEN 'EXISTS'
    ELSE 'MISSING'
  END AS status,
  CASE
    WHEN c.relname IS NOT NULL THEN (xpath('/row/c/text()', query_to_xml(format('SELECT COUNT(*) AS c FROM public.%I', t.table_name), false, true, '')))[1]::text::bigint
    ELSE NULL
  END AS row_count
FROM (
  VALUES
    ('users'),
    ('traveler_profiles'),
    ('trips'),
    ('budgets'),
    ('itineraries'),
    ('learning_data'),
    ('ml_trip_dataset'),
    ('ml_budget_dataset'),
    ('ml_activity_dataset'),
    ('ml_budget_shadow_analytics'),
    ('ml_destination_shadow_analytics'),
    ('activity_model_predictions')
) AS t(table_name)
LEFT JOIN pg_class c ON c.relname = t.table_name
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
ORDER BY t.table_name;

-- =============================================================================
-- 2. MIGRATION HISTORY
-- =============================================================================
SELECT version, name, inserted_at
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- Local files NOT on remote:
SELECT m.local_version AS missing_on_remote
FROM (
  VALUES
    ('20260622_init'),
    ('20260622_destination_intel'),
    ('20260622_budget_history'),
    ('20260622_expenses'),
    ('20260622_feedback'),
    ('20260622_pgvector_memory'),
    ('20260622_data_platform'),
    ('20260622_ml_dataset_infrastructure'),
    ('20260622_training_dataset'),
    ('20260622_indexes'),
    ('20260622_ml_data_collection_infra'),
    ('20260622_ml_synthetic_data_source'),
    ('20260622_ml_budget_shadow_analytics'),
    ('20260622_ml_destination_shadow_analytics'),
    ('20260622_ml_activity_recommendation'),
    ('20260622_ml_performance_monitoring'),
    ('20260622_audit_reconcile')
) AS m(local_version)
LEFT JOIN supabase_migrations.schema_migrations s ON s.version = m.local_version
WHERE s.version IS NULL;

-- =============================================================================
-- 3. RLS STATUS
-- =============================================================================
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  COUNT(p.policyname) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p ON p.schemaname = n.nspname AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'users', 'traveler_profiles', 'trips', 'budgets', 'itineraries', 'learning_data',
    'ml_trip_dataset', 'ml_budget_dataset', 'ml_activity_dataset',
    'ml_budget_shadow_analytics', 'ml_destination_shadow_analytics', 'activity_model_predictions'
  )
GROUP BY c.relname, c.relrowsecurity, c.relforcerowsecurity
ORDER BY c.relname;

-- Policy detail
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'traveler_profiles', 'trips', 'budgets', 'itineraries', 'learning_data',
    'ml_trip_dataset', 'ml_budget_dataset', 'ml_activity_dataset',
    'ml_budget_shadow_analytics', 'ml_destination_shadow_analytics', 'activity_model_predictions'
  )
ORDER BY tablename, policyname;

-- =============================================================================
-- 4. INDEX VERIFICATION
-- =============================================================================
SELECT
  e.indexname AS expected_index,
  CASE WHEN i.indexname IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status
FROM (
  VALUES
    ('trips_user_id_idx'),
    ('traveler_profiles_user_id_idx'),
    ('budgets_trip_id_idx'),
    ('budgets_user_id_idx'),
    ('budget_breakdowns_budget_id_idx'),
    ('budget_breakdowns_user_id_idx'),
    ('itineraries_trip_id_idx'),
    ('itineraries_user_id_idx'),
    ('chat_sessions_user_id_idx'),
    ('trip_ratings_trip_id_idx'),
    ('learning_data_user_id_idx'),
    ('expenses_trip_id_idx'),
    ('expenses_user_id_idx'),
    ('item_feedback_item_id_type_idx'),
    ('travel_memories_embedding_hnsw_idx')
) AS e(indexname)
LEFT JOIN pg_indexes i ON i.schemaname = 'public' AND i.indexname = e.indexname
ORDER BY e.indexname;

-- =============================================================================
-- 5. API GRANTS (PostgREST visibility)
-- =============================================================================
SELECT
  table_name,
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
  AND table_name IN (
    'users', 'ml_trip_dataset', 'ml_budget_dataset', 'ml_activity_dataset',
    'ml_budget_shadow_analytics', 'ml_destination_shadow_analytics', 'activity_model_predictions'
  )
GROUP BY table_name, grantee
ORDER BY table_name, grantee;

-- Reload PostgREST after manual fixes:
-- NOTIFY pgrst, 'reload schema';
