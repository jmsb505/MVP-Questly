export type FrontendEnv = {
  appName: string;
  apiBaseUrl: string;
  supabaseUrl?: string;
  supabasePublishableKey?: string;
};

export const env: FrontendEnv = {
  appName: import.meta.env.VITE_APP_NAME ?? "HighTech",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabasePublishableKey);
