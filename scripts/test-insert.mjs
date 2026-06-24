import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(url, key);

async function main() {
  console.log("Testing valid insert...");
  const res = await supabase.from('ml_trip_dataset').insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    trip_id: '00000000-0000-0000-0000-000000000000',
    features: { ageNormalized: 0.3, isLuxuryStyle: 0, isBudgetStyle: 1, durationDays: 5, travelersCount: 1, activityDensity: 2.0 },
    raw_data: { test: true },
    target_rating: 5,
    data_source: 'synthetic'
  }).select();
  console.log("Insert result:", JSON.stringify(res));
}

main().catch(console.error);
