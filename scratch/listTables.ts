import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split(/\r?\n/)) {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith("#")) continue;
    const equalIdx = cleanLine.indexOf("=");
    if (equalIdx > 0) {
      const key = cleanLine.substring(0, equalIdx).trim();
      const val = cleanLine.substring(equalIdx + 1).trim();
      if (key === "VITE_SUPABASE_URL") supabaseUrl = val;
      if (key === "VITE_SUPABASE_ANON_KEY") supabaseAnonKey = val;
    }
  }
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Checking tables...");
  
  // Test querying public.users
  const { data: users, error: usersErr } = await supabase.from("users").select("uid").limit(1);
  console.log("users table:", usersErr ? `Error: ${usersErr.message}` : "Exists");

  // Test querying ml_trip_dataset
  const { data: mlTrip, error: mlTripErr } = await supabase.from("ml_trip_dataset").select("*").limit(1);
  console.log("ml_trip_dataset table:", mlTripErr ? `Error: ${mlTripErr.message}` : "Exists");

  // Test querying trips
  const { data: trips, error: tripsErr } = await supabase.from("trips").select("id").limit(1);
  console.log("trips table:", tripsErr ? `Error: ${tripsErr.message}` : "Exists");
}

test();
