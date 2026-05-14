import { apiRequest } from "../../lib/apiClient";
import type { ChoiceSelection, CompletedQuestHistory, Quest } from "./types";

export function getActiveQuest(token: string) {
  return apiRequest<Quest | null>("/api/quests/active", token);
}

export function createQuest(token: string, payload: { genre?: string | null; tone?: string | null }) {
  return apiRequest<Quest>("/api/quests", token, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function selectQuestChoice(token: string, questId: string, choiceId: string) {
  return apiRequest<ChoiceSelection>(`/api/quests/${questId}/choices/${choiceId}/select`, token, {
    method: "POST"
  });
}

export function abandonActiveQuest(token: string) {
  return apiRequest<Quest>("/api/quests/active/abandon", token, {
    method: "POST"
  });
}

export function listQuestHistory(token: string) {
  return apiRequest<CompletedQuestHistory[]>("/api/quests/history", token);
}
