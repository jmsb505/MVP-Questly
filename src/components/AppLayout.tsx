import {
  CheckSquare,
  History,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Sparkles,
  UserRound,
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
  { to: "/onboarding", label: "Preferences", icon: UserRound },
];

export function AppLayout() {
  const { session, signOut } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute left-[-5rem] top-24 h-8 w-[36rem] rotate-45 border border-border/60" />
        <div className="absolute right-[-7rem] top-60 h-8 w-[42rem] rotate-45 border border-border/50" />
        <div className="absolute bottom-12 left-1/4 h-8 w-[34rem] rotate-45 border border-border/45" />
      </div>
      <header className="relative border-b border-border/80 bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Questly
            </p>
            <h1 className="text-3xl font-bold text-primary-foreground">
              Productivity Quest
            </h1>
          </div>
          {session ? (
            <nav className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-background/70 p-1">
              {authenticatedNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-all",
                      isActive
                        ? "border-primary/80 bg-primary/10 text-primary-foreground shadow-none"
                        : "border-transparent bg-transparent text-muted-foreground hover:border-accent hover:text-foreground",
                    )
                  }
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              ))}
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md border border-transparent bg-transparent px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
                type="button"
                onClick={() => void signOut()}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </nav>
          ) : null}
        </div>
        {/* <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 pb-4 text-xs text-muted-foreground sm:px-6">
          {user?.email ? <span>Signed in as {user.email}</span> : null}
          {!isConfigured ? <span>Supabase environment variables are missing.</span> : null}
        </div> */}
      </header>
      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
