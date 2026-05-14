import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../auth/useAuth";
import { EmptyState } from "../components/EmptyState";
import { ErrorPanel } from "../components/ErrorPanel";
import { LoadingRow } from "../components/LoadingRow";
import { RewardNotice } from "../components/RewardNotice";
import {
  archiveTask,
  completeTask,
  createTask,
  listTasks,
  updateTask
} from "../features/productivity/productivityApi";
import type { CompletionReward, Task } from "../features/productivity/types";

export function TasksPage() {
  const { session } = useAuth();
  const token = session?.access_token;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [reward, setReward] = useState<CompletionReward | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCompletionId, setPendingCompletionId] = useState<string | null>(null);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);

  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status !== "completed" && task.status !== "archived"),
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "completed"),
    [tasks]
  );

  const refreshTasks = useCallback(async () => {
    if (!token) {
      return;
    }
    setIsLoading(true);
    try {
      setTasks(await listTasks(token));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load tasks.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshTasks();
  }, [refreshTasks]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    setError(null);
    setReward(null);
    try {
      await createTask(token, {
        title,
        description: description || null,
        due_date: dueDate || null
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      await refreshTasks();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create task.");
    }
  }

  async function handleComplete(taskId: string) {
    if (!token) {
      return;
    }
    setError(null);
    setPendingCompletionId(taskId);
    try {
      setReward(await completeTask(token, taskId));
      await refreshTasks();
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : "Could not complete task.");
    } finally {
      setPendingCompletionId(null);
    }
  }

  async function handleArchive(taskId: string) {
    if (!token) {
      return;
    }
    setError(null);
    setPendingArchiveId(taskId);
    try {
      await archiveTask(token, taskId);
      await refreshTasks();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "Could not archive task.");
    } finally {
      setPendingArchiveId(null);
    }
  }

  function startEdit(task: Task) {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditDueDate(task.due_date ?? "");
  }

  async function handleUpdate(taskId: string) {
    if (!token) {
      return;
    }
    setError(null);
    try {
      await updateTask(token, taskId, {
        title: editTitle,
        description: editDescription || null,
        due_date: editDueDate || null
      });
      setEditingTaskId(null);
      await refreshTasks();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update task.");
    }
  }

  function renderTask(task: Task, completed = false) {
    const isCompleting = pendingCompletionId === task.id;
    const isArchiving = pendingArchiveId === task.id;
    const isBusy = pendingCompletionId !== null || pendingArchiveId !== null;

    return (
      <article
        key={task.id}
        className={`rounded-md border p-4 ${
          completed
            ? "border-emerald-200 bg-emerald-50"
            : "border-border bg-background"
        }`}
      >
        {editingTaskId === task.id ? (
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
            <input
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
              type="date"
              value={editDueDate}
              onChange={(event) => setEditDueDate(event.target.value)}
            />
            <div className="flex gap-2">
              <button
                className="h-9 rounded-md border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground"
                type="button"
                onClick={() => void handleUpdate(task.id)}
              >
                Save
              </button>
              <button
                className="h-9 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground"
                type="button"
                onClick={() => setEditingTaskId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                {completed ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : null}
                <h3 className="font-semibold">{task.title}</h3>
              </div>
              {task.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
              ) : null}
              <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                {completed ? "Completed" : "Open"}
                {task.due_date ? ` / Due ${task.due_date}` : ""}
                {task.completed_at ? ` / Done ${task.completed_at.slice(0, 10)}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!completed ? (
                <>
                  <button
                    className="h-9 rounded-md border border-border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    disabled={isBusy}
                    onClick={() => startEdit(task)}
                  >
                    Edit
                  </button>
                  <button
                    className="inline-flex h-9 min-w-28 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium disabled:cursor-wait disabled:opacity-60"
                    type="button"
                    disabled={isBusy}
                    onClick={() => void handleComplete(task.id)}
                  >
                    {isCompleting ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Evaluating
                      </>
                    ) : (
                      "Complete"
                    )}
                  </button>
                </>
              ) : null}
              <button
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground disabled:cursor-wait disabled:opacity-60"
                type="button"
                disabled={isBusy}
                onClick={() => void handleArchive(task.id)}
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
          Tasks
        </p>
        <h2 className="text-xl font-semibold">Create a task</h2>
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
            Due date
            <input
              className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>
          <button
            className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            type="submit"
          >
            Add task
          </button>
          {error ? <ErrorPanel message={error} /> : null}
          <RewardNotice reward={reward} />
        </div>
      </form>

      <section className="grid gap-5">
        <div className="rounded-md border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Active tasks</h2>
            <span className="text-xs text-muted-foreground">{activeTasks.length} open</span>
          </div>
          {isLoading ? <div className="mt-3"><LoadingRow label="Loading tasks..." /></div> : null}
          <div className="mt-5 grid gap-3">
            {activeTasks.length === 0 && !isLoading ? (
              <EmptyState
                title="No open tasks"
                description="Create a concrete task on the left when there is something specific to finish."
              />
            ) : null}
            {activeTasks.map((task) => renderTask(task))}
          </div>
        </div>

        <div className="rounded-md border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Completed tasks</h2>
            <span className="text-xs text-muted-foreground">{completedTasks.length} done</span>
          </div>
          <div className="mt-5 grid gap-3">
            {completedTasks.length === 0 ? (
              <EmptyState
                title="No completed tasks yet"
                description="Finished tasks will move here after their story turn reward is awarded."
              />
            ) : null}
            {completedTasks.map((task) => renderTask(task, true))}
          </div>
        </div>
      </section>
    </div>
  );
}
