# Core Gameplay Loop
## Gamified Productivity Quest App

**Date:** May 9, 2026

---

## 1. Gameplay Loop Overview
The MVP gameplay loop is centered on a simple relationship between real productivity and narrative progression. The user completes real tasks or habits, and the application converts those completed actions into **story turns**. These story turns allow the user to advance short AI-generated narrative quests through small text-based choices inspired by the structure of *Lifeline*.

The purpose of the loop is to make productivity feel more engaging without turning the application into a complex RPG. The user is not rewarded with XP, levels, stats, skill trees, items, combat progression, or multiplayer systems. Instead, the only MVP reward mechanic is the **story turn**.

A story turn represents the user’s ability to move the story forward. Real productivity actions create story momentum, and story momentum creates narrative progress. This keeps the MVP focused, lightweight, and easy to understand.

---

## 2. Primary User Loop
The primary user loop defines the main sequence of interaction:

1. **Create:** User creates a task or habit.
2. **Complete:** User performs the real-life action and marks it complete.
3. **Evaluate:** System evaluates complexity and meaningfulness.
4. **Reward:** User receives 1–3 story turns.
5. **Spend:** User spends a story turn on a choice in the active quest.
6. **Resolve:** AI generates a short consequence.
7. **Update:** Quest state and user memory are updated.
8. **Continue:** User repeats the loop until the quest reaches an ending.

This loop ensures that story progress is always tied to real productivity. The user cannot advance the quest endlessly without completing tasks or habits.

---

## 3. Task and Habit Loop
Productivity actions are the input that drives the gameplay loop.

### 3.1 Tasks
One-time actions (e.g., "Finish assignment," "Send email"). Completed tasks are evaluated for story turn rewards based on specificity and effort.

### 3.2 Habits
Recurring actions (e.g., "Read for 20 minutes," "Exercise"). These award story turns similarly to tasks but remain simple, without complex streak mechanics or levels.

### 3.3 Evaluation Criteria
Completed actions are evaluated based on:
- **Specificity:** Was the action clearly described?
- **Effort:** Did it require real time or energy?
- **Contribution:** Does it support school, work, or personal goals?
- **Vagueness:** Is it too small or unclear (e.g., "Open laptop") to deserve a reward?

---

## 4. Story Turn Loop
Story turns are the central reward mechanic.

### 4.1 Earning Turns
- **1 Turn:** Small but valid action.
- **2 Turns:** Meaningful, moderately effortful action.
- **3 Turns:** Difficult, specific, highly meaningful action.
- *Max reward per action is 3 turns.*

### 4.2 Spending Turns
Each choice costs exactly one story turn. Without turns, users can view the quest but cannot advance it.

### 4.3 Stored Story Turns
Users can store story turns up to a maximum (recommended cap of 10) to allow flexibility in when they engage with the story.

---

## 5. Quest Interaction Loop
How the user experiences the narrative:

1. **Read:** User reads a short scene.
2. **Choose:** User sees 2–3 text-based choices.
3. **Select:** User selects a choice (consuming 1 turn).
4. **Result:** AI resolves consequence and updates state.
5. **Next:** The next scene is generated from the updated state.

### 5.1 Choice Types
- **Branching:** Changes the direction of the quest.
- **Progression:** Moves the story forward without a major branch.
- **Investigation:** Reveals information or facts.
- **Tone:** Allows user expression without changing the path.

---

## 6. Quest Lifecycle
MVP uses short, self-contained quests rather than long campaigns.

### 6.1 Creation & Setup
Quests are created based on user preferences (e.g., sci-fi, fantasy, detective) and tone. Setup includes the genre, initial situation, objective, and starting facts.

### 6.2 Narrative Flow
- **Opening Scene:** Introduces the quest and first choices.
- **Body:** Repeated story turns (scene → choice → consequence).
- **Ending:** Clear conclusion summarizing the result.
- **History:** Completed quests are saved to history for continuity and personalization.

---

## 7. Lightweight Memory in the Loop
A structured memory system preserves continuity without relying solely on the AI model.

### 7.1 Memory Contents
- Genre/Tone preferences.
- Productivity history summary.
- Active quest state (facts, choices, progress).
- Completed quest history.

### 7.2 Update Points
Memory updates occur after:
- Task/Habit completion.
- Story turn generation.
- User choice selection.
- Quest completion.

---

## 8. Example Gameplay Session
- **Alex (Student)** creates a task: "Finish intro of ML assignment."
- **Completion:** Awards 2 turns.
- **Quest:** "The Signal Beneath Europa Station."
- **Interaction:** Alex reads a scene about a locked lab and selects "Search for another entrance."
- **Outcome:** One turn spent. Alex finds a maintenance hatch. State updates. 1 turn remaining.

---

## 9. Loop Rules and Constraints
- Each turn costs 1 story turn.
- Max 3 turns earned per action.
- Max 10 turns stored.
- Short, self-contained quests with clear endings.
- **No XP, levels, stats, skill trees, inventory, or combat.**
- App (not AI) is the source of truth for state.

---

## 10. Final Loop Definition
The MVP gameplay loop is a productivity-driven narrative loop where completing real tasks unlocks short, interactive story progress. Story turns are the only reward mechanic, ensuring a lightweight and focused experience.
