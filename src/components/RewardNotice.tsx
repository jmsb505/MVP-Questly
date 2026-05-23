import { useEffect, useState } from "react";
import type { CompletionReward } from "../features/productivity/types";

export function RewardNotice({ reward }: { reward: CompletionReward | null }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!reward) {
      setIsVisible(false);
      setIsLeaving(false);
      return;
    }

    setIsVisible(true);
    setIsLeaving(false);

    const fadeTimer = window.setTimeout(() => {
      setIsLeaving(true);
    }, 4700);
    const hideTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [reward]);

  if (!reward || !isVisible) {
    return null;
  }

  const earnedLabel = `${reward.turns_awarded} story turn${reward.turns_awarded === 1 ? "" : "s"}`;
  const addedLabel =
    reward.turns_added_to_balance > 0
      ? `${reward.turns_added_to_balance} added to your balance.`
      : "Your balance is already full.";

  return (
    <div
      className={`rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 transition-opacity duration-300 ${
        isLeaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <p className="font-medium">You earned {earnedLabel}.</p>
      <p className="mt-1">
        {addedLabel} Current balance: {reward.balance_after}.
      </p>
      <p className="mt-1">{reward.reward_reason}</p>
    </div>
  );
}
