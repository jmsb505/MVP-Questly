import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { HabitsPage } from "./HabitsPage";

vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({ session: { access_token: "token" } })
}));

vi.mock("../features/productivity/productivityApi", () => ({
  listHabits: vi.fn().mockResolvedValue([
    {
      id: "habit_1",
      user_id: "user_1",
      title: "Practice Italian",
      description: null,
      frequency: "daily",
      status: "active",
      last_completed_on: new Date().toISOString().slice(0, 10),
      created_at: "2026-05-18T10:00:00Z",
      updated_at: "2026-05-18T10:00:00Z"
    }
  ]),
  createHabit: vi.fn(),
  completeHabit: vi.fn(),
  archiveHabit: vi.fn(),
  updateHabit: vi.fn()
}));

describe("HabitsPage", () => {
  it("shows habits completed today separately", async () => {
    render(<HabitsPage />);

    expect(await screen.findByText("Practice Italian")).toBeInTheDocument();
    expect(screen.getByText("Completed today")).toBeInTheDocument();
  });
});
