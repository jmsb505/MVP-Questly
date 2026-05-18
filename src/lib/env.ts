export type FrontendEnv = {
  appName: string;
  appEnv: string;
  apiBaseUrl: string;
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  sentryDsn?: string;
  sentryTracesSampleRate: number;
};

export const env: FrontendEnv = {
  appName: import.meta.env.VITE_APP_NAME ?? "HighTech",
  appEnv: import.meta.env.VITE_APP_ENV ?? "development",
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL ??
    (import.meta.env.PROD ? "" : "http://localhost:8000"),
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  sentryTracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0)
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabasePublishableKey);
