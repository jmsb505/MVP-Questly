import type { Session, User } from "@supabase/supabase-js";
import { createContext } from "react";
import type { AccountState } from "../features/account/types";

export type AuthContextValue = {
  isConfigured: boolean;
  isLoading: boolean;
  isAccountLoading: boolean;
  session: Session | null;
  user: User | null;
  account: AccountState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<string>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAccount: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
