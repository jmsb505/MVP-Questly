import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../auth/useAuth";
import { EmptyState } from "../components/EmptyState";
import { ErrorPanel } from "../components/ErrorPanel";
import { LoadingRow } from "../components/LoadingRow";
import { RewardNotice } from "../components/RewardNotice";
import {
  archiveHabit,
  completeHabit,
  createHabit,
  listHabits,
  updateHabit
} from "../features/productivity/productivityApi";
import type { CompletionReward, Habit } from "../features/productivity/types";

function getLocalDateKey() {
  return new Date().toISOString().slice(0, 10);
}

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
  const [pendingCompletionId, setPendingCompletionId] = useState<string | null>(null);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);
  const todayKey = getLocalDateKey();

  const habitsDueToday = useMemo(
    () => habits.filter((habit) => habit.last_completed_on !== todayKey),
    [habits, todayKey]
  );
  const habitsCompletedToday = useMemo(
    () => habits.filter((habit) => habit.last_completed_on === todayKey),
    [habits, todayKey]
  );

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
    setPendingCompletionId(habitId);
    try {
      setReward(await completeHabit(token, habitId));
      await refreshHabits();
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : "Could not complete habit.");
    } finally {
      setPendingCompletionId(null);
    }
  }

  async function handleArchive(habitId: string) {
    if (!token) {
      return;
    }
    setError(null);
    setPendingArchiveId(habitId);
    try {
      await archiveHabit(token, habitId);
      await refreshHabits();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "Could not archive habit.");
    } finally {
      setPendingArchiveId(null);
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

  function renderHabit(habit: Habit, doneToday = false) {
    const isCompleting = pendingCompletionId === habit.id;
    const isArchiving = pendingArchiveId === habit.id;
    const isBusy = pendingCompletionId !== null || pendingArchiveId !== null;

    return (
      <article
        key={habit.id}
        className={`rounded-md border p-4 ${
          doneToday
            ? "border-emerald-200 bg-emerald-50"
            : "border-border bg-background"
        }`}
      >
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
              <div className="flex items-center gap-2">
                {doneToday ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : null}
                <h3 className="font-semibold">{habit.title}</h3>
              </div>
              {habit.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{habit.description}</p>
              ) : null}
              <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                {habit.frequency ?? "routine"}
                {habit.last_completed_on ? ` / Last done ${habit.last_completed_on}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="h-9 rounded-md border border-border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={isBusy}
                onClick={() => startEdit(habit)}
              >
                Edit
              </button>
              {!doneToday ? (
                <button
                  className="inline-flex h-9 min-w-36 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium disabled:cursor-wait disabled:opacity-60"
                  type="button"
                  disabled={isBusy}
                  onClick={() => void handleComplete(habit.id)}
                >
                  {isCompleting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Evaluating
                    </>
                  ) : (
                    "Complete today"
                  )}
                </button>
              ) : null}
              <button
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground disabled:cursor-wait disabled:opacity-60"
                type="button"
                disabled={isBusy}
                onClick={() => void handleArchive(habit.id)}
              >
                {isArchiving ? "Archiving" : "Archive"}
              </button>
            </div>
          </div>
        )}
      </article>
    );
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
          {error ? <ErrorPanel message={error} /> : null}
          <RewardNotice reward={reward} />
        </div>
      </form>

      <section className="grid gap-5">
        <div className="rounded-md border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Today's checklist</h2>
            <span className="text-xs text-muted-foreground">{todayKey}</span>
          </div>
          {isLoading ? <div className="mt-3"><LoadingRow label="Loading habits..." /></div> : null}
          <div className="mt-5 grid gap-3">
            {habitsDueToday.length === 0 && !isLoading ? (
              <EmptyState
                title={habits.length ? "All habits done today" : "No active habits yet"}
                description={
                  habits.length
                    ? "Completed habits are listed below and will be ready again tomorrow."
                    : "Create a repeatable habit on the left to build a daily checklist."
                }
              />
            ) : null}
            {habitsDueToday.map((habit) => renderHabit(habit))}
          </div>
        </div>

        <div className="rounded-md border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Completed today</h2>
            <span className="text-xs text-muted-foreground">{habitsCompletedToday.length} done</span>
          </div>
          <div className="mt-5 grid gap-3">
            {habitsCompletedToday.length === 0 ? (
              <EmptyState
                title="Nothing checked off yet"
                description="Complete a habit from today's checklist and it will move here."
              />
            ) : null}
            {habitsCompletedToday.map((habit) => renderHabit(habit, true))}
          </div>
        </div>
      </section>
    </div>
  );
}
