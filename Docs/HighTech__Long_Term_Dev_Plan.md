# HighTech MVP Long-Term Development Plan
## Gamified Productivity Quest App

**Date:** May 14, 2026

---

## 1. Plan Overview

This document defines the long-term development plan for the HighTech MVP. The plan is based on the existing MVP scope, gameplay loop, data model, turn reward system, AI architecture, and tool stack documents.

## Current Development Status

- Overall MVP status: `In development`
- Current phase: `Phase 9 - Deployment and Closed Beta`
- Phase 1 status: `Complete`
- Phase 2 status: `Complete`
- Phase 3 status: `Complete`
- Phase 4 status: `Complete`
- Phase 5 status: `Complete`
- Phase 6 status: `Complete`
- Phase 7 status: `Complete`
- Phase 8 status: `Complete`
- Phase 9 status: `Ongoing`
- Started date: `May 14, 2026`
- Phase 1 completed date: `May 14, 2026`
- Phase 2 completed date: `May 14, 2026`
- Phase 3 completed date: `May 14, 2026`
- Phase 4 started date: `May 14, 2026`
- Phase 4 completed date: `May 14, 2026`
- Phase 5 started date: `May 14, 2026`
- Phase 5 completed date: `May 14, 2026`
- Phase 6 started date: `May 14, 2026`
- Phase 6 completed date: `May 18, 2026`
- Phase 7 started date: `May 18, 2026`
- Phase 7 completed date: `May 18, 2026`
- Phase 8 started date: `May 18, 2026`
- Phase 8 completed date: `May 18, 2026`
- Phase 9 started date: `May 18, 2026`

The MVP should validate one core hypothesis:

> Users may feel more motivated to complete tasks and habits if each completed productivity action unlocks a small interactive story decision.

The product should remain focused on the loop:

**Task or habit completion -> 1-3 story turns -> branching story choice -> quest progression**

The MVP is not a full RPG, habit tracker, project management system, or long-campaign storytelling platform. It is a lightweight productivity app where real action creates narrative momentum.

---

## 2. Core Product Goals

### 2.1 Primary Goal

Build a working MVP that lets users:

- Create tasks and habits.
- Complete real productivity actions.
- Earn story turns from completed actions.
- Spend story turns on AI-generated story choices.
- Progress through short, coherent quests.
- Complete quests and view past quest outcomes.

### 2.2 Success Criteria

The MVP is successful if early users:

- Understand the productivity-to-story loop quickly.
- Complete tasks or habits because they want to continue the story.
- Return to active quests after earning story turns.
- Find the AI-generated story choices coherent and interesting.
- Trust that quest state remains consistent between turns.
- Experience story turns as a meaningful reward.

### 2.3 Product Constraints

The MVP must intentionally exclude:

- XP, levels, stats, skill trees, inventory, combat, coins, badges, and multiplayer.
- Focus sessions and calendar integrations.
- Native mobile apps.
- Long campaigns.
- Deep psychological profiling.
- Complex autonomous AI memory.
- Fully personalized long-term narrative universes.

---

## 3. Technical Stack

### 3.1 Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### 3.2 Backend

- Python
- FastAPI
- Vercel Functions for MVP deployment
- Pydantic for backend validation

### 3.3 Database and Auth

- Supabase Auth
- Supabase Postgres
- Row Level Security policies
- Supabase CLI for local development and migrations

### 3.4 AI

- OpenAI API
- Structured Outputs
- Application-owned state as the source of truth

### 3.5 Testing, Observability, and Analytics

- pytest for backend tests
- Vitest for frontend unit/component tests
- Playwright for end-to-end tests later in MVP development
- Sentry when testers begin using the app
- Internal analytics event tables in Supabase

---

## 4. Development Phases

## Phase 1: Project Foundation

### Goal

Create the base application structure, development workflow, and deployment-ready foundations.

### Main Tasks

- Initialize the frontend application.
- Initialize the backend API application.
- Configure shared environment conventions.
- Prepare Supabase local and hosted workflows.
- Add baseline developer tooling.

### Subtasks

#### Frontend Setup

