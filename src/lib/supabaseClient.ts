import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "./env";

export const supabase = isSupabaseConfigured
  ? createClient(env.supabaseUrl as string, env.supabasePublishableKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
