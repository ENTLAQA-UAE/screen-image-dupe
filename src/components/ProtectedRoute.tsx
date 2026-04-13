import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

type AppRole = 'super_admin' | 'org_admin' | 'hr_admin';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: AppRole[];
  /** Skip onboarding/subscription checks (for the onboarding page itself) */
  skipSubscriptionCheck?: boolean;
}

export function ProtectedRoute({ children, requiredRoles, skipSubscriptionCheck }: ProtectedRouteProps) {
  const { user, loading, roles, isSuperAdmin } = useAuth();
  const { needsOnboarding, loading: subLoading } = useSubscription();

  if (loading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect users without an org to onboarding (except super admins)
  if (!skipSubscriptionCheck && needsOnboarding && !isSuperAdmin()) {
    return <Navigate to="/onboarding" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => roles.includes(role));
    if (!hasRequiredRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