- Create a Vite React TypeScript app.
- Configure Tailwind CSS.
- Install and configure shadcn/ui.
- Define base layout structure.
- Create route structure for public, auth, and app pages.
- Add placeholder pages for login, onboarding, dashboard, tasks, habits, quest, and history.
- Add frontend environment variable conventions.

#### Backend Setup

- Create a FastAPI app structured for Vercel Functions.
- Add health check endpoint.
- Add API routing structure for tasks, habits, turns, quests, memory, and auth helpers.
- Add Pydantic request and response models.
- Add backend environment variable conventions.
- Add OpenAI and Supabase client configuration placeholders.

#### Repository Tooling

- Add package scripts for frontend development, linting, typechecking, and testing.
- Add backend test command using pytest.
- Add basic project README setup instructions.
- Add `.env.example` files for frontend and backend.
- Add formatting and linting conventions.

### Deliverables

- Running local frontend.
- Running local backend.
- Basic health check.
- Documented environment setup.
- Clean project structure ready for feature development.

### Acceptance Criteria

- A developer can install dependencies and run the frontend locally.
- A developer can run the backend health endpoint locally.
- Environment variables are documented.
- The repo has clear commands for linting, typechecking, and tests.

---

## Phase 2: Auth, Profiles, and Core Database

### Goal

Implement authenticated user ownership and the core database schema needed for the MVP loop.

### Main Tasks

- Set up Supabase Auth.
- Create database tables.
- Create RLS policies.
- Add profile and memory initialization.
- Add backend authenticated user helpers.

### Subtasks

#### Authentication

- Implement sign-up.
- Implement login.
- Implement logout.
- Implement protected frontend routes.
- Store authenticated session in the frontend Supabase client.
- Pass authenticated requests to backend endpoints.

#### Core Tables

Create tables for:

- User profiles.
- User memory.
- Tasks.
- Habits.
- Productivity events.
- Story turn balances.
- Story turn transactions.
- Quests.
- Quest turns.
- Quest choices.
- Quest state.
- Completed quest history.
- AI generation logs.
- Internal analytics events.

#### RLS and Ownership

- Enable RLS on user-owned tables.
- Add policies so users can only access their own rows.
- Add insert policies tied to authenticated users.
- Add update policies that prevent cross-user changes.
- Validate ownership in backend service methods.

#### Profile and Memory Initialization

- Create a profile when a user signs up.
- Create default user memory when a profile is created.
- Create default story turn balance with `available_turns = 0` and `max_turns = 10`.

### Deliverables

- Working auth flow.
- Supabase migration files.
- RLS-protected data model.
- Profile and memory initialization.

### Acceptance Criteria

- Users can sign up, log in, and log out.
- Users cannot read or mutate another user's records.
- New users automatically receive a profile, memory record, and turn balance.

---

## Phase 3: Productivity System

### Goal

Build the task and habit systems that feed the productivity-to-story loop.

### Main Tasks

- Implement task CRUD.
- Implement habit CRUD.
- Implement completion flows.
- Create productivity event snapshots.
- Award deterministic fallback story turns.

### Subtasks

#### Task Management

- Create task.
- Edit task title, description, due date, and status.
- Archive task.
- Complete task.
- Prevent duplicate completion rewards for the same task completion.

#### Habit Management

- Create habit.
- Edit habit title, description, frequency, and status.
- Archive habit.
- Complete habit for the current day.
- Prevent duplicate same-day habit completion rewards unless a future rule allows it.

#### Productivity Events

- On completion, create a productivity event snapshot.
- Store action type, title, description, completion timestamp, classification, complexity, meaningfulness, turns awarded, and reward reason.
- Keep productivity event records immutable after creation except for controlled system corrections.

#### Deterministic Reward Fallback

- Award at least 1 story turn for a valid completed action.
- Cap available turns at 10.
- Create a story turn transaction for every earned turn change.

### Deliverables

- Task and habit APIs.
- Task and habit frontend views.
- Completion flow with reward feedback.
- Productivity event records.
- Story turn balance updates.

### Acceptance Criteria

