import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 
  (typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined) || 
  (typeof process !== "undefined" && process.env ? process.env.VITE_SUPABASE_URL : "") || 
  "";

const supabaseAnonKey = 
  (typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined) || 
  (typeof process !== "undefined" && process.env ? process.env.VITE_SUPABASE_ANON_KEY : "") || 
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables are missing.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
