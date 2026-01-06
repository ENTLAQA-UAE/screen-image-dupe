import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Organization, OrganizationStats, planColors, planFeatures } from './types';

interface SubscriptionsSectionProps {
  organizations: Organization[];
  orgStats: Record<string, OrganizationStats>;
  onEditOrg: (org: Organization) => void;
}

export function SubscriptionsSection({ organizations, orgStats, onEditOrg }: SubscriptionsSectionProps) {
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
          Subscription Plans
        </h1>
        <p className="text-muted-foreground">
          Manage subscription plans and view plan distribution
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {['free', 'starter', 'professional', 'enterprise'].map((plan) => (
          <Card key={plan} className={`${plan === 'enterprise' ? 'border-highlight' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge className={planColors[plan]}>
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </Badge>
                {plan === 'enterprise' && <Crown className="h-5 w-5 text-highlight" />}
              </div>
              <CardTitle className="text-3xl font-bold mt-4">
                {planBreakdown[plan] || 0}
              </CardTitle>
              <CardDescription>organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                {planFeatures[plan].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Organizations by Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations by Plan</CardTitle>
          <CardDescription>View and manage organization subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Current Plan</TableHead>
                <TableHead className="text-center">Usage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
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
                    <span className="text-sm text-muted-foreground">
                      {orgStats[org.id]?.assessments || 0} assessments, {orgStats[org.id]?.participants || 0} participants
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditOrg(org)}
                    >
                      Change Plan
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
