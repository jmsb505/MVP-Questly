export type UserType = "student" | "young_professional" | "other";

export type UserProfile = {
  id: string;
  display_name: string | null;
  user_type: UserType | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type UserMemory = {
  user_id: string;
  preferred_genres: string[];
  tone_style_preferences: string | null;
  productivity_history_summary: string | null;
  active_quest_summary: string | null;
  previous_story_choices_summary: string | null;
  completed_quest_summaries: unknown[];
  important_story_facts: unknown[];
  created_at: string;
  updated_at: string;
};

export type AccountState = {
  profile: UserProfile | null;
  memory: UserMemory | null;
};
