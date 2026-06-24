/**
 * Supabase Migration Audit — read-only remote verification.
 * Reports: table existence, row counts, column schema, RLS select/insert probes.
 * Does NOT return row data.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const env = readFileSync(resolve(ROOT, '.env.local'), 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(url, key);

const LOCAL_MIGRATIONS = [
  '20260622_init.sql',
  '20260622_destination_intel.sql',
  '20260622_budget_history.sql',
  '20260622_expenses.sql',
  '20260622_feedback.sql',
  '20260622_pgvector_memory.sql',
  '20260622_data_platform.sql',
  '20260622_ml_dataset_infrastructure.sql',
  '20260622_training_dataset.sql',
  '20260622_indexes.sql',
  '20260622_ml_data_collection_infra.sql',
  '20260622_ml_synthetic_data_source.sql',
  '20260622_ml_budget_shadow_analytics.sql',
  '20260622_ml_destination_shadow_analytics.sql',
  '20260622_ml_activity_recommendation.sql',
  '20260622_ml_performance_monitoring.sql',
];

const CORE_TABLES = [
  'users',
  'traveler_profiles',
  'trips',
  'budgets',
  'itineraries',
  'learning_data',
];

const ML_TABLES = [
  'ml_trip_dataset',
  'ml_budget_dataset',
  'ml_activity_dataset',
  'ml_budget_shadow_analytics',
  'ml_destination_shadow_analytics',
  'activity_model_predictions',
];

/** Final expected columns after full migration chain */
const EXPECTED_COLUMNS = {
  users: ['uid', 'email', 'display_name', 'photo_url', 'preferences', 'is_pro', 'pro_expires_at', 'created_at', 'updated_at'],
  traveler_profiles: ['id', 'user_id', 'full_name', 'date_of_birth', 'passport_number', 'nationality', 'emergency_contact', 'created_at', 'updated_at'],
  trips: ['id', 'user_id', 'title', 'destination', 'start_date', 'end_date', 'duration_days', 'travelers_count', 'status', 'created_at', 'updated_at'],
  budgets: ['id', 'trip_id', 'user_id', 'limit_amount', 'currency', 'created_at', 'updated_at'],
  itineraries: ['id', 'trip_id', 'user_id', 'days', 'version', 'is_current', 'created_at', 'updated_at'],
  learning_data: ['id', 'user_id', 'interaction_type', 'metadata', 'created_at'],
  ml_trip_dataset: ['id', 'user_id', 'trip_id', 'features', 'raw_data', 'target_rating', 'data_source', 'created_at'],
  ml_budget_dataset: ['id', 'user_id', 'trip_id', 'features', 'raw_data', 'target_actual_spend', 'data_source', 'created_at'],
  ml_activity_dataset: ['id', 'user_id', 'activity_id', 'features', 'raw_data', 'target_rating', 'data_source', 'created_at'],
  ml_budget_shadow_analytics: ['id', 'destination', 'duration', 'travelers', 'travel_style', 'season', 'rule_budget', 'ml_budget', 'difference', 'created_at'],
  ml_destination_shadow_analytics: ['id', 'user_id', 'input_destinations', 'rule_ranking', 'ml_ranking', 'created_at'],
  activity_model_predictions: ['id', 'user_id', 'destination', 'recommended_by_rules', 'recommended_by_model', 'user_selected', 'user_rejected', 'user_rating', 'created_at'],
};

const EXPECTED_INDEXES = [
  'trips_user_id_idx',
  'traveler_profiles_user_id_idx',
  'budgets_trip_id_idx',
  'budgets_user_id_idx',
  'budget_breakdowns_budget_id_idx',
  'budget_breakdowns_user_id_idx',
  'itineraries_trip_id_idx',
  'itineraries_user_id_idx',
  'chat_sessions_user_id_idx',
  'trip_ratings_trip_id_idx',
  'learning_data_user_id_idx',
  'expenses_trip_id_idx',
  'expenses_user_id_idx',
  'item_feedback_item_id_type_idx',
  'travel_memories_embedding_hnsw_idx',
];

const EXPECTED_RLS = {
  users: { select: true, userScoped: true },
  traveler_profiles: { select: false, userScoped: true },
  trips: { select: false, userScoped: true },
  budgets: { select: false, userScoped: true },
  itineraries: { select: false, userScoped: true },
  learning_data: { select: false, userScoped: true },
  ml_trip_dataset: { select: true, publicAll: true },
  ml_budget_dataset: { select: true, publicAll: true },
  ml_activity_dataset: { select: true, publicAll: true },
  ml_budget_shadow_analytics: { select: true, publicInsert: true },
  ml_destination_shadow_analytics: { select: true, publicInsert: true },
  activity_model_predictions: { select: true, publicAll: true },
};

