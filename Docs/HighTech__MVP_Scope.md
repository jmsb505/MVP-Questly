# MVP Scope Document
## Gamified Productivity Quest App

**Author:** Juan Martin Sanchez Bardellini  
**Date:** May 9, 2026

---

## 1. Product Overview
The product is a gamified productivity application for students and young professionals. The app turns school tasks, work tasks, personal goals, and habits into short AI-generated narrative quests. Instead of treating productivity as a simple checklist, the app connects real-life progress with small interactive story moments.

The experience is inspired by the choice-based structure of the iOS game *Lifeline*, where the user makes short text-based decisions that influence how a story unfolds. In this product, however, story progress is not unlocked automatically. The user must first complete real productivity actions, such as finishing a task, completing a habit, or making progress toward a personal goal.

### Target Users:
- **Students** who need motivation to complete assignments, study tasks, routines, and personal goals.
- **Young professionals** who want a more engaging way to manage work tasks, habits, and self-improvement routines.

The core value proposition is simple: users may feel more motivated to complete real tasks and habits when each completion unlocks a small piece of an interactive story.

## 2. MVP Goal
The goal of the MVP is to validate whether a lightweight narrative reward loop can make productivity feel more engaging without requiring complex game systems.

The MVP is not intended to prove a full RPG system, long-term game progression, or advanced personalization. Instead, it focuses on one central hypothesis:

> **Users may feel more motivated to complete tasks and habits if each completed productivity action unlocks a small interactive story decision.**

The MVP should prove whether users understand, enjoy, and repeat the following loop:
**Real productivity action → story turn reward → branching choice → quest progression**

## 3. Core MVP Experience
The core MVP experience is based on a short, repeatable loop.

### 3.1 Main User Flow
1. The user creates tasks or habits.
2. The user completes a real productivity action.
3. The system evaluates the completed action.
4. The user earns 1-3 story turns.
5. The user spends story turns on short branching story choices.
6. The AI resolves the selected choice.
7. The quest state updates.
8. The short quest continues until it reaches an ending.

### 3.2 Tasks, Habits, and Story Turns
Tasks and habits are the main input into the product loop. When the user completes a task or habit, the app rewards them with story turns. A story turn represents one opportunity to make a meaningful text-based decision inside the active quest.

Story turns are the main reward mechanic of the MVP. They replace more complex systems such as XP, levels, character stats, skill points, or RPG progression. The user is rewarded with progress in the story, not with numerical growth.

### 3.3 Quest Progression
Each quest should be short and focused. A quest begins with an AI-generated setup based on the user’s selected genre and style preferences. As the user completes tasks and habits, they unlock story turns that allow them to make choices and move the quest forward.

The quest ends when the story reaches a natural conclusion. Completed quests are saved in a basic history so the user can see previous quest outcomes.

## 4. In Scope
The MVP includes only the essential features required to validate the core loop.

- User account
- Task creation and completion
- Habit creation and completion
- Quest genre and style preference
- Lightweight per-user memory or profile
- Stored active quest state
- AI-generated short quest setup
- Story turn rewards from completed tasks and habits
- Branching text-based choices
- AI-generated choice resolution
- Quest completion
- Basic completed quest history

## 5. Out of Scope
The following features are explicitly excluded from the MVP:

- Focus sessions
- XP, Levels, Character stats, Skill points, Skill trees
- Combat, Inventory
- Multiplayer, Social features
- Long campaigns
- Calendar integrations
- Advanced analytics
- Native mobile app
- Complex autonomous AI memory system
- Deep psychological profiling
- Fully personalized long-term narrative universe

These exclusions are important because the MVP should remain focused on validating the core motivation loop, not on building a full game or a complete productivity platform.

## 6. Lightweight User Memory
The MVP should include a lightweight memory system per user. This can be understood as a stored user profile or user memory file managed by the application.

This memory should not be a complex autonomous AI memory system. It should be structured, minimal, and directly controlled by the application. The AI model should use this stored information as context when generating quests, choices, and story resolutions, but the app should not rely on the AI model to freely remember everything.

### 6.1 Purpose of User Memory
The lightweight user memory should be used to:
- Preserve quest continuity
- Remember genre and tone preferences
- Keep track of previous choices
- Summarize completed productivity actions
- Avoid asking the user the same basic preferences repeatedly

### 6.2 Information Stored
The user memory should store only the minimum information needed to personalize quests and keep the story coherent. Examples include:
- User quest genre preferences
- User tone and style preferences
- Basic productivity history summary
- Active quest state
- Previous story choices
- Important discovered story facts
- Current quest progress
- Completed quest history

The memory should support the MVP experience without becoming a major feature by itself.

## 7. MVP Success Criteria
The MVP can be considered successful if it demonstrates that users understand and repeatedly engage with the core loop.

Success criteria include:
- Users understand the core loop quickly.
- Users complete tasks and habits to unlock story turns.
- Users return to continue active quests.
- AI-generated choices feel coherent and interesting.
- Quest state remains consistent across story turns.
- The lightweight memory improves continuity without making the app feel complex.
- Users perceive story turns as a meaningful reward for real productivity actions.

The most important success signal is whether users complete real tasks or habits because they want to continue the story.

## 8. Key Assumptions
The MVP is based on the following assumptions:
- Users are motivated by narrative progress.
- Short quests are better for the MVP than long campaigns.
- Story turns are easier to balance than XP or full RPG mechanics.
- AI can generate acceptable short-form interactive story content when constrained by stored state.
- A lightweight memory system is enough for quest continuity in the MVP.
- Users do not need complex RPG systems to feel rewarded.
- A simple reward loop is more useful for validation than a large feature set.

## 9. MVP Constraints
The MVP should remain intentionally limited in scope.
- Keep quests short.
- Keep story turns brief.
- Store quest state in the database or user memory structure.
- Do not rely on the AI to remember everything.
- Keep rewards simple.
- Keep memory structured and minimal.
- Prioritize product loop validation over advanced game mechanics.
- Avoid adding features that distract from task completion and story progression.

The product should feel lightweight, easy to understand, and fast to use. The main design priority is to connect productivity actions with narrative progression in the simplest possible way.

## 10. Final MVP Definition
The MVP is a simple gamified productivity app where students and young professionals create tasks and habits, complete real productivity actions, earn 1-3 story turns, and spend those turns on short *Lifeline*-style branching choices inside AI-generated quests. 

The MVP includes basic user accounts, task and habit completion, short quest generation, branching story decisions, stored quest state, completed quest history, and a lightweight structured user memory for continuity and personalization. 

It intentionally excludes XP, levels, stats, skill trees, focus sessions, combat, multiplayer, long campaigns, and advanced AI memory in order to focus only on validating whether narrative progress can motivate real productivity behavior.
