import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { HistoryPage } from "./HistoryPage";

vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({ session: { access_token: "token" } })
}));

vi.mock("../features/quests/questsApi", () => ({
  listQuestHistory: vi.fn().mockResolvedValue([
    {
      id: "history_1",
      quest_id: "quest_1",
      title: "The Signal",
      genre: "mystery",
      final_summary: "The signal was resolved.",
      outcome_summary: "The city was saved.",
      completed_at: "2026-05-18T10:00:00Z",
      created_at: "2026-05-18T10:00:00Z"
    }
  ])
}));

describe("HistoryPage", () => {
  it("renders completed quest summaries", async () => {
    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("The Signal")).toBeInTheDocument();
    expect(screen.getByText("The signal was resolved.")).toBeInTheDocument();
    expect(screen.getByText("The city was saved.")).toBeInTheDocument();
  });
});
