import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getRequest } from "@tanstack/react-start/server";
import { parse, serialize } from "cookie";
import process from "node:process";

export function createSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase server environment variables are missing.");
  }

  const req = getRequest();
  const cookieHeader = req?.headers.get("cookie") || "";

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return Object.entries(parse(cookieHeader)).map(([name, value]) => ({
          name,
          value: value as string,
        }));
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            req?.headers.append(
              "Set-Cookie",
              serialize(name, value, options as CookieOptions)
            );
          });
        } catch (e) {
          console.error("Could not set response cookies in server environment", e);
        }
      },
    },
  });
}

