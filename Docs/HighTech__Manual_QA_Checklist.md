# HighTech MVP Manual QA Checklist

## Account and Session

- Sign up with a new user.
- Complete onboarding and confirm redirect to dashboard.
- Log out and log back in.
- Confirm dashboard state persists after login.

## Productivity Loop

- Create a task with title, description, and optional due date.
- Edit the task.
- Complete the task and confirm a reward notice appears.
- Confirm task moves from active to completed.
- Create a daily habit.
- Complete the habit and confirm it moves to completed today.
- Confirm duplicate same-day habit completion is blocked.

## Story Turns

- Confirm earned turns increase after valid completions.
- Confirm turn balance never exceeds the cap.
- Confirm reward copy is supportive and avoids technical wording.

## Quest Flow

- Start a new quest.
- Confirm the quest has a title, premise, scene, and choices.
- With 0 turns, confirm choices are disabled and the page links back to tasks and habits.
- With turns available, select a choice and confirm exactly 1 turn is spent.
- Progress through several turns and confirm scenes and state continue coherently.
- Abandon a quest and confirm the confirmation step appears.
- Complete a quest and confirm it appears in History.

## Memory and Safety

- Update story preferences and confirm they persist.
- Confirm generated story content does not mention XP, levels, inventory, combat systems, coins, badges, or multiplayer.
- Temporarily remove the OpenAI key and confirm fallback behavior still allows task completion and quest creation.

## UI States

- Check dashboard empty states with no tasks, habits, or quest.
- Check loading states during reward evaluation and quest creation.
- Check error messaging when the API is unavailable.
- Review desktop and narrow mobile widths for overlapping text or broken controls.

## Release Readiness

- Run backend tests.
- Run frontend tests.
- Run Playwright smoke tests.
- Run a production frontend build.
