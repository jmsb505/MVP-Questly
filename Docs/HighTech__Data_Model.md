# Data Model Document
## Gamified Productivity Quest App

**Date:** May 9, 2026

---

## 1. Data Model Overview
The purpose of the MVP data model is to support the core productivity-to-story loop. The database and application state are the **Source of Truth**. The AI model generates content and suggests updates, but the application manages storage and preservation.

### Supported Product Areas:
- User accounts and profiles.
- Tasks, habits, and productivity events.
- Story turn balances and transactions.
- Quests, turns, choices, and state.
- Lightweight user memory and history.
- AI generation logs for quality control.

---

## 2. Core Data Model Principles
- **Simplicity:** Support only the core MVP loop.
- **Explicit State:** Store story facts, choices, and progress outside the AI model.
- **Traceability:** Track turn earnings and spendings via transaction records.
- **Structured Memory:** Use structured formats for user memory.
- **No Bloat:** Exclude XP, levels, stats, inventory, combat, or multiplayer.

---

## 3. High-Level Entity List

| Entity | Purpose |
| :--- | :--- |
| **User** | Authenticated user account. |
| **UserProfile** | Basic info (display name, user type). |
| **UserMemory** | Lightweight structured memory for personalization. |
| **Task** | One-time productivity action. |
| **Habit** | Recurring productivity action. |
| **ProductivityEvent** | Record of a completed task or habit. |
| **StoryTurnBalance** | Current available turn count. |
| **StoryTurnTransaction**| Audit trail for turn changes (earned/spent). |
| **Quest** | Short AI-generated narrative quest. |
| **QuestTurn** | A single scene inside a quest. |
| **QuestChoice** | Choices attached to a turn and their results. |
| **QuestState** | Current narrative state (facts, location). |
| **CompletedQuestHistory**| Summaries of finished quests. |
| **AIGenerationLog** | Debug logs for AI inputs/outputs. |

---

## 4. Entity Relationship Overview
- **User** owns **Tasks**, **Habits**, **Quests**, and **Memory**.
- **Completing** a Task/Habit creates a **ProductivityEvent**.
- **ProductivityEvent** triggers a **StoryTurnTransaction**, which updates **StoryTurnBalance**.
- **Quest** has many **QuestTurns**; each turn has many **QuestChoices**.
- **QuestState** tracks the current narrative situation.
- **UserMemory** aggregates preferences and history.

---

## 5. Key Entities Detail

### 5.1 UserMemory
Stores structured JSON fields for continuity.
- `preferred_genres`: List of strings.
- `tone_style_preferences`: Tone and writing style.
- `productivity_history_summary`: Recent patterns.
- `active_quest_summary`: Summary of current quest state.

### 5.2 ProductivityEvent
Records snapshots of completed actions to ensure auditability.
- `classification`: (e.g., school_task, habit).
- `complexity`: (low, medium, high).
- `meaningfulness`: (low, medium, high).
- `turns_awarded`: (1-3).

### 5.3 StoryTurnBalance
- `available_turns`: Current count.
- `max_turns`: Cap (default 10).

### 5.4 QuestState
- `known_facts`: List of established story facts.
- `open_questions`: Unresolved mysteries.
- `previous_choices_summary`: History of decisions in the current quest.

---

## 6. Core Data Flows

### 6.1 Completing an Action
1. User marks Task/Habit complete.
2. `ProductivityEvent` created with title/description snapshots.
3. AI evaluates and awards 1–3 turns.
4. `StoryTurnTransaction` (earned) created; `StoryTurnBalance` updated (capped at 10).

### 6.2 Advancing a Quest
1. User selects `QuestChoice`.
2. Check `StoryTurnBalance` (must be ≥ 1).
3. Turn deducted via `StoryTurnTransaction` (spent).
4. AI resolves choice; `QuestChoice.result_text` stored.
5. `QuestState` updated with new facts and progress.

### 6.3 Completing a Quest
1. Quest status changed to `completed`.
2. `CompletedQuestHistory` record created.
3. `UserMemory` updated with the ending summary.

---

## 7. Status Values and Enums
- **Task/Quest Status:** `pending`, `active`, `completed`, `archived`, `abandoned`.
- **Transaction Type:** `earned`, `spent`, `adjusted`.
- **Choice Type:** `branching`, `progression`, `investigation`, `tone`.
- **AI Validation:** `approved`, `rejected`, `fallback_used`, `failed`.

---

## 8. Data Integrity & Privacy
- **Ownership:** Every task/habit/quest must belong to a User.
- **Balance Rules:** Turns cannot be negative or exceed the cap.
- **Privacy:** Store only what is needed. Avoid deep profiling. Prefer summaries over raw text logs.

---

## 9. MVP Boundaries
The model **DOES NOT** include:
- FocusSessions, XP, Levels, Stats, SkillTrees, Inventory, Combat, Coins, Badges, or Multiplayer.

---

## 10. Final Data Model Definition
The MVP Data Model is a lightweight application-owned state model. It treats the database as the source of truth, using the AI only for content generation and evaluation. It prioritizes the core loop: **productivity action → reward → narrative choice → progression.**