- Users can create, edit, archive, and complete tasks.
- Users can create, edit, archive, and complete habits.
- Completing a valid action creates a productivity event.
- Completing a valid action creates an earned turn transaction.
- Story turn balance never exceeds 10.

---

## Phase 4: Story Turn Reward Engine

### Goal

Replace the basic deterministic reward path with an AI-assisted evaluator while keeping safe fallback behavior.

### Main Tasks

- Implement productivity action evaluator.
- Use OpenAI Structured Outputs.
- Validate evaluator responses.
- Store reward reasoning.
- Keep deterministic fallback behavior.

### Subtasks

#### AI Evaluator

- Send completed action context to the evaluator.
- Include action type, title, description, user type, and lightweight productivity context.
- Request structured output with classification, complexity, meaningfulness, turns awarded, and reason.
- Restrict `turns_awarded` to 1, 2, or 3.

#### Validation

- Validate AI response with Pydantic.
- Reject invalid enum values.
- Reject rewards outside the 1-3 range.
- Default to 1 turn when evaluation fails.
- Log failed evaluations for debugging.

#### Anti-Abuse Rules

- Do not reward task or habit creation.
- Give vague but valid actions a conservative reward.
- Keep feedback supportive and constructive.
- Avoid punitive or shaming language.

#### Transaction Integrity

- Ensure every turn award has a transaction record.
- Ensure balance updates and transaction creation happen together.
- Prevent negative balances.
- Preserve a full audit trail for earned, spent, and adjusted turns.

### Deliverables

- AI evaluator service.
- Structured evaluator schema.
- Logged AI evaluation attempts.
- Reward feedback shown in the UI.

### Acceptance Criteria

- Specific meaningful actions can earn 2-3 turns.
- Small valid actions earn 1 turn.
- AI failures safely award 1 turn.
- All turn awards are traceable through transactions.

---

## Phase 5: Quest and Narrative Engine

### Goal

Build the quest system that turns earned story turns into engaging branching narrative progress.

### Main Tasks

- Implement quest creation.
- Implement narrative turn generation.
- Implement choice selection.
- Implement choice resolution.
- Persist quest state outside the AI model.
- Complete quests after a bounded number of turns.

### Subtasks

#### Quest Creation

- Let users choose or confirm genre and tone preferences.
- Generate a videogame-style quest setup when no active quest exists.
- Store quest title, genre, tone, premise, main objective, planned length, and status.
- Store initial quest state with current location, known facts, open questions, previous choices summary, and progress status.

#### Narrative Turn Generation

- Generate a scene from current quest state.
- Generate 2-3 choices per scene.
- Store scene text and choices before display.
- Support choice types: branching, progression, investigation, and tone.
- Avoid excluded mechanics such as stats, combat systems, inventory, and XP.

#### Choice Selection and Spending

- Require at least 1 available story turn to select a choice.
- Deduct exactly 1 turn per selected choice.
- Create a spent turn transaction.
- Mark selected choice as selected.
- Prevent selecting multiple choices for the same quest turn unless explicitly designed later.

#### Choice Resolution

- Resolve selected choice using AI.
- Store consequence text.
- Store new story facts.
- Update quest state.
- Generate next scene and choices if the quest continues.
- Mark quest completed when it reaches its planned ending.

#### Quest Completion

- Change quest status to `completed`.
- Create completed quest history.
- Store final summary and outcome.
- Update user memory with completed quest summary.

### Deliverables

- Quest APIs.
- Quest frontend play view.
- Active quest state persistence.
- Completed quest history.
- Turn spending flow.

### Acceptance Criteria

- Users can start a 15-turn or longer quest.
- Users can spend turns on choices.
- Each selected choice costs exactly 1 turn.
- Quest state remains coherent across multiple choices.
- Completed quests are saved to history.

---

## Phase 6: Frontend MVP Experience

### Goal

Create a clear, usable MVP interface that helps users move through the productivity-to-story loop with minimal friction.

### Main Tasks

- Build onboarding.
- Build main dashboard.
- Build task and habit views.
- Build quest play view.
- Build completed history view.
- Add empty, loading, error, and no-turn states.

### Subtasks

#### Onboarding

