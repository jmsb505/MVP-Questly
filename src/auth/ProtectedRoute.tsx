import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export function ProtectedRoute({
  children,
  requireOnboarding = true
}: {
  children: JSX.Element;
  requireOnboarding?: boolean;
}) {
  const { account, isAccountLoading, isLoading, session } = useAuth();
  const location = useLocation();

  if (isLoading || (session && isAccountLoading)) {
    return (
      <div className="rounded-md border border-border bg-surface p-5 text-sm text-muted-foreground">
        Loading session...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (
    requireOnboarding &&
    account.profile &&
    !account.profile.onboarding_completed &&
    location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
