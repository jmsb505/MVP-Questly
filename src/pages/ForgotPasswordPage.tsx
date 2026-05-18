import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export function ForgotPasswordPage() {
  const { isConfigured, session, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await requestPasswordReset(email);
      setMessage("If that email has an account, a password reset link is on the way.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Could not send reset email.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Account recovery
        </p>
        <h2 className="text-xl font-semibold">Reset password</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Enter the email address for your account and we will send a reset link.
        </p>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
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

          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          {message ? <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

          <button
            className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={!isConfigured || isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send reset link"}
          </button>
        </form>
      </section>

      <aside className="rounded-md border border-border bg-surface p-5 text-sm leading-6 text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">Back to sign in</h2>
        <p className="mt-3">
          Remembered your password?{" "}
          <Link className="font-medium text-primary hover:underline" to="/login">
            Return to sign in
          </Link>
          .
        </p>
      </aside>
    </div>
  );
}