- Capture user type: student, young professional, or other.
- Capture preferred genres.
- Capture tone and style preferences.
- Save preferences to profile and user memory.
- Route completed users to dashboard.

#### Dashboard

- Show current story turn balance.
- Show active quest summary.
- Show next available quest action.
- Show task list summary.
- Show habit list summary.
- Highlight recently earned turns.

#### Task and Habit Views

- Add creation forms.
- Add edit flows.
- Add archive actions.
- Add completion actions.
- Show reward result after completion.
- Show completed or archived state clearly.

#### Quest View

- Show active quest title.
- Show current scene.
- Show available choices.
- Disable choices when the user has 0 turns.
- Show selected choice result.
- Show quest completion result.
- Keep the interface readable for short mobile-style text sessions.

#### History View

- Show completed quest titles.
- Show completion dates.
- Show final summaries and outcomes.
- Keep history simple and read-only for MVP.

### Deliverables

- Usable frontend MVP experience.
- Clear navigation.
- Core loop visible from dashboard.
- Polished baseline empty and error states.

### Acceptance Criteria

- A new user can understand what to do next from the dashboard.
- A user can complete the full loop without developer assistance.
- No-turn state clearly explains that productivity actions unlock story progress.
- Loading and error states do not break the loop.

---

## Phase 7: Memory, Continuity, and AI Safety

### Goal

Keep stories coherent and safe while preserving only the minimum user information needed for continuity.

### Main Tasks

- Implement structured user memory updates.
- Implement AI output validation.
- Add retry and fallback behavior.
- Log AI inputs and outputs for debugging.
- Keep memory minimal and privacy-conscious.

### Subtasks

#### User Memory

- Store preferred genres.
- Store tone and style preferences.
- Store productivity history summary.
- Store active quest summary.
- Store previous story choices summary.
- Store completed quest summaries.
- Store important discovered story facts.

#### Memory Update Points

- Update productivity summary after task or habit completion.
- Update active quest summary after choice resolution.
- Update completed quest history after quest completion.
- Avoid storing unnecessary raw personal details.

#### Output Validation

- Validate generated JSON shape.
- Validate required fields.
- Reject malformed responses.
- Reject contradictions with known quest facts when detectable.
- Reject excluded mechanics such as XP, levels, stats, skill trees, inventory, combat, and multiplayer.

#### Fallbacks

- For evaluator failure, award 1 story turn.
- For quest planner failure, show retry and log the error.
- For narrative generation failure, use a simple safe template or ask the user to retry.
- For choice resolution failure, preserve previous valid quest state.
- For memory update failure, keep the previous valid memory.

### Deliverables

- Structured user memory service.
- AI validator service.
- AI generation logs.
- Safe fallback paths.

### Acceptance Criteria

- AI output cannot corrupt source-of-truth state.
- Memory improves continuity without becoming a complex autonomous system.
- Failed AI calls do not lose turn balances, quest state, or completed actions.

---

## Phase 8: Testing and Quality

### Goal

Add enough automated and manual testing to support a closed beta release.

### Main Tasks

- Add backend tests.
- Add frontend tests.
- Add end-to-end smoke tests.
- Mock AI calls.
- Create manual QA checklist.

### Subtasks

#### Backend Tests

- Test auth ownership helpers.
- Test task and habit CRUD.
- Test task completion event creation.
- Test habit completion event creation.
- Test reward transactions.
- Test story turn cap.
- Test no negative balances.
- Test quest creation.
- Test choice spending.
- Test quest completion.
- Test AI fallback behavior.

#### Frontend Tests

- Test dashboard rendering.
- Test task creation form.
- Test habit creation form.
- Test completion reward feedback.
- Test quest choice states.
- Test no-turn state.
- Test completed quest history view.

#### End-to-End Tests

- Sign up or log in as test user.
- Complete onboarding.
- Create a task.
- Complete the task.
- Confirm turns are earned.
- Start a quest.
- Select a choice.
- Confirm one turn is spent.
- Confirm quest state updates.

#### AI Test Strategy

