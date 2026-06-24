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

const TABLES_TO_AUDIT = [
  "users",
  "traveler_profiles",
  "trips",
  "budgets",
  "itineraries",
  "learning_data",
  "ml_trip_dataset",
  "ml_budget_dataset",
  "ml_activity_dataset",
  "ml_budget_shadow_analytics",
  "ml_destination_shadow_analytics",
  "activity_model_predictions"
];

async function runAudit() {
  console.log("==================================================");
  console.log("Running Supabase Migration Audit...");
  console.log("Supabase URL:", supabaseUrl);
  console.log("==================================================");

  const results: Record<string, string> = {};

  for (const table of TABLES_TO_AUDIT) {
    try {
      const { error } = await supabase.from(table).select("*").limit(1);
      if (error) {
        if (error.message.includes("Could not find the table") || error.message.includes("does not exist")) {
          results[table] = "MISSING";
        } else {
          // If it's a permission or row-level security error, the table still exists!
          results[table] = `EXISTS (Select error: ${error.message})`;
        }
      } else {
        results[table] = "EXISTS (Ready)";
      }
    } catch (err: any) {
      results[table] = `ERROR: ${err.message}`;
    }
  }

  console.log("\nAudit Results:");
  for (const [table, status] of Object.entries(results)) {
    console.log(`  - ${table}: ${status}`);
  }
  console.log("==================================================");
}

runAudit();
