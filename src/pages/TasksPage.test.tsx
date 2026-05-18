import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { TasksPage } from "./TasksPage";

const listTasks = vi.fn();
const createTask = vi.fn();
const completeTask = vi.fn();

vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({ session: { access_token: "token" } })
}));

vi.mock("../features/productivity/productivityApi", () => ({
  listTasks: (...args: unknown[]) => listTasks(...args),
  createTask: (...args: unknown[]) => createTask(...args),
  completeTask: (...args: unknown[]) => completeTask(...args),
  archiveTask: vi.fn(),
  updateTask: vi.fn()
}));

describe("TasksPage", () => {
  beforeEach(() => {
    listTasks
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
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
      ]);
    createTask.mockResolvedValue({});
    completeTask.mockResolvedValue({
      source_type: "task",
      source_id: "task_1",
      turns_awarded: 1,
      turns_added_to_balance: 1,
      balance_after: 1,
      reward_reason: "Nice work."
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates a task and shows it in active tasks", async () => {
    render(<TasksPage />);

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Finish report" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    await waitFor(() => expect(createTask).toHaveBeenCalled());
    expect(await screen.findByText("Finish report")).toBeInTheDocument();
  });
});
