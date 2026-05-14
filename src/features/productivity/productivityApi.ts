import { apiRequest } from "../../lib/apiClient";
import type { CompletionReward, Habit, StoryTurnBalance, Task } from "./types";

export type TaskCreateInput = {
  title: string;
  description?: string | null;
  due_date?: string | null;
};

export type HabitCreateInput = {
  title: string;
  description?: string | null;
  frequency?: string | null;
};

export function listTasks(token: string) {
  return apiRequest<Task[]>("/api/tasks", token);
}

export function createTask(token: string, input: TaskCreateInput) {
  return apiRequest<Task>("/api/tasks", token, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function archiveTask(token: string, taskId: string) {
  return apiRequest<Task>(`/api/tasks/${taskId}`, token, {
    method: "PATCH",
    body: JSON.stringify({ status: "archived" })
  });
}

export function updateTask(token: string, taskId: string, input: Partial<TaskCreateInput>) {
  return apiRequest<Task>(`/api/tasks/${taskId}`, token, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function completeTask(token: string, taskId: string) {
  return apiRequest<CompletionReward>(`/api/tasks/${taskId}/complete`, token, {
    method: "POST"
  });
}

export function listHabits(token: string) {
  return apiRequest<Habit[]>("/api/habits", token);
}

export function createHabit(token: string, input: HabitCreateInput) {
  return apiRequest<Habit>("/api/habits", token, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function archiveHabit(token: string, habitId: string) {
  return apiRequest<Habit>(`/api/habits/${habitId}`, token, {
    method: "PATCH",
    body: JSON.stringify({ status: "archived" })
  });
}

export function updateHabit(token: string, habitId: string, input: Partial<HabitCreateInput>) {
  return apiRequest<Habit>(`/api/habits/${habitId}`, token, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function completeHabit(token: string, habitId: string) {
  return apiRequest<CompletionReward>(`/api/habits/${habitId}/complete`, token, {
    method: "POST"
  });
}

export function getStoryTurnBalance(token: string) {
  return apiRequest<StoryTurnBalance>("/api/story-turns/balance", token);
}
