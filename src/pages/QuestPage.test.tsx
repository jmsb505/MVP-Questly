import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { QuestPage } from "./QuestPage";

vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({
    account: { memory: null },
    session: { access_token: "token" }
  })
}));

vi.mock("../features/productivity/productivityApi", () => ({
  getStoryTurnBalance: vi.fn().mockResolvedValue({
    user_id: "user_1",
    available_turns: 0,
    max_turns: 10,
    created_at: "2026-05-18T10:00:00Z",
    updated_at: "2026-05-18T10:00:00Z"
  })
}));

vi.mock("../features/quests/questsApi", () => ({
  getActiveQuest: vi.fn().mockResolvedValue({
    id: "quest_1",
    title: "The Signal",
    genre: "mystery",
    tone: "focused",
    premise: "Find the signal.",
    main_objective: "Resolve it.",
    planned_length_in_turns: 15,
    status: "active",
    final_summary: null,
    outcome_summary: null,
    started_at: "2026-05-18T10:00:00Z",
    completed_at: null,
    current_turn: {
      id: "turn_1",
      quest_id: "quest_1",
      turn_index: 0,
      scene_text: "A signal pulses in the dark.",
      created_at: "2026-05-18T10:00:00Z",
      choices: [
        {
          id: "choice_1",
          quest_turn_id: "turn_1",
          quest_id: "quest_1",
          choice_text: "Inspect the console.",
          choice_type: "investigation",
          result_text: null,
          selected: false,
          selected_at: null,
          created_at: "2026-05-18T10:00:00Z"
        }
      ]
    },
    state: {
      quest_id: "quest_1",
      current_location: "Control room",
      known_facts: ["Signal detected"],
      open_questions: ["Who sent it?"],
      previous_choices_summary: null,
      progress_status: "started",
      turns_spent: 0
    }
  }),
  createQuest: vi.fn(),
  selectQuestChoice: vi.fn(),
  abandonActiveQuest: vi.fn()
}));

describe("QuestPage", () => {
  it("shows the no-turn state for an active quest", async () => {
    render(
      <MemoryRouter>
        <QuestPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("The Signal")).toBeInTheDocument();
    expect(screen.getByText("Complete a task or habit to earn a story turn before choosing.")).toBeInTheDocument();
  });
});
