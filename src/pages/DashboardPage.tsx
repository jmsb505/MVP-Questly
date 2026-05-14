import { ArrowRight, CalendarDays, CheckCircle2, Circle, LoaderCircle, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { EmptyState } from "../components/EmptyState";
import { ErrorPanel } from "../components/ErrorPanel";
import { RewardNotice } from "../components/RewardNotice";
import { getActiveQuest } from "../features/quests/questsApi";
import type { Quest } from "../features/quests/types";
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
  const [quest, setQuest] = useState<Quest | null>(null);
  const [reward, setReward] = useState<CompletionReward | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCompletionId, setPendingCompletionId] = useState<string | null>(null);

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
      const [nextTasks, nextHabits, nextBalance, nextQuest] = await Promise.all([
        listTasks(token),
        listHabits(token),
        getStoryTurnBalance(token),
        getActiveQuest(token)
      ]);
      setTasks(nextTasks);
      setHabits(nextHabits);
      setBalance(nextBalance);
      setQuest(nextQuest);
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
  const habitsRemainingToday = useMemo(
    () => habits.filter((habit) => habit.last_completed_on !== todayKey),
    [habits, todayKey]
  );
  const nextAction = useMemo(() => {
    if (openTasks.length === 0 && habits.length === 0) {
      return {
        title: "Create the first action",
        description: "Add one task or habit so the reward loop has something real to track.",
        to: "/tasks",
        label: "Add task"
      };
    }

    if ((balance?.available_turns ?? 0) < 1) {
      return {
        title: "Earn the next story turn",
        description: "Complete an open task or one daily habit to unlock another story choice.",
        to: openTasks.length ? "/tasks" : "/habits",
        label: openTasks.length ? "Review tasks" : "Review habits"
      };
    }

    if (!quest) {
      return {
        title: "Start an adventure",
        description: "You have turns available. Start a quest and spend one on the first choice.",
        to: "/quest",
        label: "Start quest"
      };
    }

    return {
      title: "Continue the quest",
      description: "Spend one turn on the next choice and push the story forward.",
      to: "/quest",
      label: "Continue"
    };
  }, [balance?.available_turns, habits.length, openTasks.length, quest]);
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
    setPendingCompletionId(`task:${taskId}`);
    try {
      setReward(await completeTask(token, taskId));
      await refreshDashboard();
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : "Could not complete task.");
    } finally {
      setPendingCompletionId(null);
    }
  }

  async function handleCompleteHabit(habitId: string) {
    if (!token) {
      return;
    }
    setError(null);
    setPendingCompletionId(`habit:${habitId}`);
    try {
      setReward(await completeHabit(token, habitId));
      await refreshDashboard();
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : "Could not complete habit.");
    } finally {
      setPendingCompletionId(null);
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
          {error ? <div className="mt-4"><ErrorPanel message={error} /></div> : null}
          <div className="mt-4">
            <RewardNotice reward={reward} />
          </div>
        </div>

        <section className="grid gap-4 rounded-md border border-border bg-surface p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Next best action
            </p>
            <h3 className="mt-1 text-xl font-semibold">{nextAction.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{nextAction.description}</p>
            <Link
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
              to={nextAction.to}
            >
              {nextAction.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="rounded-md border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Story turns
            </p>
            <p className="mt-2 text-4xl font-semibold">
              {balance ? balance.available_turns : "-"}
              <span className="text-base font-normal text-muted-foreground">
                {" "} / {balance ? balance.max_turns : "-"}
              </span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Earned by completing real tasks and habits.
            </p>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-md border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Task list</h3>
              <span className="text-xs text-muted-foreground">{isLoading ? "Syncing" : "Live"}</span>
            </div>
            <div className="mt-4 grid gap-2">
              {openTasks.length === 0 ? (
                <EmptyState
                  title="No open tasks"
                  description="Add a task when there is a concrete one-off action to finish."
                  action={
                    <Link className="text-sm font-medium text-primary" to="/tasks">
                      Open tasks
                    </Link>
                  }
                />
              ) : null}
              {openTasks.map((task) => {
                const isCompleting = pendingCompletionId === `task:${task.id}`;
                return (
                  <button
                    key={task.id}
                    className="flex w-full items-start gap-3 rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-primary disabled:cursor-wait disabled:opacity-75"
                    type="button"
                    disabled={pendingCompletionId !== null}
                    onClick={() => void handleCompleteTask(task.id)}
                  >
                    {isCompleting ? (
                      <LoaderCircle className="mt-0.5 h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{task.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {isCompleting
                          ? "Evaluating reward..."
                          : task.due_date
                            ? `Due ${task.due_date}`
                            : "No due date"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-md border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Daily habit checklist</h3>
              <span className="text-xs text-muted-foreground">{todayKey}</span>
            </div>
            <div className="mt-4 grid gap-2">
              {habits.length === 0 ? (
                <EmptyState
                  title="No habits yet"
                  description="Add a daily or weekly routine that should keep coming back."
                  action={
                    <Link className="text-sm font-medium text-primary" to="/habits">
                      Open habits
                    </Link>
                  }
                />
              ) : null}
              {habits.map((habit) => {
                const isDone = habit.last_completed_on === todayKey;
                const isCompleting = pendingCompletionId === `habit:${habit.id}`;
                return (
                  <button
                    key={habit.id}
                    className="flex w-full items-start gap-3 rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-70"
                    type="button"
                    disabled={isDone || pendingCompletionId !== null}
                    onClick={() => void handleCompleteHabit(habit.id)}
                  >
                    {isCompleting ? (
                      <LoaderCircle className="mt-0.5 h-4 w-4 animate-spin text-primary" />
                    ) : isDone ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{habit.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {isCompleting ? "Evaluating reward..." : isDone ? "Completed today" : habit.frequency ?? "Routine"}
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
            {quest ? (
              <div>
                <p className="text-sm font-medium">{quest.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Turn {(quest.current_turn?.turn_index ?? 0) + 1} of {quest.planned_length_in_turns}
                </p>
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">
                  {quest.current_turn?.scene_text ?? quest.premise}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Start a quest, then spend earned turns on story choices.
              </p>
            )}
            <Link
              className="mt-4 inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium"
              to="/quest"
            >
              {quest ? "Continue quest" : "Start quest"}
            </Link>
          </div>
          <div className="mt-4 text-sm leading-6 text-muted-foreground">
            <p>Genres: {memory?.preferred_genres.length ? memory.preferred_genres.join(", ") : "None set"}</p>
            <p>Style: {memory?.tone_style_preferences ?? "None set"}</p>
            <p>Habits left today: {habitsRemainingToday.length}</p>
          </div>
        </section>
      </aside>
    </div>
  );
}