- Mock OpenAI responses in automated tests.
- Include valid structured outputs.
- Include malformed structured outputs.
- Include failed API call scenarios.
- Include outputs that mention excluded mechanics.

#### Manual QA Checklist

- New user onboarding.
- Returning user dashboard.
- Task completion.
- Habit completion.
- Reward explanation clarity.
- No-turn quest state.
- Quest creation.
- Multiple story choices.
- Quest completion.
- History display.
- Logout and login persistence.

### Deliverables

- Backend test suite.
- Frontend test suite.
- E2E smoke test.
- Manual QA checklist.

### Acceptance Criteria

- Core loop tests pass.
- AI failures are covered by tests.
- RLS-sensitive flows are tested.
- Manual QA can be followed by a non-developer tester.

---

## Phase 9: Deployment and Closed Beta

### Goal

Deploy the MVP, observe early tester behavior, and evaluate whether the core loop is working.

### Main Tasks

- Deploy frontend and backend.
- Connect production Supabase.
- Configure environment variables.
- Enable observability.
- Add internal analytics.
- Run a closed tester cohort.

### Subtasks

#### Deployment

- Deploy frontend to Vercel.
- Deploy FastAPI backend through Vercel Functions.
- Configure production Supabase project.
- Apply production database migrations.
- Confirm RLS is enabled in production.
- Configure OpenAI API key securely.

#### Observability

- Add Sentry when testers start using the app.
- Track backend errors.
- Track frontend errors.
- Log AI generation failures.
- Monitor failed reward or quest flows.

#### Analytics

Track internal events for:

- User sign-up.
- Onboarding completion.
- Task creation.
- Task completion.
- Habit creation.
- Habit completion.
- Turns earned.
- Turns spent.
- Quest created.
- Quest choice selected.
- Quest completed.
- User return sessions.

#### Closed Beta

- Recruit a small group of students and young professionals.
- Give testers a short onboarding explanation.
- Ask testers to use the app for real tasks and habits.
- Review whether users return to continue quests.
- Review whether story turns motivate real completions.
- Collect qualitative feedback on story quality and product clarity.

### Deliverables

- Production MVP deployment.
- Internal analytics dashboard or query set.
- Error monitoring.
- Closed beta feedback summary.

### Acceptance Criteria

- Testers can use the MVP without local development setup.
- Core loop works in production.
- Product team can measure task completions, turns earned, turns spent, and quest completions.
- Feedback identifies whether to continue, pivot, or reduce scope further.

---

## 5. Public APIs and Interfaces

## 5.1 Backend Endpoints

### Tasks

- `POST /api/tasks`
- `GET /api/tasks`
- `PATCH /api/tasks/{id}`
- `POST /api/tasks/{id}/complete`

### Habits

- `POST /api/habits`
- `GET /api/habits`
- `PATCH /api/habits/{id}`
- `POST /api/habits/{id}/complete`

### Story Turns

- `GET /api/story-turns/balance`

### Quests

- `GET /api/quests/active`
- `POST /api/quests`
- `POST /api/quests/{id}/choices/{choice_id}/select`
- `GET /api/quests/history`

### User Memory

- `GET /api/user-memory`
- `PATCH /api/user-memory`

## 5.2 Core Persisted Types

- `UserProfile`
- `UserMemory`
- `Task`
- `Habit`
- `ProductivityEvent`
- `StoryTurnBalance`
- `StoryTurnTransaction`
- `Quest`
- `QuestTurn`
- `QuestChoice`
- `QuestState`
- `CompletedQuestHistory`
- `AIGenerationLog`

## 5.3 AI Structured Outputs

- Productivity evaluation output.
- Quest planning output.
- Narrative turn generation output.
- Choice resolution output.
- Output validation result.

---

## 6. Data Model Implementation Notes

### 6.1 Source of Truth

The application database is the source of truth. The AI model generates content and proposes structured updates, but the app decides what is persisted.

### 6.2 Story Turn Rules

- Task or habit creation awards 0 turns.
- Valid completion awards 1-3 turns.
- Each quest choice costs exactly 1 turn.
- Max stored turns is 10.
- Turn balances cannot be negative.
- Every balance change must have a transaction record.

