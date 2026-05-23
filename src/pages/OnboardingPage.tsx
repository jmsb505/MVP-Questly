import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { saveOnboarding } from "../features/account/accountApi";
import type { UserType } from "../features/account/types";

const genreOptions = ["Fantasy", "Sci-fi", "Cyberpunk", "Mystery", "Adventure", "Horror-lite", "Cozy"];

export function OnboardingPage() {
  const { account, refreshAccount, user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(account.profile?.display_name ?? "");
  const [userType, setUserType] = useState<UserType>(account.profile?.user_type ?? "student");
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    account.memory?.preferred_genres.length ? account.memory.preferred_genres : ["Sci-fi", "Mystery"]
  );
  const [toneStylePreferences, setToneStylePreferences] = useState(
    account.memory?.tone_style_preferences ?? "Curious, focused, and not too dark."
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = useMemo(
    () => Boolean(user?.id && displayName.trim() && selectedGenres.length && toneStylePreferences.trim()),
    [displayName, selectedGenres.length, toneStylePreferences, user?.id]
  );

  function toggleGenre(genre: string) {
    setSelectedGenres((current) =>
      current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.id) {
      setError("You must be signed in to complete onboarding.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await saveOnboarding(user.id, {
        displayName,
        userType,
        preferredGenres: selectedGenres,
        toneStylePreferences
      });
      await refreshAccount();
      navigate("/dashboard", { replace: true });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save onboarding.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]" onSubmit={handleSubmit}>
      <section className="rounded-md border border-border bg-surface p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Preferences
        </p>
        <h2 className="text-xl font-semibold">Set your story preferences</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          These settings shape quest generation and can be updated as your taste changes.
        </p>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Display name
            <input
              className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            User type
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              value={userType}
              onChange={(event) => setUserType(event.target.value as UserType)}
            >
              <option value="student">Student</option>
              <option value="young_professional">Young professional</option>
              <option value="other">Other</option>
            </select>
          </label>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Preferred genres</legend>
            <div className="flex flex-wrap gap-2">
              {genreOptions.map((genre) => {
                const selected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                      selected
                        ? "border-primary/80 bg-primary/10 text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-accent hover:text-foreground"
                    }`}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="grid gap-2 text-sm font-medium">
            Story style
            <textarea
              className="min-h-28 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              value={toneStylePreferences}
              onChange={(event) => setToneStylePreferences(event.target.value)}
              required
            />
          </label>

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={!canSave || isSaving}
          >
            {isSaving ? "Saving..." : "Save preferences"}
          </button>
        </div>
      </section>

      <aside className="rounded-md border border-border bg-surface p-5 text-sm leading-6 text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">How this is used</h2>
        <p className="mt-3">
          Your profile and story preferences help new quests pick a genre, pacing,
          and style without storing long personal notes.
        </p>
      </aside>
    </form>
  );
}