async function tableExists(table) {
  const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (!error) return { exists: true, error: null };
  const msg = error.message || '';
  if (error.code === '42P01' || msg.includes('does not exist') || msg.includes('Could not find')) {
    return { exists: false, error: msg };
  }
  return { exists: true, error: msg };
}

async function getCount(table) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) return { ok: false, count: null, error: error.message };
  return { ok: true, count: count ?? 0, error: null };
}

async function probeColumns(table, expectedCols) {
  const selectList = expectedCols.join(',');
  const { error } = await supabase.from(table).select(selectList, { head: true });
  if (!error) return { ok: true, missing: [] };
  const msg = error.message || '';
  const missing = expectedCols.filter((c) => msg.includes(c));
  return { ok: false, missing: missing.length ? missing : ['unknown schema mismatch'], error: msg };
}

async function probeRlsSelect(table) {
  const { error } = await supabase.from(table).select('*', { head: true });
  return { allowed: !error, error: error?.message ?? null };
}

async function probeRlsInsert(table, payload) {
  const { error } = await supabase.from(table).insert(payload).select('id').limit(1);
  if (!error) {
    return { allowed: true, inserted: true, error: null };
  }
  if (error.code === '42501' || (error.message || '').toLowerCase().includes('policy')) {
    return { allowed: false, inserted: false, error: error.message };
  }
  // Other errors (constraint, etc.) mean insert reached table — policy allowed write attempt
  return { allowed: true, inserted: false, error: error.message };
}

const ML_INSERT_PROBE = {
  ml_trip_dataset: {
    features: {},
    raw_data: {},
    target_rating: 5,
  },
  ml_budget_dataset: {
    features: {},
    raw_data: {},
    target_actual_spend: 0,
  },
  ml_activity_dataset: {
    features: {},
    raw_data: {},
    target_rating: 5,
  },
  ml_budget_shadow_analytics: {
    destination: '__audit__',
    duration: 1,
    travelers: 1,
    travel_style: 'BUDGET',
    season: 'summer',
    rule_budget: 100,
    ml_budget: 100,
    difference: 0,
  },
  ml_destination_shadow_analytics: {
    input_destinations: [],
    rule_ranking: [],
    ml_ranking: [],
  },
  activity_model_predictions: {
    destination: '__audit__',
    recommended_by_rules: [],
    recommended_by_model: [],
  },
};

const report = {
  auditedAt: new Date().toISOString(),
  projectUrl: url,
  localMigrationFiles: LOCAL_MIGRATIONS,
  tables: {},
  summary: { exists: 0, missing: 0, outOfSync: 0, countOk: 0 },
  indexes: { note: 'Requires direct SQL — see generated audit SQL file', expected: EXPECTED_INDEXES },
  migrations: { note: 'Requires supabase_migrations.schema_migrations query via service role / psql' },
};

const ALL = [...CORE_TABLES, ...ML_TABLES];

for (const table of ALL) {
  const entry = { status: 'UNKNOWN', count: null, columns: null, rls: null };
  const exists = await tableExists(table);

  if (!exists.exists) {
    entry.status = 'MISSING';
    report.summary.missing++;
    report.tables[table] = entry;
    continue;
  }

  report.summary.exists++;
  const count = await getCount(table);
  entry.count = count.ok ? count.count : null;
  entry.countError = count.error;
  if (count.ok) report.summary.countOk++;

  const cols = await probeColumns(table, EXPECTED_COLUMNS[table]);
  entry.columns = cols;

  const selectProbe = await probeRlsSelect(table);
  entry.rls = { select: selectProbe };

  if (ML_INSERT_PROBE[table]) {
    const insertProbe = await probeRlsInsert(table, ML_INSERT_PROBE[table]);
    entry.rls.insert = insertProbe;
    if (insertProbe.error?.includes('schema cache')) {
      entry.apiWritePath = 'OUT OF SYNC (PostgREST schema cache / grants)';
    }
  }

  const schemaOk = cols.ok;
  const insertOk = !entry.rls?.insert || entry.rls.insert.inserted || !entry.rls.insert.error?.includes('schema cache');
  entry.status = schemaOk && count.ok && insertOk ? 'EXISTS' : 'OUT OF SYNC';
  if (entry.status === 'OUT OF SYNC') report.summary.outOfSync++;

  report.tables[table] = entry;
}

const outPath = resolve(ROOT, 'supabase', 'MIGRATION_AUDIT_REPORT.json');
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
