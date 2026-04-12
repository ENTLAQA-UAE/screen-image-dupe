import { motion } from 'framer-motion';
import { Building2, Users, FileText, TrendingUp, BarChart3, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Organization, OrganizationStats, UserWithRole, planColors } from './types';

interface DashboardSectionProps {
  organizations: Organization[];
  orgStats: Record<string, OrganizationStats>;
  users: UserWithRole[];
  isLoading: boolean;
  onViewAllOrganizations: () => void;
}

export function DashboardSection({
  organizations,
  orgStats,
  users,
  isLoading,
  onViewAllOrganizations
}: DashboardSectionProps) {
  const totalAssessments = Object.values(orgStats).reduce((sum, s) => sum + s.assessments, 0);
  const totalParticipants = Object.values(orgStats).reduce((sum, s) => sum + s.participants, 0);
  const activeOrgs = organizations.filter(o => o.is_active !== false).length;
  const trialOrgs = organizations.length - activeOrgs;
  const planBreakdown = organizations.reduce((acc, org) => {
    const plan = org.plan || 'free';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const kpiCards = [
    {
      title: 'Total Organizations',
      value: organizations.length,
      subtitle: `${activeOrgs} active, ${trialOrgs} trial`,
      icon: Building2,
    },
    {
      title: 'Active Users',
      value: users.length,
      subtitle: 'Across all organizations',
      icon: Users,
    },
    {
      title: 'Assessments',
      value: totalAssessments,
      subtitle: 'Created assessments',
      icon: FileText,
    },
    {
      title: 'Participants',
      value: totalParticipants,
      subtitle: 'Total participants',
      icon: TrendingUp,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          Welcome to Qudurat
        </h1>
        <p className="text-muted-foreground">
          AI-Powered Assessment Platform — Here's what's happening across your platform.
        </p>
      </div>

      {/* KPI Cards - Kawadir-style: clean white, icon top-right, no colored borders */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="bg-white rounded-xl border border-border/60 p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <card.icon className="w-5 h-5 text-muted-foreground/40" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row - Plan Distribution + Stats */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Plan Distribution */}
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Subscription Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {['free', 'starter', 'professional', 'enterprise'].map((plan) => {
                const count = planBreakdown[plan] || 0;
                const percentage = organizations.length > 0
                  ? Math.round((count / organizations.length) * 100)
                  : 0;

                return (
                  <div key={plan} className="p-4 rounded-xl bg-muted/30 border border-border/40">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={planColors[plan]} variant="outline">
                        {plan.charAt(0).toUpperCase() + plan.slice(1)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{percentage}%</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{count}</div>
                    <p className="text-xs text-muted-foreground">organizations</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Platform Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/40">
                <div>
                  <p className="text-sm text-muted-foreground">Enterprise Clients</p>
                  <p className="text-2xl font-bold text-foreground">{planBreakdown['enterprise'] || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-500" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/40">
                <div>
                  <p className="text-sm text-muted-foreground">Total Assessment Groups</p>
                  <p className="text-2xl font-bold text-foreground">
                    {Object.values(orgStats).reduce((sum, s) => sum + s.groups, 0)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-indigo-500" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/40">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Assessments per Org</p>
                  <p className="text-2xl font-bold text-foreground">
                    {organizations.length > 0
                      ? Math.round(totalAssessments / organizations.length)
                      : 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Organizations */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Recent Organizations</CardTitle>
            <CardDescription>Latest clients added to the platform</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onViewAllOrganizations}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No organizations yet.
            </div>
          ) : (
            <div className="rounded-lg border border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">Organization</TableHead>
                    <TableHead className="font-semibold">Plan</TableHead>
                    <TableHead className="text-center font-semibold">Assessments</TableHead>
                    <TableHead className="text-center font-semibold">Participants</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.slice(0, 5).map((org) => (
                    <TableRow key={org.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                            style={{ backgroundColor: org.primary_color || '#4F46E5' }}
                          >
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">{org.name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={planColors[org.plan || 'free']} variant="outline">
                          {(org.plan || 'free').charAt(0).toUpperCase() + (org.plan || 'free').slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {orgStats[org.id]?.assessments || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {orgStats[org.id]?.participants || 0}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {org.created_at ? new Date(org.created_at).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
