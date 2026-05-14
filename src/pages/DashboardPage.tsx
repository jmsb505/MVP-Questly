import { CalendarDays, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { RewardNotice } from "../components/RewardNotice";
import {
  completeHabit,
  completeTask,
  getStoryTurnBalance,
  listHabits,
  listTasks
} from "../features/productivity/productivityApi";
import type { CompletionReward, Habit, StoryTurnBalance, Task } from "../features/productivity/types";

function getLocalDateKey(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function formatShortDate(dateKey: string) {
  return new Intl.DateTimeFormat("en", { weekday: "short", day: "numeric" }).format(
    new Date(`${dateKey}T12:00:00`)
  );
}

export function DashboardPage() {
  const { account, session } = useAuth();
  const token = session?.access_token;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [balance, setBalance] = useState<StoryTurnBalance | null>(null);
  const [reward, setReward] = useState<CompletionReward | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const todayKey = getLocalDateKey();
  const profile = account.profile;
  const memory = account.memory;

  const refreshDashboard = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [nextTasks, nextHabits, nextBalance] = await Promise.all([
        listTasks(token),
        listHabits(token),
        getStoryTurnBalance(token)
      ]);
      setTasks(nextTasks);
      setHabits(nextHabits);
      setBalance(nextBalance);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== "completed" && task.status !== "archived"),
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "completed"),
    [tasks]
  );
  const completedTodayCount = useMemo(
    () =>
      completedTasks.filter((task) => task.completed_at?.slice(0, 10) === todayKey).length +
      habits.filter((habit) => habit.last_completed_on === todayKey).length,
    [completedTasks, habits, todayKey]
  );
  const historyDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_item, index) => {
        const dateKey = getLocalDateKey(index - 6);
        const taskCount = completedTasks.filter((task) => task.completed_at?.slice(0, 10) === dateKey).length;
        const habitCount = habits.filter((habit) => habit.last_completed_on === dateKey).length;
        return { dateKey, taskCount, habitCount, total: taskCount + habitCount };
      }),
    [completedTasks, habits]
  );

  async function handleCompleteTask(taskId: string) {
    if (!token) {
      return;
    }
    setError(null);
    try {
      setReward(await completeTask(token, taskId));
      await refreshDashboard();
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : "Could not complete task.");
    }
  }

  async function handleCompleteHabit(habitId: string) {
    if (!token) {
      return;
    }
    setError(null);
    try {
      setReward(await completeHabit(token, habitId));
      await refreshDashboard();
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : "Could not complete habit.");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="grid gap-5">
        <div className="rounded-md border border-border bg-surface p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Productivity hub
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                {profile?.display_name ? `${profile.display_name}'s workspace` : "Today's workspace"}
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border border-border bg-background px-4 py-3">
                <p className="text-xl font-semibold">{openTasks.length}</p>
                <p className="text-xs text-muted-foreground">Open tasks</p>
              </div>
              <div className="rounded-md border border-border bg-background px-4 py-3">
                <p className="text-xl font-semibold">{habits.length}</p>
                <p className="text-xs text-muted-foreground">Habits</p>
              </div>
              <div className="rounded-md border border-border bg-background px-4 py-3">
                <p className="text-xl font-semibold">{completedTodayCount}</p>
                <p className="text-xs text-muted-foreground">Done today</p>
              </div>
            </div>
          </div>
          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <div className="mt-4">
            <RewardNotice reward={reward} />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-md border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Task list</h3>
              <span className="text-xs text-muted-foreground">{isLoading ? "Syncing" : "Live"}</span>
            </div>
            <div className="mt-4 grid gap-2">
              {openTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open tasks. Add tasks from the Tasks page.</p>
              ) : null}
              {openTasks.map((task) => (
                <button
                  key={task.id}
                  className="flex w-full items-start gap-3 rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-primary"
                  type="button"
                  onClick={() => void handleCompleteTask(task.id)}
                >
                  <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{task.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {task.due_date ? `Due ${task.due_date}` : "No due date"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Daily habit checklist</h3>
              <span className="text-xs text-muted-foreground">{todayKey}</span>
            </div>
            <div className="mt-4 grid gap-2">
              {habits.length === 0 ? (
                <p className="text-sm text-muted-foreground">No habits yet. Add habits from the Habits page.</p>
              ) : null}
              {habits.map((habit) => {
                const isDone = habit.last_completed_on === todayKey;
                return (
                  <button
                    key={habit.id}
                    className="flex w-full items-start gap-3 rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-70"
                    type="button"
                    disabled={isDone}
                    onClick={() => void handleCompleteHabit(habit.id)}
                  >
                    {isDone ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{habit.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {isDone ? "Completed today" : habit.frequency ?? "Routine"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <section className="rounded-md border border-border bg-surface p-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Recent activity</h3>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {historyDays.map((day) => (
              <div key={day.dateKey} className="rounded-md border border-border bg-background p-3 text-center">
                <p className="text-xs font-medium text-muted-foreground">{formatShortDate(day.dateKey)}</p>
                <p className="mt-2 text-xl font-semibold">{day.total}</p>
                <p className="text-[11px] text-muted-foreground">
                  {day.taskCount} tasks / {day.habitCount} habits
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>

      <aside className="grid gap-5 self-start">
        <section className="rounded-md border border-border bg-surface p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold">Quest side panel</h3>
          </div>
          <div className="mt-4 rounded-md border border-border bg-background p-4">
            <p className="text-3xl font-semibold">
              {balance ? balance.available_turns : "-"}
              <span className="text-sm font-normal text-muted-foreground">
                {" "} / {balance ? balance.max_turns : "-"} turns
              </span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Complete tasks and habits to unlock story choices. The quest engine starts in
              the next phases.
            </p>
          </div>
          <div className="mt-4 text-sm leading-6 text-muted-foreground">
            <p>Genres: {memory?.preferred_genres.length ? memory.preferred_genres.join(", ") : "None set"}</p>
            <p>Tone: {memory?.tone_style_preferences ?? "None set"}</p>
          </div>
        </section>
      </aside>
    </div>
  );
}
