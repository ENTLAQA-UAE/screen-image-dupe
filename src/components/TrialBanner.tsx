import { Clock, Sparkles, AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

export function TrialBanner() {
  const { isTrial, isTrialExpired, isActive, daysRemaining, loading } = useSubscription();
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  // Don't show if: loading, dismissed, not on trial, or paid active subscription
  if (loading || dismissed || (!isTrial && isActive)) return null;

  // Trial expired — urgent red banner (not dismissible)
  if (isTrialExpired) {
    return (
      <div className="bg-destructive text-destructive-foreground px-4 py-2.5 flex items-center justify-center gap-3 text-sm">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span className="font-medium">Your free trial has expired.</span>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 px-3 text-xs font-semibold"
          onClick={() => navigate('/subscription')}
        >
          Upgrade Now
        </Button>
      </div>
    );
  }

  // Active trial — info banner with days remaining
  if (isTrial) {
    const isUrgent = daysRemaining <= 3;

    return (
      <div className={`px-4 py-2 flex items-center justify-center gap-3 text-sm ${
        isUrgent
          ? 'bg-amber-500/10 text-amber-700 border-b border-amber-500/20'
          : 'bg-primary/5 text-primary border-b border-primary/10'
      }`}>
        {isUrgent ? (
          <Clock className="w-4 h-4 shrink-0" />
        ) : (
          <Sparkles className="w-4 h-4 shrink-0" />
        )}
        <span>
          {isUrgent ? (
            <><strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> left in your trial</>
          ) : (
            <><strong>{daysRemaining} days</strong> remaining in your free trial</>
          )}
        </span>
        <Button
          size="sm"
          variant={isUrgent ? 'default' : 'outline'}
          className="h-7 px-3 text-xs font-semibold"
          onClick={() => navigate('/subscription')}
        >
          Upgrade
        </Button>
        {!isUrgent && (
          <button
            onClick={() => setDismissed(true)}
            className="p-0.5 rounded hover:bg-primary/10 transition-colors ms-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return null;
}
