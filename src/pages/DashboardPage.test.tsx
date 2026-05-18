import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { DashboardPage } from "./DashboardPage";

vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({
    account: {
      profile: { display_name: "Sam" },
      memory: { preferred_genres: ["Mystery"], tone_style_preferences: "Cinematic" }
    },
    session: { access_token: "token" }
  })
}));

vi.mock("../features/productivity/productivityApi", () => ({
  listTasks: vi.fn().mockResolvedValue([
    {
      id: "task_1",
      user_id: "user_1",
      title: "Finish report",
      description: null,
      due_date: null,
      status: "pending",
      completed_at: null,
      created_at: "2026-05-18T10:00:00Z",
      updated_at: "2026-05-18T10:00:00Z"
    }
  ]),
  listHabits: vi.fn().mockResolvedValue([]),
  getStoryTurnBalance: vi.fn().mockResolvedValue({
    user_id: "user_1",
    available_turns: 0,
    max_turns: 10,
    created_at: "2026-05-18T10:00:00Z",
    updated_at: "2026-05-18T10:00:00Z"
  }),
  completeTask: vi.fn(),
  completeHabit: vi.fn()
}));

vi.mock("../features/quests/questsApi", () => ({
  getActiveQuest: vi.fn().mockResolvedValue(null)
}));

describe("DashboardPage", () => {
  it("shows the next action and productivity hub", async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Earn the next story turn")).toBeInTheDocument();
    expect(screen.getByText("Sam's workspace")).toBeInTheDocument();
    expect(screen.getByText("Finish report")).toBeInTheDocument();
  });
});
