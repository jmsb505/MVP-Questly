import {
  CheckSquare,
  History,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Sparkles,
  UserRound
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { cn } from "../lib/cn";

const authenticatedNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/habits", label: "Habits", icon: ListChecks },
  { to: "/quest", label: "Quest", icon: Sparkles },
  { to: "/history", label: "History", icon: History },
  { to: "/onboarding", label: "Preferences", icon: UserRound }
];

export function AppLayout() {
  const { isConfigured, session, signOut, user } = useAuth();
  const navItems = session ? authenticatedNavItems : [{ to: "/login", label: "Login", icon: UserRound }];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Questly
            </p>
            <h1 className="text-2xl font-semibold">Productivity Quest</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-accent hover:text-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
            {session ? (
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
                type="button"
                onClick={() => void signOut()}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            ) : null}
          </nav>
        </div>
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 pb-4 text-xs text-muted-foreground sm:px-6">
          {user?.email ? <span>Signed in as {user.email}</span> : null}
          {!isConfigured ? <span>Supabase environment variables are missing.</span> : null}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
