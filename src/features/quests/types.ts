export type QuestStatus = "pending" | "active" | "completed" | "archived" | "abandoned";
export type QuestChoiceType = "branching" | "progression" | "investigation" | "tone";

export type QuestChoice = {
  id: string;
  quest_turn_id: string;
  quest_id: string;
  choice_text: string;
  choice_type: QuestChoiceType;
  result_text: string | null;
  selected: boolean;
  selected_at: string | null;
  created_at: string;
};

export type QuestTurn = {
  id: string;
  quest_id: string;
  turn_index: number;
  scene_text: string;
  choices: QuestChoice[];
  created_at: string;
};

export type QuestState = {
  quest_id: string;
  current_location: string | null;
  known_facts: string[];
  open_questions: string[];
  previous_choices_summary: string | null;
  progress_status: string;
  turns_spent: number;
};

export type Quest = {
  id: string;
  title: string;
  genre: string | null;
  tone: string | null;
  premise: string | null;
  main_objective: string | null;
  planned_length_in_turns: number;
  status: QuestStatus;
  final_summary: string | null;
  outcome_summary: string | null;
  started_at: string;
  completed_at: string | null;
  current_turn: QuestTurn | null;
  state: QuestState | null;
};

export type ChoiceSelection = {
  quest: Quest;
  selected_choice: QuestChoice;
  consequence: string;
  turns_spent: number;
  balance_after: number;
  quest_completed: boolean;
};

export type CompletedQuestHistory = {
  id: string;
  quest_id: string;
  title: string;
  genre: string | null;
  final_summary: string | null;
  outcome_summary: string | null;
  completed_at: string;
  created_at: string;
};
