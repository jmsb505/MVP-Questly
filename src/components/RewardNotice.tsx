import type { CompletionReward } from "../features/productivity/types";

export function RewardNotice({ reward }: { reward: CompletionReward | null }) {
  if (!reward) {
    return null;
  }

  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
      Earned {reward.turns_awarded} story turn
      {reward.turns_awarded === 1 ? "" : "s"}; {reward.turns_added_to_balance} added to
      balance. Current balance: {reward.balance_after}. {reward.reward_reason}
    </div>
  );
}
