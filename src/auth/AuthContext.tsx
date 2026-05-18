import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadAccountState } from "../features/account/accountApi";
import type { AccountState } from "../features/account/types";
import { supabase } from "../lib/supabaseClient";
import { AuthContext, type AuthContextValue } from "./authContextCore";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [account, setAccount] = useState<AccountState>({ profile: null, memory: null });
  const isConfigured = Boolean(supabase);

  const refreshAccount = useCallback(async () => {
    if (!supabase || !session?.user.id) {
      setAccount({ profile: null, memory: null });
      return;
    }

    setIsAccountLoading(true);
    try {
      setAccount(await loadAccountState(session.user.id));
    } finally {
      setIsAccountLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
      if (!nextSession) {
        setAccount({ profile: null, memory: null });
      }
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    void refreshAccount();
  }, [refreshAccount]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured,
      isLoading,
      isAccountLoading,
      session,
      user: session?.user ?? null,
      account,
      async signIn(email: string, password: string) {
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          throw error;
        }
      },
      async signUp(email: string, password: string, displayName?: string) {
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName
            }
          }
        });
        if (error) {
          throw error;
        }
        return data.session
          ? "Account created. You are signed in."
          : "Account created. Check your email if confirmation is enabled.";
      },
      async requestPasswordReset(email: string) {
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`
        });
        if (error) {
          throw error;
        }
      },
      async updatePassword(password: string) {
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          throw error;
        }
      },
      async signOut() {
        if (!supabase) {
          return;
        }
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
        setAccount({ profile: null, memory: null });
      },
      refreshAccount
    }),
    [account, isAccountLoading, isConfigured, isLoading, refreshAccount, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