### 6.3 Quest State Rules

Store quest state explicitly, including:

- Current location.
- Known facts.
- Open questions.
- Previous choices summary.
- Progress status.
- Planned length.
- Turns spent in current quest.

### 6.4 Memory Rules

User memory should remain lightweight and structured. Prefer concise summaries over raw logs.

---

## 7. Test Scenarios

### Core Loop

- A new user can onboard, create a task, complete it, earn turns, and start a quest.
- Completing a vague task awards a conservative reward and stores a supportive explanation.
- Completing a meaningful task can award more than 1 turn.
- Completing a habit awards turns without requiring streak mechanics.
- A user cannot spend a story turn without available balance.
- Spending a choice deducts exactly 1 turn and creates a transaction record.
- Quest state remains coherent after multiple choices.
- Completed quests appear in history and update lightweight memory.

### Security and Ownership

- A user cannot read another user's tasks.
- A user cannot edit another user's habits.
- A user cannot spend another user's turns.
- A user cannot access another user's active quest.
- RLS policies block cross-user access.

### AI Failure Handling

- Failed productivity evaluation falls back to 1 turn.
- Failed quest generation does not create broken quest state.
- Failed choice resolution does not deduct additional turns.
- Malformed AI output is rejected or regenerated.
- AI output that introduces excluded RPG mechanics is rejected.

### Balance Integrity

- Available turns never exceed 10.
- Available turns never go below 0.
- Earned transactions increase the balance.
- Spent transactions decrease the balance.
- Adjusted transactions are auditable.

---

## 8. Development Order

The recommended build order is:

1. Project foundation.
2. Auth and database.
3. Task and habit completion with deterministic rewards.
4. Story turn balance and transaction integrity.
5. Basic quest creation without advanced AI behavior.
6. AI evaluator.
7. AI quest planner and narrative generator.
8. Choice resolution and quest state updates.
9. Frontend polish for the full loop.
10. Testing and closed beta deployment.

This order creates a usable loop as early as possible and then improves quality, AI behavior, and continuity.

---

## 9. Risks and Mitigations

### Risk: MVP Scope Expands Into a Full RPG

Mitigation:

- Keep story turns as the only reward.
- Reject XP, levels, inventory, combat, stats, and skill systems.
- Use short quests instead of campaigns.

### Risk: AI Output Becomes Inconsistent

Mitigation:

- Store quest state in the database.
- Use structured outputs.
- Validate generated content before display.
- Reject contradictions where detectable.

### Risk: Users Farm Easy Tasks

Mitigation:

- Cap turn balance at 10.
- Award vague or trivial actions conservatively.
- Keep feedback supportive but clear.

### Risk: Product Feels Like Too Much Setup

Mitigation:

- Keep onboarding short.
- Let users reach dashboard quickly.
- Make task completion and quest progress visible immediately.

### Risk: Data Model Becomes Too Complex

Mitigation:

- Add only tables needed for the MVP loop.
- Avoid post-MVP mechanics.
- Store summaries rather than extensive raw memory.

---

## 10. Closed Beta Evaluation

During the first tester release, evaluate:

- Do users create tasks or habits without confusion?
- Do users understand why they earned turns?
- Do users spend turns after earning them?
- Do users return to continue active quests?
- Do users complete real actions to unlock more story choices?
- Are AI-generated choices coherent enough to keep users engaged?
- Does the app feel lightweight rather than like a complex game system?

The strongest validation signal is:

> Users complete real tasks or habits because they want to continue the story.

---

## 11. Assumptions

- This roadmap covers MVP development through closed beta, not post-MVP expansion.
- Phase order is the recommended implementation sequence.
- Calendar estimates are intentionally not included yet.
- The MVP should prioritize learning and validation over breadth.
- Markdown uses plain ASCII arrows and hyphens to avoid encoding artifacts.

---

## 12. Final Definition

The HighTech MVP should be built as a focused, lightweight productivity quest app. It should connect real productivity actions to short AI-generated story decisions through a simple story turn economy. Every major development task should protect that core loop and avoid adding unrelated game or productivity platform complexity before the MVP has validated the main behavior.
