import { useState, useEffect } from 'react';
import { CalendarDays, Crown, CreditCard, FileText, CheckCircle2, Clock, AlertTriangle, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Organization } from './types';

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly_usd: number | null;
  price_annual_usd: number | null;
  max_assessments: number | null;
  max_users: number | null;
  max_groups: number | null;
}

interface Subscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  payment_method: string;
  trial_end: string | null;
  current_period_start: string;
  current_period_end: string;
  manually_activated_at: string | null;
  manually_activated_by: string | null;
  manual_activation_notes: string | null;
  plans: Plan | null;
}

interface ManageSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
  onRefresh: () => void;
}

export function ManageSubscriptionDialog({ open, onOpenChange, organization, onRefresh }: ManageSubscriptionDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Change Plan state
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('monthly');
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  // Manual Activation state
  const [activationNotes, setActivationNotes] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  // Extend Trial state
  const [extendDays, setExtendDays] = useState('14');
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    if (open && organization) {
      fetchSubscription();
      fetchPlans();
    }
  }, [open, organization]);

  const fetchSubscription = async () => {
    if (!organization) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plans (id, name, slug, price_monthly_usd, price_annual_usd, max_assessments, max_users, max_groups)')
      .eq('organization_id', organization.id)
      .maybeSingle();

    if (!error && data) {
      setSubscription({
        ...data,
        plans: data.plans as Plan | null,
      });
      setSelectedPlanId(data.plan_id);
      setSelectedCycle(data.billing_cycle || 'monthly');
    }
    setIsLoading(false);
  };

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('plans')
      .select('id, name, slug, price_monthly_usd, price_annual_usd, max_assessments, max_users, max_groups')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (data) setPlans(data);
  };

  const handleChangePlan = async () => {
    if (!subscription || !selectedPlanId) return;
    setIsChangingPlan(true);

    const selectedPlan = plans.find(p => p.id === selectedPlanId);

    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan_id: selectedPlanId,
        billing_cycle: selectedCycle,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to change plan', description: error.message });
    } else {
      // Also update org plan field for consistency
      if (selectedPlan) {
        await supabase
          .from('organizations')
          .update({ plan: selectedPlan.slug })
          .eq('id', subscription.organization_id);
      }
      toast({ title: 'Plan changed', description: `Subscription updated to ${selectedPlan?.name || 'new plan'}.` });
      fetchSubscription();
      onRefresh();
    }
    setIsChangingPlan(false);
  };

  const handleActivate = async () => {
    if (!subscription) return;
    setIsActivating(true);

    const now = new Date();
    const periodEnd = new Date();
    if (selectedCycle === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        payment_method: 'manual',
        manually_activated_at: now.toISOString(),
        manually_activated_by: user?.id || null,
        manual_activation_notes: activationNotes || null,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_end: null,
        updated_at: now.toISOString(),
      })
      .eq('id', subscription.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to activate', description: error.message });
    } else {
      await supabase
        .from('organizations')
        .update({ is_active: true })
        .eq('id', subscription.organization_id);

      toast({ title: 'Subscription activated', description: `${organization?.name} has been manually activated.` });
      setActivationNotes('');
      fetchSubscription();
      onRefresh();
    }
    setIsActivating(false);
  };

  const handleExtendTrial = async () => {
    if (!subscription) return;
    setIsExtending(true);

    const days = parseInt(extendDays) || 14;
    const currentTrialEnd = subscription.trial_end ? new Date(subscription.trial_end) : new Date();
    const baseDate = currentTrialEnd > new Date() ? currentTrialEnd : new Date();
    const newTrialEnd = new Date(baseDate);
    newTrialEnd.setDate(newTrialEnd.getDate() + days);

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'trial',
        trial_end: newTrialEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to extend trial', description: error.message });
    } else {
      toast({
        title: 'Trial extended',
        description: `Trial extended by ${days} days until ${newTrialEnd.toLocaleDateString()}.`,
      });
      fetchSubscription();
      onRefresh();
    }
    setIsExtending(false);
  };

  const handleSuspend = async () => {
    if (!subscription) return;

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to suspend', description: error.message });
    } else {
      await supabase
        .from('organizations')
        .update({ is_active: false })
        .eq('id', subscription.organization_id);

      toast({ title: 'Subscription suspended', description: `${organization?.name} has been suspended.` });
      fetchSubscription();
      onRefresh();
    }
  };

  const now = new Date();
  const isTrialExpired = subscription?.status === 'trial' && subscription.trial_end && new Date(subscription.trial_end) < now;
  const isActive = subscription?.status === 'active';
  const isTrial = subscription?.status === 'trial' && !isTrialExpired;
  const trialDaysLeft = subscription?.trial_end
    ? Math.max(0, Math.ceil((new Date(subscription.trial_end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const getStatusBadge = () => {
    if (!subscription) return <Badge variant="outline">No subscription</Badge>;
    if (isTrialExpired) return <Badge variant="destructive">Trial Expired</Badge>;
    if (isTrial) return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20">Trial ({trialDaysLeft}d left)</Badge>;
    if (isActive) return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Active</Badge>;
    if (subscription.status === 'canceled') return <Badge variant="outline" className="text-muted-foreground">Suspended</Badge>;
    return <Badge variant="outline">{subscription.status}</Badge>;
  };

  const getPrice = (plan: Plan) => {
    if (selectedCycle === 'annual' && plan.price_annual_usd) {
      return `$${plan.price_annual_usd}/yr ($${Math.round(plan.price_annual_usd / 12)}/mo)`;
    }
    if (plan.price_monthly_usd) return `$${plan.price_monthly_usd}/mo`;
    return 'Free';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Manage Subscription
          </DialogTitle>
          <DialogDescription>
            {organization?.name} — {getStatusBadge()}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Loading subscription data...</div>
        ) : !subscription ? (
          <div className="py-8 text-center text-muted-foreground text-sm">No subscription found for this organization.</div>
        ) : (
          <Tabs defaultValue="overview" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="change-plan" className="flex-1">Change Plan</TabsTrigger>
              <TabsTrigger value="activation" className="flex-1">Activation</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4 space-y-3">
              <div className="rounded-lg border border-border/60 divide-y divide-border/40">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Crown className="w-4 h-4" /> Current Plan
                  </div>
                  <span className="text-sm font-medium">{subscription.plans?.name || '—'}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="w-4 h-4" /> Status
                  </div>
                  {getStatusBadge()}
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="w-4 h-4" /> Billing Cycle
                  </div>
                  <span className="text-sm font-medium capitalize">{subscription.billing_cycle || 'Monthly'}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="w-4 h-4" /> Period End
                  </div>
                  <span className="text-sm font-medium">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </span>
                </div>
                {subscription.trial_end && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" /> Trial Ends
                    </div>
                    <span className={`text-sm font-medium ${isTrialExpired ? 'text-destructive' : ''}`}>
                      {new Date(subscription.trial_end).toLocaleDateString()}
                      {isTrial && ` (${trialDaysLeft} days left)`}
                    </span>
                  </div>
                )}
                {subscription.manually_activated_at && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4" /> Manual Activation
                    </div>
                    <span className="text-sm font-medium">
                      {new Date(subscription.manually_activated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {subscription.manual_activation_notes && (
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <FileText className="w-4 h-4" /> Activation Notes
                    </div>
                    <p className="text-sm text-foreground bg-muted/30 rounded-md px-3 py-2">
                      {subscription.manual_activation_notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2">
                {(isTrial || isTrialExpired) && (
                  <Button size="sm" variant="outline" className="flex-1" onClick={handleActivate} disabled={isActivating}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Activate Now
                  </Button>
                )}
                {isActive && (
                  <Button size="sm" variant="outline" className="flex-1 text-destructive hover:text-destructive" onClick={handleSuspend}>
                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                    Suspend
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* Change Plan Tab */}
            <TabsContent value="change-plan" className="mt-4 space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Select Plan</Label>
                  <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <div className="flex items-center justify-between gap-4">
                            <span>{plan.name}</span>
                            <span className="text-xs text-muted-foreground">{getPrice(plan)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Billing Cycle</Label>
                  <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly (-10%)</SelectItem>
                      <SelectItem value="annual">Annual (-20%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedPlanId && selectedPlanId !== subscription.plan_id && (
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Changing from</p>
                    <p className="text-sm">
                      <span className="font-medium">{subscription.plans?.name}</span>
                      {' → '}
                      <span className="font-medium text-primary">{plans.find(p => p.id === selectedPlanId)?.name}</span>
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  onClick={handleChangePlan}
                  disabled={isChangingPlan || selectedPlanId === subscription.plan_id}
                  className="w-full"
                >
                  {isChangingPlan ? 'Updating...' : 'Update Plan'}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Activation Tab */}
            <TabsContent value="activation" className="mt-4 space-y-4">
              {/* Extend Trial */}
              {(isTrial || isTrialExpired) && (
                <div className="rounded-lg border border-border/60 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <h4 className="text-sm font-semibold">Extend Trial</h4>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Additional Days</Label>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={extendDays}
                        onChange={(e) => setExtendDays(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      onClick={handleExtendTrial}
                      disabled={isExtending}
                      className="self-end"
                      size="sm"
                    >
                      {isExtending ? 'Extending...' : 'Extend'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Manual Activation */}
              <div className="rounded-lg border border-border/60 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <h4 className="text-sm font-semibold">Manual Activation</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Manually activate this subscription (e.g., bank transfer payment received).
                </p>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Activation Notes</Label>
                  <Input
                    placeholder="e.g., Bank transfer confirmed — Invoice #1234"
                    value={activationNotes}
                    onChange={(e) => setActivationNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleActivate} disabled={isActivating} size="sm" className="w-full">
                  {isActivating ? 'Activating...' : 'Activate Subscription'}
                </Button>
              </div>

              {/* Suspend */}
              {isActive && (
                <div className="rounded-lg border border-destructive/20 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <h4 className="text-sm font-semibold text-destructive">Suspend Subscription</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will immediately suspend the organization's access.
                  </p>
                  <Button variant="destructive" size="sm" onClick={handleSuspend} className="w-full">
                    Suspend Subscription
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
