import { expect, type Page, test } from "@playwright/test";

async function seedSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "sb-wyyuklxvsvlsrlngwemu-auth-token",
      JSON.stringify({
        access_token: "token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: 4102444800,
        refresh_token: "refresh-token",
        user: { id: "user_1", email: "tester@example.com" }
      })
    );
  });
}

async function mockAccountRoutes(page: Page) {
  await page.route("**/rest/v1/user_profiles*", async (route) => {
    await route.fulfill({
      json: [
        {
          id: "user_1",
          display_name: "Sam",
          user_type: "student",
          onboarding_completed: true,
          created_at: "2026-05-18T10:00:00Z",
          updated_at: "2026-05-18T10:00:00Z"
        }
      ]
    });
  });

  await page.route("**/rest/v1/user_memory*", async (route) => {
    await route.fulfill({
      json: [
        {
          user_id: "user_1",
          preferred_genres: ["Mystery"],
          tone_style_preferences: "Cinematic",
          productivity_history_summary: null,
          active_quest_summary: null,
          previous_story_choices_summary: null,
          completed_quest_summaries: [],
          important_story_facts: [],
          created_at: "2026-05-18T10:00:00Z",
          updated_at: "2026-05-18T10:00:00Z"
        }
      ]
    });
  });
}

function activeQuest() {
  return {
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
  };
}

function questStartedResponse() {
  const quest = activeQuest();
  return {
    ...quest,
    current_turn: quest.current_turn
      ? {
          ...quest.current_turn,
          choices: []
        }
      : null
  };
}

test("core loop smoke path", async ({ page }) => {
  let taskCreated = false;
  let taskCompleted = false;
  let questStarted = false;

  await seedSession(page);
  await mockAccountRoutes(page);

  await page.route("**/api/tasks", async (route) => {
    if (route.request().method() === "POST") {
      taskCreated = true;
      await route.fulfill({ json: {} });
      return;
    }

    await route.fulfill({
      json: taskCreated
        ? [
            {
              id: "task_1",
              user_id: "user_1",
              title: "Finish report",
              description: null,
              due_date: null,
              status: taskCompleted ? "completed" : "pending",
              completed_at: taskCompleted ? "2026-05-18T10:00:00Z" : null,
              created_at: "2026-05-18T10:00:00Z",
              updated_at: "2026-05-18T10:00:00Z"
            }
          ]
        : []
    });
  });

  await page.route("**/api/tasks/task_1/complete", async (route) => {
    taskCompleted = true;
    await route.fulfill({
      json: {
        source_type: "task",
        source_id: "task_1",
        turns_awarded: 1,
        turns_added_to_balance: 1,
        balance_after: 1,
        reward_reason: "Nice work."
      }
    });
  });

  await page.route("**/api/habits", async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.route("**/api/story-turns/balance", async (route) => {
    await route.fulfill({
      json: {
        user_id: "user_1",
        available_turns: taskCompleted ? 1 : 0,
        max_turns: 10,
        created_at: "2026-05-18T10:00:00Z",
        updated_at: "2026-05-18T10:00:00Z"
      }
    });
  });

  await page.route("**/api/quests/active", async (route) => {
    await route.fulfill({ json: questStarted ? activeQuest() : null });
  });

  await page.route("**/api/quests", async (route) => {
    questStarted = true;
    await route.fulfill({ json: questStartedResponse() });
  });

  await page.goto("/tasks");
  await page.getByLabel("Title").fill("Finish report");
  await page.getByRole("button", { name: "Add task" }).click();
  await expect(page.getByText("Finish report")).toBeVisible();
  await page.getByRole("button", { name: "Complete" }).click();
  await expect(page.getByText(/Nice work/)).toBeVisible();

  await page.goto("/quest");
  await page.getByRole("button", { name: "Start quest" }).click();
  await expect(page.getByRole("heading", { name: "The Signal" })).toBeVisible();
});

test("active quest with no turns points the user back to productivity", async ({ page }) => {
  await seedSession(page);
  await mockAccountRoutes(page);

  await page.route("**/api/quests/active", async (route) => {
    await route.fulfill({ json: activeQuest() });
  });

  await page.route("**/api/story-turns/balance", async (route) => {
    await route.fulfill({
      json: {
        user_id: "user_1",
        available_turns: 0,
        max_turns: 10,
        created_at: "2026-05-18T10:00:00Z",
        updated_at: "2026-05-18T10:00:00Z"
      }
    });
  });

  await page.goto("/quest");
  await expect(page.getByRole("heading", { name: "The Signal" })).toBeVisible();
  await expect(page.getByText("Complete a task or habit to earn a story turn before choosing.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to tasks" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to habits" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Inspect the console/i })).toBeDisabled();
});

test("completed quest history is readable", async ({ page }) => {
  await seedSession(page);
  await mockAccountRoutes(page);

  await page.route("**/api/quests/history", async (route) => {
    await route.fulfill({
      json: [
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
      ]
    });
  });

  await page.goto("/history");
  await expect(page.getByRole("heading", { name: "Quest history" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Signal" })).toBeVisible();
  await expect(page.getByText("The signal was resolved.")).toBeVisible();
  await expect(page.getByText("The city was saved.")).toBeVisible();
});
