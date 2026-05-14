import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export function LoginPage() {
  const { isConfigured, session, signIn, signUp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";

  if (session) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === "sign-in") {
        await signIn(email, password);
        navigate(from, { replace: true });
      } else {
        const result = await signUp(email, password, displayName);
        setMessage(result);
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Supabase Auth
        </p>
        <h2 className="text-xl font-semibold">
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Phase 2 uses Supabase Auth as the account boundary for profiles, memory,
          tasks, turns, and quests.
        </p>

        <div className="mt-5 inline-flex rounded-md border border-border bg-background p-1">
          <button
            className={`rounded-sm px-3 py-2 text-sm font-medium ${
              mode === "sign-in" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
            type="button"
            onClick={() => setMode("sign-in")}
          >
            Sign in
          </button>
          <button
            className={`rounded-sm px-3 py-2 text-sm font-medium ${
              mode === "sign-up" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
            type="button"
            onClick={() => setMode("sign-up")}
          >
            Sign up
          </button>
        </div>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          {mode === "sign-up" ? (
            <label className="grid gap-2 text-sm font-medium">
              Display name
              <input
                className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Juan"
              />
            </label>
          ) : null}
          <label className="grid gap-2 text-sm font-medium">
            Email
            <input
              className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Password
            <input
              className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
            />
          </label>

          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          {message ? <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

          <button
            className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={!isConfigured || isSubmitting}
          >
            {isSubmitting ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
        </form>
      </section>

      <aside className="rounded-md border border-border bg-surface p-5 text-sm leading-6 text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">Configuration</h2>
        <p className="mt-3">
          {isConfigured
            ? "Supabase browser configuration is present."
            : "Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env, then restart the Vite dev server."}
        </p>
      </aside>
    </div>
  );
}
