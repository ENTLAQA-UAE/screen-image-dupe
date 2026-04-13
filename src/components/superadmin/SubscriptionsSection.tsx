import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Building2, CreditCard, Clock, CheckCircle2, XCircle, AlertTriangle, Calendar, Wallet, CircleDollarSign, Pencil } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Organization, OrganizationStats, planColors } from './types';
import { ManageSubscriptionDialog } from './ManageSubscriptionDialog';

interface OrgSubscription {
  organization_id: string;
  status: string;
  trial_end: string | null;
  current_period_end: string;
  billing_cycle: string;
  payment_method: string;
  plan_id: string;
  plans: {
    name: string;
    slug: string;
    price_monthly_usd: number | null;
    price_annual_usd: number | null;
  } | null;
}

interface SubscriptionsSectionProps {
  organizations: Organization[];
  orgStats: Record<string, OrganizationStats>;
  onEditOrg?: (org: Organization) => void;
}

export function SubscriptionsSection({ organizations, orgStats, onEditOrg }: SubscriptionsSectionProps) {
  const [subscriptions, setSubscriptions] = useState<Record<string, OrgSubscription>>({});
  const [managingOrg, setManagingOrg] = useState<Organization | null>(null);
  const [isManageSubOpen, setIsManageSubOpen] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, [organizations]);

  const fetchSubscriptions = async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('organization_id, status, trial_end, current_period_end, billing_cycle, payment_method, plan_id, plans (name, slug, price_monthly_usd, price_annual_usd)');

    if (!error && data) {
      const map: Record<string, OrgSubscription> = {};
      data.forEach((s) => {
        map[s.organization_id] = {
          ...s,
          plans: s.plans as OrgSubscription['plans'],
        };
      });
      setSubscriptions(map);
    }
  };

  // Revenue calculations
  const now = new Date();
  const activeSubs = Object.values(subscriptions).filter(s => s.status === 'active');
  const trialSubs = Object.values(subscriptions).filter(s => {
    if (s.status !== 'trial') return false;
    if (!s.trial_end) return true;
    return new Date(s.trial_end) >= now;
  });
  const expiredSubs = Object.values(subscriptions).filter(s => {
    if (s.status !== 'trial' || !s.trial_end) return false;
    return new Date(s.trial_end) < now;
  });

  const mrr = activeSubs.reduce((sum, s) => {
    const monthly = s.plans?.price_monthly_usd || 0;
    const annual = s.plans?.price_annual_usd || 0;
    if (s.billing_cycle === 'annual' && annual > 0) return sum + (annual / 12);
    return sum + monthly;
  }, 0);

  const arr = mrr * 12;
  const arpu = activeSubs.length > 0 ? mrr / activeSubs.length : 0;

  // Revenue by tier
  const revenueByTier = activeSubs.reduce((acc, s) => {
    const tierName = s.plans?.name || 'Unknown';
    const monthly = s.billing_cycle === 'annual' && s.plans?.price_annual_usd
      ? s.plans.price_annual_usd / 12
      : (s.plans?.price_monthly_usd || 0);
    if (!acc[tierName]) acc[tierName] = { count: 0, revenue: 0 };
    acc[tierName].count += 1;
    acc[tierName].revenue += monthly;
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  const maxTierRevenue = Math.max(...Object.values(revenueByTier).map(t => t.revenue), 1);

  const getStatusBadge = (orgId: string) => {
    const sub = subscriptions[orgId];
    if (!sub) return <Badge variant="outline" className="text-muted-foreground text-xs">—</Badge>;

    const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;

    if (sub.status === 'trial' && trialEnd && trialEnd < now) {
      return <Badge variant="destructive" className="text-xs">expired</Badge>;
    }
    if (sub.status === 'trial') {
      return <Badge className="bg-muted text-muted-foreground text-xs">trial</Badge>;
    }
    if (sub.status === 'active') {
      return <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">active</Badge>;
    }
    if (sub.status === 'canceled') {
      return <Badge variant="outline" className="text-muted-foreground text-xs">canceled</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{sub.status}</Badge>;
  };

  const getMonthlyPrice = (orgId: string) => {
    const sub = subscriptions[orgId];
    if (!sub || sub.status === 'trial') return '—';
    const monthly = sub.billing_cycle === 'annual' && sub.plans?.price_annual_usd
      ? sub.plans.price_annual_usd / 12
      : (sub.plans?.price_monthly_usd || 0);
    return monthly > 0 ? `$${Math.round(monthly).toLocaleString()}` : '—';
  };

  const getRenewalDate = (orgId: string) => {
    const sub = subscriptions[orgId];
    if (!sub || sub.status === 'trial') return '—';
    if (!sub.current_period_end) return '—';
    return new Date(sub.current_period_end).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCycleBadge = (orgId: string) => {
    const sub = subscriptions[orgId];
    if (!sub) return null;
    return (
      <Badge variant="outline" className="text-xs capitalize">
        {sub.billing_cycle || 'Monthly'}
      </Badge>
    );
  };

  const formatCurrency = (val: number) =>
    `$${Math.round(val).toLocaleString()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          Billing & Revenue
        </h1>
        <p className="text-muted-foreground">
          Monitor platform revenue, manage subscriptions, and activate plans manually
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border/60 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Monthly Revenue (MRR)</p>
            <DollarSign className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{formatCurrency(mrr)}</p>
          <p className="text-xs text-muted-foreground">From {activeSubs.length} active subscription{activeSubs.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-card rounded-xl border border-border/60 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Annual Revenue (ARR)</p>
            <TrendingUp className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{formatCurrency(arr)}</p>
          <p className="text-xs text-muted-foreground">Projected yearly revenue</p>
        </div>
        <div className="bg-card rounded-xl border border-border/60 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Total Organizations</p>
            <Building2 className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{organizations.length}</p>
          <p className="text-xs text-muted-foreground">
            {activeSubs.length} active, {trialSubs.length} trial{expiredSubs.length > 0 ? `, ${expiredSubs.length} expired` : ''}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border/60 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Avg Revenue/Customer</p>
            <CreditCard className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{formatCurrency(arpu)}</p>
          <p className="text-xs text-muted-foreground">ARPU monthly</p>
        </div>
      </div>

      {/* Revenue by Tier + Billing Overview */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by Tier */}
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Revenue by Tier</CardTitle>
            <CardDescription>Monthly revenue breakdown by subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(revenueByTier).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No active paid subscriptions yet</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(revenueByTier).map(([tier, data]) => (
                  <div key={tier}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{tier}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{data.count} orgs</Badge>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{formatCurrency(data.revenue)}</span>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${(data.revenue / maxTierRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing Overview */}
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Billing Overview</CardTitle>
            <CardDescription>Platform billing configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="flex items-center justify-between py-3.5 border-b border-border/40">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium text-foreground">Billing Cycles</p>
                  <p className="text-xs text-muted-foreground">Monthly / Quarterly (-10%) / Annually (-20%)</p>
                </div>
              </div>
              <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">Active</Badge>
            </div>
            <div className="flex items-center justify-between py-3.5 border-b border-border/40">
              <div className="flex items-center gap-3">
                <Wallet className="w-4 h-4 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium text-foreground">Payment Methods</p>
                  <p className="text-xs text-muted-foreground">Stripe, Bank Transfer</p>
                </div>
              </div>
              <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-3">
                <CircleDollarSign className="w-4 h-4 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium text-foreground">Currency</p>
                  <p className="text-xs text-muted-foreground">USD</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">Default</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Subscriptions Table */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Organization Subscriptions</CardTitle>
          <CardDescription>Manage subscriptions for all organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">Organization</TableHead>
                  <TableHead className="font-semibold">Tier</TableHead>
                  <TableHead className="font-semibold">Cycle</TableHead>
                  <TableHead className="font-semibold">Monthly</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Renewal</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => {
                  const sub = subscriptions[org.id];
                  const tierName = sub?.plans?.name || '—';

                  return (
                    <TableRow key={org.id} className="hover:bg-muted/20">
                      <TableCell>
                        <span className="font-medium text-foreground">{org.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground/80">{tierName}</span>
                      </TableCell>
                      <TableCell>
                        {getCycleBadge(org.id)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-foreground">{getMonthlyPrice(org.id)}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(org.id)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{getRenewalDate(org.id)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80 text-xs gap-1.5"
                          onClick={() => { setManagingOrg(org); setIsManageSubOpen(true); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Manage Subscription
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Manage Subscription Dialog */}
      <ManageSubscriptionDialog
        open={isManageSubOpen}
        onOpenChange={setIsManageSubOpen}
        organization={managingOrg}
        onRefresh={fetchSubscriptions}
      />
    </motion.div>
  );
}
