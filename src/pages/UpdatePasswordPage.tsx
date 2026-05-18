import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export function UpdatePasswordPage() {
  const { isConfigured, session, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session && message) {
    return <Navigate to="/login" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      setMessage("Password updated. You can continue using your account.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update password.");
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
        <h2 className="text-xl font-semibold">Choose a new password</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Use the reset link from your email, then set a new password here.
        </p>

        {!session ? (
          <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Open this page from the password reset email so the recovery session can be verified.
          </p>
        ) : (
          <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium">
              New password
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
            <label className="grid gap-2 text-sm font-medium">
              Confirm password
              <input
                className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
                placeholder="Repeat password"
              />
            </label>

            {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            {message ? <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

            <button
              className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={!isConfigured || isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </section>

      <aside className="rounded-md border border-border bg-surface p-5 text-sm leading-6 text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">Need another link?</h2>
        <p className="mt-3">
          Return to{" "}
          <Link className="font-medium text-primary hover:underline" to="/forgot-password">
            password reset
          </Link>{" "}
          and request a fresh email.
        </p>
      </aside>
    </div>
  );
}
