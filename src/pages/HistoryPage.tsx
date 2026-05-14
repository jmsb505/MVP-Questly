import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { EmptyState } from "../components/EmptyState";
import { ErrorPanel } from "../components/ErrorPanel";
import { LoadingRow } from "../components/LoadingRow";
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

      {error ? <div className="mt-4"><ErrorPanel message={error} /></div> : null}

      {isLoading ? <div className="mt-4"><LoadingRow label="Loading quest history..." /></div> : null}

      <div className="mt-5 grid gap-3">
        {history.length === 0 && !isLoading ? (
          <EmptyState
            title="No completed quests yet"
            description="Finish an active quest and its final summary will be saved here."
            action={
              <Link className="text-sm font-medium text-primary" to="/quest">
                Open quest
              </Link>
            }
          />
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
              <div className="mt-3 rounded-md border border-border bg-surface p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Final summary
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{quest.final_summary}</p>
              </div>
            ) : null}
            {quest.outcome_summary ? (
              <div className="mt-3 rounded-md border border-border bg-surface p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Outcome
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{quest.outcome_summary}</p>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
