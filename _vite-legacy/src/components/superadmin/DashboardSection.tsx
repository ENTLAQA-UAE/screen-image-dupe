import { motion } from 'framer-motion';
import { Building2, Users, FileText, TrendingUp, Crown, BarChart3 } from 'lucide-react';
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
  const planBreakdown = organizations.reduce((acc, org) => {
    const plan = org.plan || 'free';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          Platform Overview
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening on Jadarat Assess.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-5 gap-4 mb-8">
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{organizations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active clients</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-highlight">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Platform users</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAssessments}</div>
            <p className="text-xs text-muted-foreground mt-1">Created assessments</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalParticipants}</div>
            <p className="text-xs text-muted-foreground mt-1">Total participants</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Enterprise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{planBreakdown['enterprise'] || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Enterprise clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            Plan Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {['free', 'starter', 'professional', 'enterprise'].map((plan) => (
              <div key={plan} className="text-center p-4 rounded-xl bg-muted/50">
                <Badge className={`mb-2 ${planColors[plan]}`}>
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </Badge>
                <div className="text-2xl font-bold">{planBreakdown[plan] || 0}</div>
                <p className="text-xs text-muted-foreground">organizations</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Organizations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Organizations</CardTitle>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-center">Assessments</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.slice(0, 5).map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                          style={{ backgroundColor: org.primary_color || '#0f172a' }}
                        >
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{org.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={planColors[org.plan || 'free']}>
                        {org.plan || 'free'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {orgStats[org.id]?.assessments || 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.created_at ? new Date(org.created_at).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
