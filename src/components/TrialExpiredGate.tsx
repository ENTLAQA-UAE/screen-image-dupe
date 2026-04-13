import { motion } from 'framer-motion';
import { Clock, ArrowRight, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

/**
 * Renders a full-page gate when the user's trial has expired.
 * Wrap protected dashboard content with this component.
 * Returns children if trial is active or subscription is paid.
 */
export function TrialExpiredGate({ children }: { children: React.ReactNode }) {
  const { isTrialExpired, loading, isTrial } = useSubscription();
  const { signOut, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  // Super admins are never gated
  if (isSuperAdmin()) return <>{children}</>;

  // Still loading — show nothing extra
  if (loading) return <>{children}</>;

  // Trial not expired — pass through
  if (!isTrialExpired) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-destructive" />
        </div>

        <h1 className="text-2xl font-display font-bold text-foreground mb-3">
          Your Trial Has Ended
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Your 14-day free trial has expired. To continue using Qudurat,
          please upgrade to a paid plan. All your data is safe and waiting for you.
        </p>

        <div className="space-y-3">
          <Button
            className="w-full h-12 rounded-xl font-semibold text-base"
            onClick={() => navigate('/subscription')}
          >
            View Plans & Upgrade
            <ArrowRight className="w-4 h-4 ms-2" />
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={async () => {
              await signOut();
              navigate('/auth');
            }}
          >
            <LogOut className="w-4 h-4 me-2" />
            Sign Out
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Need help? Contact support@qudurat.co
        </p>
      </motion.div>
    </div>
  );
}
