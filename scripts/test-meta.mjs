import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(url, key);

async function main() {
  console.log("Testing querying information_schema.tables...");
  const res1 = await supabase.from('information_schema.tables').select('*');
  console.log("information_schema.tables:", JSON.stringify(res1));

  console.log("Testing querying pg_policies...");
  const res2 = await supabase.from('pg_policies').select('*');
  console.log("pg_policies:", JSON.stringify(res2));
}

main().catch(console.error);
