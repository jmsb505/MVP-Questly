import { useCallback, useEffect, useState, type FormEvent } from "react";
import { RewardNotice } from "../components/RewardNotice";
import {
  archiveTask,
  completeTask,
  createTask,
  listTasks,
  updateTask
} from "../features/productivity/productivityApi";
import type { CompletionReward, Task } from "../features/productivity/types";
import { useAuth } from "../auth/useAuth";

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
    try {
      setReward(await completeTask(token, taskId));
      await refreshTasks();
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : "Could not complete task.");
    }
  }

  async function handleArchive(taskId: string) {
    if (!token) {
      return;
    }
    setError(null);
    try {
      await archiveTask(token, taskId);
      await refreshTasks();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "Could not archive task.");
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
          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          <RewardNotice reward={reward} />
        </div>
      </form>

      <section className="rounded-md border border-border bg-surface p-5">
        <h2 className="text-xl font-semibold">Active tasks</h2>
        {isLoading ? <p className="mt-3 text-sm text-muted-foreground">Loading tasks...</p> : null}
        <div className="mt-5 grid gap-3">
          {tasks.length === 0 && !isLoading ? (
            <p className="text-sm text-muted-foreground">No active tasks yet.</p>
          ) : null}
          {tasks.map((task) => (
            <article key={task.id} className="rounded-md border border-border bg-background p-4">
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
                    <h3 className="font-semibold">{task.title}</h3>
                    {task.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                    ) : null}
                    <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                      {task.status}
                      {task.due_date ? ` / Due ${task.due_date}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="h-9 rounded-md border border-border px-3 text-sm font-medium"
                      type="button"
                      onClick={() => startEdit(task)}
                    >
                      Edit
                    </button>
                    <button
                      className="h-9 rounded-md border border-border px-3 text-sm font-medium disabled:opacity-50"
                      type="button"
                      disabled={task.status === "completed"}
                      onClick={() => void handleComplete(task.id)}
                    >
                      Complete
                    </button>
                    <button
                      className="h-9 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground"
                      type="button"
                      onClick={() => void handleArchive(task.id)}
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
