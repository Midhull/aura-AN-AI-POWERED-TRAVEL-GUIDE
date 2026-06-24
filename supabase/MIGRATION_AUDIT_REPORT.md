# Supabase Migration Audit Report

**Project:** `ywfarmatbvuhxbyqymax` (`https://ywfarmatbvuhxbyqymax.supabase.co`)  
**Audited:** 2026-06-22  
**Local migrations scanned:** 16 files (+ 1 reconcile migration generated)

---

## Executive Summary

| Category | Result |
|---|---|
| Core tables (6) | **EXISTS** — all present, schema matches, `COUNT(*)` = 0 |
| ML tables (6) | **EXISTS** — all present, schema matches, `COUNT(*)` = 0 |
| Extended migration tables (38 total) | **EXISTS** — all respond to API count probes |
| Missing tables | **None** |
| Schema column drift | **None detected** on audited tables |
| API write path (ML inserts) | **OUT OF SYNC** — PostgREST schema cache / grants issue |
| Indexes / migration history | **Requires SQL verification** (no direct Postgres access) |
| Reconcile migration | **Generated** — `supabase/migrations/20260622_audit_reconcile.sql` |

---

## 1. Local Migration Inventory

| # | Migration File | Purpose |
|---|---|---|
| 1 | `20260622_init.sql` | Core schema: users, traveler_profiles, trips, budgets, itineraries, learning_data + RLS |
| 2 | `20260622_destination_intel.sql` | Destination intelligence tables |
| 3 | `20260622_budget_history.sql` | Budget history |
| 4 | `20260622_expenses.sql` | Expense tracking |
| 5 | `20260622_feedback.sql` | Item feedback |
| 6 | `20260622_pgvector_memory.sql` | pgvector + travel_memories |
| 7 | `20260622_data_platform.sql` | Analytics / behavior / outcomes |
| 8 | `20260622_ml_dataset_infrastructure.sql` | Initial ML dataset tables (superseded) |
| 9 | `20260622_training_dataset.sql` | Training dataset |
| 10 | `20260622_indexes.sql` | Performance indexes |
| 11 | `20260622_ml_data_collection_infra.sql` | **Final** ML dataset schema (DROP + recreate) |
| 12 | `20260622_ml_synthetic_data_source.sql` | Adds `data_source` column |
| 13 | `20260622_ml_budget_shadow_analytics.sql` | Budget shadow analytics |
| 14 | `20260622_ml_destination_shadow_analytics.sql` | Destination shadow analytics |
| 15 | `20260622_ml_activity_recommendation.sql` | Activity training + predictions |
| 16 | `20260622_ml_performance_monitoring.sql` | Model versioning / metrics |
| 17 | `20260622_audit_reconcile.sql` | **Generated** — grants, indexes, RLS, cache reload |

---

## 2. Required Table Verification

### Core Tables

| Table | Status | COUNT(*) | Columns | RLS SELECT |
|---|---|---|---|---|
| `users` | **EXISTS** | 0 | OK | Allowed (public read policy) |
| `traveler_profiles` | **EXISTS** | 0 | OK | Allowed (returns 0 rows for anon) |
| `trips` | **EXISTS** | 0 | OK | Allowed |
| `budgets` | **EXISTS** | 0 | OK | Allowed |
| `itineraries` | **EXISTS** | 0 | OK | Allowed |
| `learning_data` | **EXISTS** | 0 | OK | Allowed |

### ML Tables

| Table | Status | COUNT(*) | Columns | RLS INSERT |
|---|---|---|---|---|
| `ml_trip_dataset` | **EXISTS** | 0 | OK | **Blocked** (schema cache) |
| `ml_budget_dataset` | **EXISTS** | 0 | OK | **Blocked** (schema cache) |
| `ml_activity_dataset` | **EXISTS** | 0 | OK | **Blocked** (schema cache) |
| `ml_budget_shadow_analytics` | **EXISTS** | 0 | OK | **Blocked** (schema cache) |
| `ml_destination_shadow_analytics` | **EXISTS** | 0 | OK | **Blocked** (schema cache) |
| `activity_model_predictions` | **EXISTS** | 0 | OK | **Blocked** (schema cache) |

### Extended Tables (all migration objects)

All **38** tables defined across local migrations respond as **EXISTS** with `COUNT(*) = 0`:

`budget_breakdowns`, `chat_sessions`, `trip_ratings`, `countries`, `cities`, `destinations`, `attractions`, `restaurants`, `transport_options`, `visa_requirements`, `weather_profiles`, `budget_history`, `expenses`, `item_feedback`, `travel_memories`, `analytics_events`, `user_behavior`, `trip_outcomes`, `budget_accuracy`, `ml_destination_dataset`, `training_dataset`, `activity_training_dataset`, `ml_model_versions`, `ml_model_metrics`, `ml_model_performance`, `ml_user_feedback`, plus all core/ML tables above.

---

## 3. Local vs Remote Comparison

| Check | Local | Remote | Verdict |
|---|---|---|---|
| Table existence (12 required) | Defined in migrations | All present via API | **EXISTS** |
| Column schema (final state) | See `ml_data_collection_infra` + `data_source` | Matches expected columns | **IN SYNC** |
| Row counts | N/A | All return 0 | **OK** |
| ML API writes | Policies defined | Insert fails: schema cache | **OUT OF SYNC** |
| Migration history | 16 files | Not verified (no Postgres access) | **UNKNOWN** |
| Indexes (15 expected) | Defined in `20260622_indexes.sql` | Not verified (no Postgres access) | **UNKNOWN** |
| RLS policies | Defined per migration | SELECT probes pass; INSERT blocked on ML | **PARTIAL** |

