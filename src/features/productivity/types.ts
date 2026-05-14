export type TaskStatus = "pending" | "active" | "completed" | "archived" | "abandoned";
export type HabitStatus = "pending" | "active" | "completed" | "archived" | "abandoned";

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: TaskStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Habit = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  frequency: string | null;
  status: HabitStatus;
  last_completed_on: string | null;
  created_at: string;
  updated_at: string;
};

export type StoryTurnBalance = {
  user_id: string;
  available_turns: number;
  max_turns: number;
  created_at: string;
  updated_at: string;
};

export type CompletionReward = {
  source_type: "task" | "habit";
  source_id: string;
  turns_awarded: number;
  turns_added_to_balance: number;
  balance_after: number;
  reward_reason: string;
};
