import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { listQuestHistory } from "../features/quests/questsApi";
import type { CompletedQuestHistory } from "../features/quests/types";

export function HistoryPage() {
  const { session } = useAuth();
  const token = session?.access_token;
  const [history, setHistory] = useState<CompletedQuestHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshHistory = useCallback(async () => {
    if (!token) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setHistory(await listQuestHistory(token));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load quest history.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  return (
    <section className="rounded-md border border-border bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Completed quests
      </p>
      <h2 className="mt-1 text-2xl font-semibold">Quest history</h2>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading ? <p className="mt-4 text-sm text-muted-foreground">Loading history...</p> : null}

      <div className="mt-5 grid gap-3">
        {history.length === 0 && !isLoading ? (
          <p className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
            Completed quests will appear here.
          </p>
        ) : null}

        {history.map((quest) => (
          <article key={quest.id} className="rounded-md border border-border bg-background p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold">{quest.title}</h3>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {quest.genre ?? "quest"} / completed {quest.completed_at.slice(0, 10)}
                </p>
              </div>
            </div>
            {quest.final_summary ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{quest.final_summary}</p>
            ) : null}
            {quest.outcome_summary ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{quest.outcome_summary}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