---

## 4. Generated Missing SQL

**File:** `supabase/migrations/20260622_audit_reconcile.sql`

This idempotent migration:

1. Grants `USAGE` + `ALL` on public schema objects to `anon`, `authenticated`, `service_role`
2. Ensures all 15 performance indexes exist (including HNSW vector index)
3. Ensures `data_source` columns on ML dataset tables
4. Enables RLS and creates missing policies on all 12 audited tables
5. Records migration versions in `supabase_migrations.schema_migrations` (if table exists)
6. Runs `NOTIFY pgrst, 'reload schema'` to refresh PostgREST cache

**Verification SQL:** `supabase/scripts/verify_database.sql` — run in Supabase SQL Editor to confirm indexes, RLS, grants, and migration history.

---

## 5. Apply Migrations Safely

No database password or Supabase access token was available in the environment. To apply:

### Option A — Supabase CLI (recommended)

```powershell
# 1. Login and link
npx supabase login
npx supabase link --project-ref ywfarmatbvuhxbyqymax

# 2. Dry-run first
npx supabase db push --dry-run

# 3. Apply (includes reconcile migration)
npx supabase db push
```

### Option B — SQL Editor

1. Open [Supabase Dashboard → SQL Editor](https://supabase.com/dashboard/project/ywfarmatbvuhxbyqymax/sql)
2. Paste contents of `supabase/migrations/20260622_audit_reconcile.sql`
3. Run
4. Run `supabase/scripts/verify_database.sql` to confirm

### Option C — Direct connection

```powershell
$env:SUPABASE_DB_PASSWORD = "<your-db-password>"
npx supabase db push --db-url "postgresql://postgres.ywfarmatbvuhxbyqymax:$env:SUPABASE_DB_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

---

## 6. Expected Indexes

From `20260622_indexes.sql` — verify with `verify_database.sql`:

| Index | Table |
|---|---|
| `trips_user_id_idx` | trips |
| `traveler_profiles_user_id_idx` | traveler_profiles |
| `budgets_trip_id_idx` | budgets |
| `budgets_user_id_idx` | budgets |
| `budget_breakdowns_budget_id_idx` | budget_breakdowns |
| `budget_breakdowns_user_id_idx` | budget_breakdowns |
| `itineraries_trip_id_idx` | itineraries |
| `itineraries_user_id_idx` | itineraries |
| `chat_sessions_user_id_idx` | chat_sessions |
| `trip_ratings_trip_id_idx` | trip_ratings |
| `learning_data_user_id_idx` | learning_data |
| `expenses_trip_id_idx` | expenses |
| `expenses_user_id_idx` | expenses |
| `item_feedback_item_id_type_idx` | item_feedback |
| `travel_memories_embedding_hnsw_idx` | travel_memories (HNSW) |

---

## 7. Expected RLS Policies (Audited Tables)

| Table | Policy | Command |
|---|---|---|
| `users` | Allow public read access to active users | SELECT (TRUE) |
| `users` | Allow users to update their own profile | UPDATE (auth.uid = uid) |
| `traveler_profiles` | Users can manage their own traveler profiles | ALL (auth.uid = user_id) |
| `trips` | Users can manage their own trips | ALL |
| `budgets` | Users can manage their own budgets | ALL |
| `itineraries` | Users can manage their own itineraries | ALL |
| `learning_data` | Users can manage their own learning data | ALL |
| `ml_trip_dataset` | Allow public access | ALL (TRUE) |
| `ml_budget_dataset` | Allow public access | ALL (TRUE) |
| `ml_activity_dataset` | Allow public access | ALL (TRUE) |
| `ml_budget_shadow_analytics` | Public insert + select | INSERT / SELECT |
| `ml_destination_shadow_analytics` | Public insert + select | INSERT / SELECT |
| `activity_model_predictions` | Allow public access | ALL (TRUE) |

---

## 8. Action Items

| Priority | Action | Status |
|---|---|---|
| P0 | Apply `20260622_audit_reconcile.sql` to fix API grants + schema cache | **Pending** (needs DB credentials) |
| P1 | Run `verify_database.sql` to confirm indexes + migration history | **Pending** |
| P2 | Re-run `node scripts/supabase-migration-audit.mjs` after apply | **Pending** |
| P3 | Confirm ML inserts succeed after reconcile | **Pending** |

---

## 9. Artifacts

| File | Description |
|---|---|
| `supabase/MIGRATION_AUDIT_REPORT.md` | This report |
| `supabase/MIGRATION_AUDIT_REPORT.json` | Machine-readable audit results |
| `supabase/migrations/20260622_audit_reconcile.sql` | Generated reconcile migration |
| `supabase/scripts/verify_database.sql` | Post-apply verification queries |
| `supabase/config.toml` | Supabase CLI project config |
| `scripts/supabase-migration-audit.mjs` | Repeatable remote audit script |

**No application code was modified.**

---

## 10. Migration File Naming Warning

All 16 local migration files share the same timestamp prefix (`20260622`). Supabase CLI uses this prefix as the migration `version` key, which can cause only one migration to be tracked when using `supabase db push`. If CLI push reports conflicts or skips migrations, either:

- Apply SQL manually via the Dashboard (Option B above), or
- Re-timestamp migration files with unique `YYYYMMDDHHMMSS` prefixes before CLI push.

The reconcile migration (`20260622_audit_reconcile.sql`) is idempotent and safe to run directly in the SQL Editor regardless of CLI version tracking.
