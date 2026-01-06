import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, UserPlus, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Organization, OrganizationStats, planColors } from './types';

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
  onOpenAssignAdmin 
}: OrganizationsSectionProps) {
  const { toast } = useToast();
  
  // Create organization form
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState('free');
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  
  // Edit organization form
  const [isEditOrgOpen, setIsEditOrgOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editOrgName, setEditOrgName] = useState('');
  const [editOrgSlug, setEditOrgSlug] = useState('');
  const [editOrgPlan, setEditOrgPlan] = useState('');
  const [editOrgColor, setEditOrgColor] = useState('');
  const [isUpdatingOrg, setIsUpdatingOrg] = useState(false);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    
    setIsCreatingOrg(true);
    
    const slug = newOrgSlug.trim() || newOrgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const { error } = await supabase
      .from('organizations')
      .insert({
        name: newOrgName.trim(),
        slug,
        plan: newOrgPlan,
      });
    
    setIsCreatingOrg(false);
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to create organization",
        description: error.message,
      });
    } else {
      toast({
        title: "Organization created",
        description: `${newOrgName} has been created successfully.`,
      });
      setIsCreateOrgOpen(false);
      setNewOrgName('');
      setNewOrgSlug('');
      setNewOrgPlan('free');
      onRefresh();
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
      toast({
        variant: "destructive",
        title: "Failed to update organization",
        description: error.message,
      });
    } else {
      toast({
        title: "Organization updated",
        description: `${editOrgName} has been updated successfully.`,
      });
      setIsEditOrgOpen(false);
      setEditingOrg(null);
      onRefresh();
    }
  };

  const handleToggleOrgActive = async (orgId: string, currentlyActive: boolean) => {
    const { error } = await supabase
      .from('organizations')
      .update({ is_active: !currentlyActive })
      .eq('id', orgId);
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to update organization status",
        description: error.message,
      });
    } else {
      toast({
        title: currentlyActive ? "Organization deactivated" : "Organization activated",
        description: `The organization has been ${currentlyActive ? 'deactivated' : 'activated'}.`,
      });
      onRefresh();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            Organizations
          </h1>
          <p className="text-muted-foreground">
            Manage client organizations, plans, and settings
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
                Add a new client organization to the platform.
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
                {isCreatingOrg ? "Creating..." : "Create Organization"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No organizations yet. Create your first organization.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Assessments</TableHead>
                  <TableHead className="text-center">Participants</TableHead>
                  <TableHead className="text-center">Groups</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id} className={org.is_active === false ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: org.primary_color || '#0f172a' }}
                        >
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          {org.slug && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <LinkIcon className="h-3 w-3" />
                              {org.slug}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={planColors[org.plan || 'free']}>
                        {org.plan || 'free'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={org.is_active !== false}
                          onCheckedChange={() => handleToggleOrgActive(org.id, org.is_active !== false)}
                        />
                        <span className={`text-xs font-medium ${org.is_active !== false ? 'text-success' : 'text-muted-foreground'}`}>
                          {org.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {orgStats[org.id]?.assessments || 0}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {orgStats[org.id]?.participants || 0}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {orgStats[org.id]?.groups || 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.created_at ? new Date(org.created_at).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditOrg(org)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenAssignAdmin(org.id)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Organization Dialog */}
      <Dialog open={isEditOrgOpen} onOpenChange={setIsEditOrgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update organization details and settings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateOrganization} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-org-name">Organization Name</Label>
              <Input
                id="edit-org-name"
                value={editOrgName}
                onChange={(e) => setEditOrgName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-org-slug">Slug</Label>
              <Input
                id="edit-org-slug"
                value={editOrgSlug}
                onChange={(e) => setEditOrgSlug(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-org-plan">Plan</Label>
              <Select value={editOrgPlan} onValueChange={setEditOrgPlan}>
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
            <div className="space-y-2">
              <Label htmlFor="edit-org-color">Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-org-color"
                  type="color"
                  value={editOrgColor}
                  onChange={(e) => setEditOrgColor(e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={editOrgColor}
                  onChange={(e) => setEditOrgColor(e.target.value)}
                  placeholder="#0f172a"
                  className="flex-1"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isUpdatingOrg}>
              {isUpdatingOrg ? "Updating..." : "Update Organization"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
