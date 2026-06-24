import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(url, key);

async function main() {
  console.log("Testing users query...");
  const res1 = await supabase.from('users').select('*', { count: 'exact', head: true });
  console.log("users:", JSON.stringify(res1));

  console.log("Testing ml_trip_dataset query...");
  const res2 = await supabase.from('ml_trip_dataset').select('*', { count: 'exact', head: true });
  console.log("ml_trip_dataset:", JSON.stringify(res2));
}

main().catch(console.error);
