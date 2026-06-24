import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load env variables from .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join("=").trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    const { data: dests, error } = await supabase.from("destinations").select("name").limit(5);
    if (error) {
      console.error("Error fetching destinations:", error.message);
    } else {
      console.log("Destinations in database:", dests);
    }

    const { data: users, error: userError } = await supabase.from("users").select("uid").limit(5);
    if (userError) {
      console.error("Error fetching users:", userError.message);
    } else {
      console.log("Users in database count:", users?.length);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

check();
