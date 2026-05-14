import type { CompletionReward } from "../features/productivity/types";

export function RewardNotice({ reward }: { reward: CompletionReward | null }) {
  if (!reward) {
    return null;
  }

  const earnedLabel = `${reward.turns_awarded} story turn${reward.turns_awarded === 1 ? "" : "s"}`;
  const addedLabel =
    reward.turns_added_to_balance > 0
      ? `${reward.turns_added_to_balance} added to your balance.`
      : "Your balance is already full.";

  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
      <p className="font-medium">You earned {earnedLabel}.</p>
      <p className="mt-1">
        {addedLabel} Current balance: {reward.balance_after}.
      </p>
      <p className="mt-1">{reward.reward_reason}</p>
    </div>
  );
}
