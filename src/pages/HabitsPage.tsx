import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth/useAuth";
import { RewardNotice } from "../components/RewardNotice";
import {
  archiveHabit,
  completeHabit,
  createHabit,
  listHabits,
  updateHabit
} from "../features/productivity/productivityApi";
import type { CompletionReward, Habit } from "../features/productivity/types";

export function HabitsPage() {
  const { session } = useAuth();
  const token = session?.access_token;
  const [habits, setHabits] = useState<Habit[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFrequency, setEditFrequency] = useState("daily");
  const [reward, setReward] = useState<CompletionReward | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshHabits = useCallback(async () => {
    if (!token) {
      return;
    }
    setIsLoading(true);
    try {
      setHabits(await listHabits(token));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load habits.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshHabits();
  }, [refreshHabits]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    setError(null);
    setReward(null);
    try {
      await createHabit(token, {
        title,
        description: description || null,
        frequency: frequency || null
      });
      setTitle("");
      setDescription("");
      setFrequency("daily");
      await refreshHabits();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create habit.");
    }
  }

  async function handleComplete(habitId: string) {
    if (!token) {
      return;
    }
    setError(null);
    try {
      setReward(await completeHabit(token, habitId));
      await refreshHabits();
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : "Could not complete habit.");
    }
  }

  async function handleArchive(habitId: string) {
    if (!token) {
      return;
    }
    setError(null);
    try {
      await archiveHabit(token, habitId);
      await refreshHabits();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "Could not archive habit.");
    }
  }

  function startEdit(habit: Habit) {
    setEditingHabitId(habit.id);
    setEditTitle(habit.title);
    setEditDescription(habit.description ?? "");
    setEditFrequency(habit.frequency ?? "daily");
  }

  async function handleUpdate(habitId: string) {
    if (!token) {
      return;
    }
    setError(null);
    try {
      await updateHabit(token, habitId, {
        title: editTitle,
        description: editDescription || null,
        frequency: editFrequency || null
      });
      setEditingHabitId(null);
      await refreshHabits();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update habit.");
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.2fr]">
      <form className="rounded-md border border-border bg-surface p-5" onSubmit={handleCreate}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Habits
        </p>
        <h2 className="text-xl font-semibold">Create a habit</h2>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Title
            <input
              className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Description
            <textarea
              className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Frequency
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              value={frequency}
              onChange={(event) => setFrequency(event.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
          <button
            className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            type="submit"
          >
            Add habit
          </button>
          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          <RewardNotice reward={reward} />
        </div>
      </form>

      <section className="rounded-md border border-border bg-surface p-5">
        <h2 className="text-xl font-semibold">Active habits</h2>
        {isLoading ? <p className="mt-3 text-sm text-muted-foreground">Loading habits...</p> : null}
        <div className="mt-5 grid gap-3">
          {habits.length === 0 && !isLoading ? (
            <p className="text-sm text-muted-foreground">No active habits yet.</p>
          ) : null}
          {habits.map((habit) => (
            <article key={habit.id} className="rounded-md border border-border bg-background p-4">
              {editingHabitId === habit.id ? (
                <div className="grid gap-3">
                  <input
                    className="h-10 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                  />
                  <textarea
                    className="min-h-20 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                  />
                  <select
                    className="h-10 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
                    value={editFrequency}
                    onChange={(event) => setEditFrequency(event.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      className="h-9 rounded-md border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground"
                      type="button"
                      onClick={() => void handleUpdate(habit.id)}
                    >
                      Save
                    </button>
                    <button
                      className="h-9 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground"
                      type="button"
                      onClick={() => setEditingHabitId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold">{habit.title}</h3>
                    {habit.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{habit.description}</p>
                    ) : null}
                    <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                      {habit.frequency ?? "routine"}
                      {habit.last_completed_on ? ` / Last done ${habit.last_completed_on}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="h-9 rounded-md border border-border px-3 text-sm font-medium"
                      type="button"
                      onClick={() => startEdit(habit)}
                    >
                      Edit
                    </button>
                    <button
                      className="h-9 rounded-md border border-border px-3 text-sm font-medium"
                      type="button"
                      onClick={() => void handleComplete(habit.id)}
                    >
                      Complete today
                    </button>
                    <button
                      className="h-9 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground"
                      type="button"
                      onClick={() => void handleArchive(habit.id)}
                    >
                      Archive
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
