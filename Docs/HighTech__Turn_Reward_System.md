# Turn Reward System Document
## Gamified Productivity Quest App

**Date:** May 9, 2026

---

## 1. Turn Reward System Overview
The **Story Turn** is the primary and only reward mechanic in the MVP. There is no XP, levels, stats, or items. 

A story turn represents an opportunity to make a text-based choice inside an AI-generated quest. Users earn turns by completing real-world productivity actions (tasks, habits, school/work goals).

**The Core Motivation Loop:**
**Real productivity action → Story turn reward → Story choice → Quest progression**

---

## 2. Purpose of Story Turns
- **Unlock Progression:** Continues the active quest.
- **Spending Mechanic:** Each choice costs exactly one turn.
- **Productivity Link:** Story momentum is directly tied to real-world effort.
- **Simplicity:** Easier to balance and explain than a complex RPG economy.

---

## 3. Earning Story Turns
Turns are earned **only** upon completion of an action. Planning or creating a task awards no turns.
- **Tasks:** One-time actions.
- **Habits:** Recurring routines.
- **Goals:** Meaningful milestones.

---

## 4. Turn Award Scale
The MVP uses a simple 1–3 turn scale:
- **1 Turn:** Small/routine but valid action.
- **2 Turns:** Clear, meaningful, moderately effortful action.
- **3 Turns:** Difficult, specific, highly meaningful action.
- *Max reward is 3 turns per action.*

---

## 5. Evaluation Criteria
The system evaluates actions based on:
- **Specificity:** Is the description clear?
- **Effort:** Did it require significant time/attention?
- **Meaningfulness:** Does it contribute to real goals?
- **Vagueness:** Unclear tasks receive minimal rewards.
- **Default:** If evaluation fails, a conservative default of 1 turn is awarded.

---

## 6. Task & Habit Rules
- **Tasks:** Rewards depend on specificity (e.g., "Review lecture notes" > "Study").
- **Habits:** Usually award 1 turn per completion to maintain simplicity. 2 turns may be awarded for high-effort habits (e.g., a full workout).

---

## 7. Spending & Storage
- **Cost:** 1 turn per choice.
- **Storage:** Users can accumulate turns.
- **Cap:** Recommended maximum of **10 stored turns** to prevent "turn farming" and maintain a regular productivity rhythm.

---

## 8. Anti-Abuse & Fairness
- No rewards for task creation alone.
- Trivial/vague tasks receive minimal rewards.
- Tone should be **supportive and constructive**, not punitive (e.g., "This was a valid small action..." instead of "This was too easy").

---

## 9. Reward Examples

| Productivity Action | Type | Evaluation | Turns | Reason |
| :--- | :--- | :--- | :---: | :--- |
| Reply to one email | Work | Small, specific | 1 | Real but limited effort. |
| Review lecture notes (30m) | School | Meaningful effort | 2 | Supports academic goal. |
| Finish project report section | School | Specific, difficult | 3 | Substantial deliverable. |
| Practice Italian vocab | Habit | Valid routine | 1 | Simple recurring habit. |
| Complete planned workout | Habit | High effort | 1–2 | Depends on duration/effort. |
| Work on stuff | Unclear | Vague | 1 | Lack of context for evaluation. |

---

## 10. AI Evaluator Role
The *Productivity Action Evaluator* reviews actions and suggests rewards. It does not generate story content.

**Example JSON Output:**
```json
{
  "classification": "school_task",
  "complexity": "medium",
  "meaningfulness": "high",
  "turns_awarded": 2,
  "reason": "Specific study time supporting an academic goal."
}
```

---

## 11. MVP Boundaries
- **Exclusions:** No XP, levels, stats, skill trees, inventory, combat, coins, or badges.
- Focus is strictly on the productivity-to-story loop validation.

---

## 12. Final Definition
The MVP Turn Reward System connects real effort to narrative progress via a simple 1-3 turn reward scale. It prioritizes clarity and motivation while avoiding the complexity of traditional RPG systems.
