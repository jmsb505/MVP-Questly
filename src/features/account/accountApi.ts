import { supabase } from "../../lib/supabaseClient";
import type { AccountState, UserMemory, UserProfile, UserType } from "./types";

export type OnboardingInput = {
  displayName: string;
  userType: UserType;
  preferredGenres: string[];
  toneStylePreferences: string;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}

export async function loadAccountState(userId: string): Promise<AccountState> {
  const client = requireSupabase();

  const [{ data: profile, error: profileError }, { data: memory, error: memoryError }] =
    await Promise.all([
      client.from("user_profiles").select("*").eq("id", userId).maybeSingle<UserProfile>(),
      client.from("user_memory").select("*").eq("user_id", userId).maybeSingle<UserMemory>()
    ]);

  if (profileError) {
    throw profileError;
  }
  if (memoryError) {
    throw memoryError;
  }

  return { profile, memory };
}

export async function saveOnboarding(userId: string, input: OnboardingInput): Promise<void> {
  const client = requireSupabase();

  const [{ error: profileError }, { error: memoryError }] = await Promise.all([
    client
      .from("user_profiles")
      .update({
        display_name: input.displayName.trim(),
        user_type: input.userType,
        onboarding_completed: true
      })
      .eq("id", userId),
    client
      .from("user_memory")
      .update({
        preferred_genres: input.preferredGenres,
        tone_style_preferences: input.toneStylePreferences.trim()
      })
      .eq("user_id", userId)
  ]);

  if (profileError) {
    throw profileError;
  }
  if (memoryError) {
    throw memoryError;
  }
}
