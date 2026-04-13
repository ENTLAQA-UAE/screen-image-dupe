import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, Building2, CheckCircle2, Clock, XCircle, MoreHorizontal,
  Eye, Edit, Crown, UserPlus, Power, Trash2, Link as LinkIcon, Users, FileText, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Organization, OrganizationStats, planColors } from './types';
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/ui/table-pagination';
import { ManageSubscriptionDialog } from './ManageSubscriptionDialog';

interface OrgSubscription {
  organization_id: string;
  status: string;
  trial_end: string | null;
  plan_id: string;
  plans: { name: string; slug: string } | null;
}

interface OrganizationsSectionProps {
  organizations: Organization[];
  orgStats: Record<string, OrganizationStats>;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenAssignAdmin: (orgId: string) => void;
}

export function OrganizationsSection({
  organizations,
  orgStats,
  isLoading,
  onRefresh,
  onOpenAssignAdmin,
}: OrganizationsSectionProps) {
  const { toast } = useToast();

  // Subscription data
  const [subscriptions, setSubscriptions] = useState<Record<string, OrgSubscription>>({});

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  // Create org dialog
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState('free');
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  // Edit org dialog
  const [isEditOrgOpen, setIsEditOrgOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editOrgName, setEditOrgName] = useState('');
  const [editOrgSlug, setEditOrgSlug] = useState('');
  const [editOrgPlan, setEditOrgPlan] = useState('');
  const [editOrgColor, setEditOrgColor] = useState('');
  const [isUpdatingOrg, setIsUpdatingOrg] = useState(false);

  // View details dialog
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);

  // Manage subscription dialog
  const [isManageSubOpen, setIsManageSubOpen] = useState(false);
  const [managingOrg, setManagingOrg] = useState<Organization | null>(null);

  // Delete confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch subscriptions
  useEffect(() => {
    fetchSubscriptions();
  }, [organizations]);

  const fetchSubscriptions = async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('organization_id, status, trial_end, plan_id, plans (name, slug)');

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

  // Status helpers
  const now = new Date();

  const getOrgStatus = (org: Organization): 'active' | 'trial' | 'expired' | 'suspended' => {
    if (org.is_active === false) return 'suspended';
    const sub = subscriptions[org.id];
    if (!sub) return 'trial';
    if (sub.status === 'active') return 'active';
    if (sub.status === 'canceled') return 'suspended';
    if (sub.status === 'trial') {
      if (sub.trial_end && new Date(sub.trial_end) < now) return 'expired';
      return 'trial';
    }
    return 'trial';
  };

  // KPI counts
  const statusCounts = useMemo(() => {
    const counts = { total: organizations.length, active: 0, trial: 0, suspended: 0 };
    organizations.forEach(org => {
      const status = getOrgStatus(org);
      if (status === 'active') counts.active++;
      else if (status === 'trial') counts.trial++;
      else counts.suspended++; // expired + suspended
    });
    return counts;
  }, [organizations, subscriptions]);

  // Filtered & sorted
  const filteredOrganizations = useMemo(() => {
    return organizations.filter(org => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = org.name.toLowerCase().includes(q);
        const matchSlug = org.slug?.toLowerCase().includes(q);
        if (!matchName && !matchSlug) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const status = getOrgStatus(org);
        if (statusFilter === 'expired') {
          if (status !== 'expired') return false;
        } else if (status !== statusFilter) {
          return false;
        }
      }

      // Tier filter
      if (tierFilter !== 'all') {
        const sub = subscriptions[org.id];
        const slug = sub?.plans?.slug || org.plan || 'free';
        if (slug !== tierFilter) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [organizations, subscriptions, searchQuery, statusFilter, tierFilter]);

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedOrganizations,
    goToPage,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filteredOrganizations);

  // --- Handlers ---

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setIsCreatingOrg(true);

    const slug = newOrgSlug.trim() || newOrgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const { error } = await supabase
      .from('organizations')
      .insert({ name: newOrgName.trim(), slug, plan: newOrgPlan });

    setIsCreatingOrg(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to create organization', description: error.message });
    } else {
      toast({ title: 'Organization created', description: `${newOrgName} has been created with a 14-day trial.` });
      setIsCreateOrgOpen(false);
      setNewOrgName('');
      setNewOrgSlug('');
      setNewOrgPlan('free');
      onRefresh();
      fetchSubscriptions();
    }
  };

  const openEditOrg = (org: Organization) => {
    setEditingOrg(org);
    setEditOrgName(org.name);
    setEditOrgSlug(org.slug || '');
    setEditOrgPlan(org.plan || 'free');
    setEditOrgColor(org.primary_color || '#0f172a');
    setIsEditOrgOpen(true);
  };

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg || !editOrgName.trim()) return;
    setIsUpdatingOrg(true);

    const { error } = await supabase
      .from('organizations')
      .update({
        name: editOrgName.trim(),
        slug: editOrgSlug.trim() || null,
        plan: editOrgPlan,
        primary_color: editOrgColor,
      })
      .eq('id', editingOrg.id);

    setIsUpdatingOrg(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to update organization', description: error.message });
    } else {
      toast({ title: 'Organization updated', description: `${editOrgName} has been updated.` });
      setIsEditOrgOpen(false);
      setEditingOrg(null);
      onRefresh();
    }
  };

  const handleToggleOrgActive = async (org: Organization) => {
    const currentlyActive = org.is_active !== false;
    const { error } = await supabase
      .from('organizations')
      .update({ is_active: !currentlyActive })
      .eq('id', org.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to update status', description: error.message });
    } else {
      toast({
        title: currentlyActive ? 'Organization deactivated' : 'Organization activated',
        description: `${org.name} has been ${currentlyActive ? 'deactivated' : 'activated'}.`,
      });
      onRefresh();
    }
  };

  const handleDeleteOrg = async () => {
    if (!deletingOrg) return;
    setIsDeleting(true);

    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', deletingOrg.id);

    setIsDeleting(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to delete organization', description: error.message });
    } else {
      toast({ title: 'Organization deleted', description: `${deletingOrg.name} has been permanently deleted.` });
      setIsDeleteOpen(false);
      setDeletingOrg(null);
      onRefresh();
    }
  };

  const openViewDetails = (org: Organization) => {
    setViewingOrg(org);
    setIsViewDetailsOpen(true);
  };

  const openManageSub = (org: Organization) => {
    setManagingOrg(org);
    setIsManageSubOpen(true);
  };

  const confirmDelete = (org: Organization) => {
    setDeletingOrg(org);
    setIsDeleteOpen(true);
  };

  // Status badge
  const getStatusBadge = (org: Organization) => {
    const status = getOrgStatus(org);
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">Active</Badge>;
      case 'trial': {
        const sub = subscriptions[org.id];
        const daysLeft = sub?.trial_end
          ? Math.max(0, Math.ceil((new Date(sub.trial_end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : 0;
        return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-xs">Trial ({daysLeft}d)</Badge>;
      }
      case 'expired':
        return <Badge variant="destructive" className="text-xs">Expired</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="text-muted-foreground text-xs">Suspended</Badge>;
    }
  };

  // Tier name
  const getTierName = (org: Organization) => {
    const sub = subscriptions[org.id];
    return sub?.plans?.name || org.plan || 'Free';
  };

  const getTierSlug = (org: Organization) => {
    const sub = subscriptions[org.id];
    return sub?.plans?.slug || org.plan || 'free';
  };

  const handleRefreshAll = () => {
    onRefresh();
    fetchSubscriptions();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            Organizations
          </h1>
          <p className="text-muted-foreground">
            Manage client organizations, subscriptions, and settings
          </p>
        </div>
        <Dialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>
                A 14-day trial subscription will be created automatically.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateOrganization} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  placeholder="Acme Corporation"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-slug">Slug (optional)</Label>
                <Input
                  id="org-slug"
                  placeholder="acme-corp"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-plan">Plan</Label>
                <Select value={newOrgPlan} onValueChange={setNewOrgPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isCreatingOrg}>
                {isCreatingOrg ? 'Creating...' : 'Create Organization'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setStatusFilter('all')}
          className={`bg-card rounded-xl border p-5 text-left transition-all hover:shadow-md ${statusFilter === 'all' ? 'border-primary shadow-sm' : 'border-border/60'}`}
        >
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Total Organizations</p>
            <Building2 className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <p className="text-3xl font-bold text-foreground">{statusCounts.total}</p>
        </button>
        <button
          onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
          className={`bg-card rounded-xl border p-5 text-left transition-all hover:shadow-md ${statusFilter === 'active' ? 'border-green-500 shadow-sm' : 'border-border/60'}`}
        >
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Active</p>
            <CheckCircle2 className="w-5 h-5 text-green-500/40" />
          </div>
          <p className="text-3xl font-bold text-green-600">{statusCounts.active}</p>
        </button>
        <button
          onClick={() => setStatusFilter(statusFilter === 'trial' ? 'all' : 'trial')}
          className={`bg-card rounded-xl border p-5 text-left transition-all hover:shadow-md ${statusFilter === 'trial' ? 'border-amber-500 shadow-sm' : 'border-border/60'}`}
        >
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Trial</p>
            <Clock className="w-5 h-5 text-amber-500/40" />
          </div>
          <p className="text-3xl font-bold text-amber-600">{statusCounts.trial}</p>
        </button>
        <button
          onClick={() => setStatusFilter(statusFilter === 'suspended' ? 'all' : 'suspended')}
          className={`bg-card rounded-xl border p-5 text-left transition-all hover:shadow-md ${statusFilter === 'suspended' ? 'border-red-500 shadow-sm' : 'border-border/60'}`}
        >
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Suspended / Expired</p>
            <XCircle className="w-5 h-5 text-red-500/40" />
          </div>
          <p className="text-3xl font-bold text-red-600">{statusCounts.suspended}</p>
        </button>
      </div>

      {/* Search & Filters */}
      <Card className="border-border/60 mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">All Organizations</CardTitle>
              <CardDescription>{filteredOrganizations.length} organization{filteredOrganizations.length !== 1 ? 's' : ''} found</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {organizations.length === 0 ? 'No organizations yet. Create your first organization.' : 'No organizations match your filters.'}
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">Organization</TableHead>
                      <TableHead className="font-semibold">Tier</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-center">Usage</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrganizations.map((org) => (
                      <TableRow key={org.id} className={`hover:bg-muted/20 ${org.is_active === false ? 'opacity-60' : ''}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{ backgroundColor: org.primary_color || '#0f172a' }}
                            >
                              {org.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-foreground truncate">{org.name}</div>
                              {org.slug && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <LinkIcon className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{org.slug}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={planColors[getTierSlug(org)] || planColors.free} variant="outline">
                            {getTierName(org)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(org)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1" title="Assessments">
                              <FileText className="w-3.5 h-3.5" />
                              {orgStats[org.id]?.assessments || 0}
                            </span>
                            <span className="flex items-center gap-1" title="Participants">
                              <Users className="w-3.5 h-3.5" />
                              {orgStats[org.id]?.participants || 0}
                            </span>
                            <span className="flex items-center gap-1" title="Groups">
                              <Layers className="w-3.5 h-3.5" />
                              {orgStats[org.id]?.groups || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {org.created_at ? new Date(org.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => openViewDetails(org)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditOrg(org)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openManageSub(org)}>
                                <Crown className="w-4 h-4 mr-2" />
                                Manage Subscription
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onOpenAssignAdmin(org.id)}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Assign Admin
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleToggleOrgActive(org)}>
                                <Power className="w-4 h-4 mr-2" />
                                {org.is_active !== false ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => confirmDelete(org)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: viewingOrg?.primary_color || '#0f172a' }}
              >
                {viewingOrg?.name?.charAt(0).toUpperCase()}
              </div>
              {viewingOrg?.name}
            </DialogTitle>
            <DialogDescription>Organization details and subscription info</DialogDescription>
          </DialogHeader>
          {viewingOrg && (
            <div className="mt-2 space-y-4">
              <div className="rounded-lg border border-border/60 divide-y divide-border/40">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Slug</span>
                  <span className="text-sm font-medium">{viewingOrg.slug || '—'}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Tier</span>
                  <Badge className={planColors[getTierSlug(viewingOrg)] || planColors.free} variant="outline">
                    {getTierName(viewingOrg)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(viewingOrg)}
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <Badge variant={viewingOrg.is_active !== false ? 'default' : 'outline'}>
                    {viewingOrg.is_active !== false ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm font-medium">
                    {viewingOrg.created_at ? new Date(viewingOrg.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Usage</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{orgStats[viewingOrg.id]?.assessments || 0}</p>
                    <p className="text-xs text-muted-foreground">Assessments</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{orgStats[viewingOrg.id]?.participants || 0}</p>
                    <p className="text-xs text-muted-foreground">Participants</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{orgStats[viewingOrg.id]?.groups || 0}</p>
                    <p className="text-xs text-muted-foreground">Groups</p>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" size="sm" onClick={() => { setIsViewDetailsOpen(false); openEditOrg(viewingOrg); }}>
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button size="sm" onClick={() => { setIsViewDetailsOpen(false); openManageSub(viewingOrg); }}>
                  <Crown className="w-3.5 h-3.5 mr-1.5" />
                  Manage Subscription
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog open={isEditOrgOpen} onOpenChange={setIsEditOrgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>Update organization details and settings.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateOrganization} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-org-name">Organization Name</Label>
              <Input id="edit-org-name" value={editOrgName} onChange={(e) => setEditOrgName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-org-slug">Slug</Label>
              <Input id="edit-org-slug" value={editOrgSlug} onChange={(e) => setEditOrgSlug(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-org-plan">Plan</Label>
              <Select value={editOrgPlan} onValueChange={setEditOrgPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-org-color">Brand Color</Label>
              <div className="flex gap-2">
                <Input id="edit-org-color" type="color" value={editOrgColor} onChange={(e) => setEditOrgColor(e.target.value)} className="w-16 h-10 p-1 cursor-pointer" />
                <Input value={editOrgColor} onChange={(e) => setEditOrgColor(e.target.value)} placeholder="#0f172a" className="flex-1" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isUpdatingOrg}>
              {isUpdatingOrg ? 'Updating...' : 'Update Organization'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Subscription Dialog */}
      <ManageSubscriptionDialog
        open={isManageSubOpen}
        onOpenChange={setIsManageSubOpen}
        organization={managingOrg}
        onRefresh={handleRefreshAll}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{deletingOrg?.name}</strong>? This action cannot be undone. All assessments, participants, and data associated with this organization will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrg} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Deleting...' : 'Delete Organization'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
