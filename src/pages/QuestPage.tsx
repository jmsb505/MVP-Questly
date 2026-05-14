import { LoaderCircle, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import {
  abandonActiveQuest,
  createQuest,
  getActiveQuest,
  selectQuestChoice
} from "../features/quests/questsApi";
import type { ChoiceSelection, Quest } from "../features/quests/types";
import { getStoryTurnBalance } from "../features/productivity/productivityApi";
import type { StoryTurnBalance } from "../features/productivity/types";

export function QuestPage() {
  const { account, session } = useAuth();
  const token = session?.access_token;
  const [quest, setQuest] = useState<Quest | null>(null);
  const [balance, setBalance] = useState<StoryTurnBalance | null>(null);
  const [selection, setSelection] = useState<ChoiceSelection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [pendingChoiceId, setPendingChoiceId] = useState<string | null>(null);

  const refreshQuest = useCallback(async () => {
    if (!token) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [nextQuest, nextBalance] = await Promise.all([
        getActiveQuest(token),
        getStoryTurnBalance(token)
      ]);
      setQuest(nextQuest);
      setBalance(nextBalance);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load quest.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshQuest();
  }, [refreshQuest]);

  async function handleCreateQuest() {
    if (!token) {
      return;
    }
    setIsCreating(true);
    setError(null);
    setSelection(null);
    try {
      const memory = account.memory;
      const nextQuest = await createQuest(token, {
        genre: memory?.preferred_genres[0] ?? null,
        tone: memory?.tone_style_preferences ?? null
      });
      setQuest(nextQuest);
      setBalance(await getStoryTurnBalance(token));
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not start quest.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSelectChoice(choiceId: string) {
    if (!token || !quest) {
      return;
    }
    setPendingChoiceId(choiceId);
    setError(null);
    try {
      const result = await selectQuestChoice(token, quest.id, choiceId);
      setSelection(result);
      setQuest(result.quest.status === "active" ? result.quest : null);
      setBalance(await getStoryTurnBalance(token));
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : "Could not select choice.");
    } finally {
      setPendingChoiceId(null);
    }
  }

  async function handleAbandonQuest() {
    if (!token) {
      return;
    }
    setIsAbandoning(true);
    setError(null);
    setSelection(null);
    try {
      await abandonActiveQuest(token);
      setQuest(null);
      await refreshQuest();
    } catch (abandonError) {
      setError(abandonError instanceof Error ? abandonError.message : "Could not abandon quest.");
    } finally {
      setIsAbandoning(false);
    }
  }

  const currentTurn = quest?.current_turn;
  const availableTurns = balance?.available_turns ?? 0;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-md border border-border bg-surface p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Active quest
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              {quest ? quest.title : "No active quest"}
            </h2>
            {quest ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {quest.premise}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <div className="rounded-md border border-border bg-background px-4 py-3 text-sm">
              <p className="text-2xl font-semibold">{availableTurns}</p>
              <p className="text-xs text-muted-foreground">Story turns</p>
            </div>
            {quest ? (
              <button
                className="h-9 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground disabled:cursor-wait disabled:opacity-70"
                type="button"
                disabled={isAbandoning || pendingChoiceId !== null}
                onClick={() => void handleAbandonQuest()}
              >
                {isAbandoning ? "Abandoning..." : "Abandon quest"}
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading quest...
          </div>
        ) : null}

        {!quest && !isLoading ? (
          <div className="mt-6 rounded-md border border-border bg-background p-5">
            {selection?.quest_completed ? (
              <>
                <h3 className="text-lg font-semibold">Quest complete</h3>
                <p className="mt-2 text-sm text-muted-foreground">{selection.consequence}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Your completed quest is now available in History. Start a new adventure when ready.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold">Start an adventure quest</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Quests are interactive stories with changing scenes, choices, and consequences.
                  Each selected choice costs exactly 1 story turn.
                </p>
              </>
            )}
            <button
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-70"
              type="button"
              disabled={isCreating}
              onClick={() => void handleCreateQuest()}
            >
              {isCreating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isCreating ? "Starting quest" : "Start quest"}
            </button>
          </div>
        ) : null}

        {quest && currentTurn ? (
          <div className="mt-6 grid gap-5">
            {selection && !selection.quest_completed ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <p className="font-medium">Choice resolved</p>
                <p className="mt-1">{selection.consequence}</p>
              </div>
            ) : null}

            <article className="rounded-md border border-border bg-background p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Turn {currentTurn.turn_index + 1} of {quest.planned_length_in_turns}
              </p>
              <p className="mt-3 leading-7 text-foreground">{currentTurn.scene_text}</p>
            </article>

            <div className="grid gap-3">
              {currentTurn.choices.map((choice) => {
                const isPending = pendingChoiceId === choice.id;
                const disabled = availableTurns < 1 || pendingChoiceId !== null || choice.selected;
                return (
                  <button
                    key={choice.id}
                    className="flex w-full items-start justify-between gap-4 rounded-md border border-border bg-background p-4 text-left transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-65"
                    type="button"
                    disabled={disabled}
                    onClick={() => void handleSelectChoice(choice.id)}
                  >
                    <span>
                      <span className="block text-sm font-medium">{choice.choice_text}</span>
                      <span className="mt-1 block text-xs uppercase tracking-wide text-muted-foreground">
                        {choice.choice_type} / costs 1 turn
                      </span>
                    </span>
                    {isPending ? <LoaderCircle className="h-4 w-4 animate-spin text-primary" /> : null}
                  </button>
                );
              })}
              {availableTurns < 1 ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Complete a task or habit to earn a story turn before choosing.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <aside className="grid gap-5 self-start">
        <section className="rounded-md border border-border bg-surface p-5">
          <h3 className="text-lg font-semibold">Quest state</h3>
          {quest?.state ? (
            <div className="mt-4 grid gap-4 text-sm">
              <div>
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">{quest.state.current_location ?? "Unknown"}</p>
              </div>
              <div>
                <p className="font-medium">Known facts</p>
                <ul className="mt-1 grid gap-1 text-muted-foreground">
                  {quest.state.known_facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium">Open questions</p>
                <ul className="mt-1 grid gap-1 text-muted-foreground">
                  {quest.state.open_questions.length ? (
                    quest.state.open_questions.map((question) => <li key={question}>{question}</li>)
                  ) : (
                    <li>No open questions.</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Start a quest to see stored state.
            </p>
          )}
        </section>
      </aside>
    </div>
  );
}
