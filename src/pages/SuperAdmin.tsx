import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Plus, 
  Users, 
  LogOut, 
  Shield, 
  UserPlus, 
  Edit, 
  FileText, 
  TrendingUp,
  Crown,
  Palette,
  Link as LinkIcon,
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  plan: string | null;
  primary_color: string | null;
  logo_url: string | null;
  created_at: string | null;
}

interface OrganizationStats {
  assessments: number;
  participants: number;
  groups: number;
}

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  organization_id: string | null;
  organization_name?: string;
  roles: string[];
}

const planColors: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  starter: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  professional: 'bg-accent/10 text-accent border-accent/20',
  enterprise: 'bg-highlight/10 text-highlight border-highlight/20',
};

const planFeatures: Record<string, string[]> = {
  free: ['5 assessments', '50 participants/month', 'Basic reports'],
  starter: ['25 assessments', '250 participants/month', 'Standard reports', 'Email support'],
  professional: ['Unlimited assessments', '1000 participants/month', 'Advanced analytics', 'Priority support'],
  enterprise: ['Unlimited everything', 'Custom branding', 'API access', 'Dedicated support', 'SSO'],
};

export default function SuperAdmin() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgStats, setOrgStats] = useState<Record<string, OrganizationStats>>({});
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  // Assign org admin form
  const [isAssignAdminOpen, setIsAssignAdminOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [isAssigningAdmin, setIsAssigningAdmin] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch organizations with extended fields
    const { data: orgsData, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
    } else {
      setOrganizations(orgsData || []);
      
      // Fetch stats for each organization
      const statsMap: Record<string, OrganizationStats> = {};
      for (const org of orgsData || []) {
        const [assessmentsRes, participantsRes, groupsRes] = await Promise.all([
          supabase.from('assessments').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
          supabase.from('participants').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
          supabase.from('assessment_groups').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
        ]);
        
        statsMap[org.id] = {
          assessments: assessmentsRes.count || 0,
          participants: participantsRes.count || 0,
          groups: groupsRes.count || 0,
        };
      }
      setOrgStats(statsMap);
    }
    
    // Fetch profiles with their roles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        organization_id,
        organizations (name)
      `);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }
    
    // Fetch roles
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');
    
    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }
    
    // Combine data
    if (profilesData) {
      const usersWithRoles: UserWithRole[] = profilesData.map(profile => {
        const userRoles = rolesData?.filter(r => r.user_id === profile.id).map(r => r.role) || [];
        return {
          id: profile.id,
          email: '',
          full_name: profile.full_name,
          organization_id: profile.organization_id,
          organization_name: (profile.organizations as any)?.name,
          roles: userRoles,
        };
      });
      setUsers(usersWithRoles);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      fetchData();
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
      fetchData();
    }
  };

  const handleAssignOrgAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword || !adminName.trim() || !selectedOrgId) return;
    
    setIsAssigningAdmin(true);
    
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail.trim(),
        password: adminPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: adminName.trim(),
            organization_id: selectedOrgId,
          }
        }
      });
      
      if (signUpError) throw signUpError;
      
      if (signUpData.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: signUpData.user.id,
            role: 'org_admin',
          });
        
        if (roleError) throw roleError;
        
        toast({
          title: "Organization Admin assigned",
          description: `${adminName} has been assigned as admin for the organization.`,
        });
        
        setIsAssignAdminOpen(false);
        setAdminEmail('');
        setAdminPassword('');
        setAdminName('');
        setSelectedOrgId('');
        fetchData();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to assign admin",
        description: error.message,
      });
    }
    
    setIsAssigningAdmin(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Calculate platform-wide stats
  const totalAssessments = Object.values(orgStats).reduce((sum, s) => sum + s.assessments, 0);
  const totalParticipants = Object.values(orgStats).reduce((sum, s) => sum + s.participants, 0);
  const planBreakdown = organizations.reduce((acc, org) => {
    const plan = org.plan || 'free';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-accent rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold">Super Admin Console</h1>
                <p className="text-sm text-muted-foreground">Jadarat Assess Platform Management</p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Platform Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
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
          </motion.div>
        </div>

        {/* Plan Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-8"
        >
          <Card>
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
        </motion.div>

        {/* Organizations Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Organizations</CardTitle>
                <CardDescription>Manage client organizations, plans, and settings</CardDescription>
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
            </CardHeader>
            <CardContent>
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
                      <TableHead className="text-center">Assessments</TableHead>
                      <TableHead className="text-center">Participants</TableHead>
                      <TableHead className="text-center">Groups</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow key={org.id}>
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
                          <span className="font-medium">{orgStats[org.id]?.assessments || 0}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{orgStats[org.id]?.participants || 0}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{orgStats[org.id]?.groups || 0}</span>
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
                              onClick={() => {
                                setSelectedOrgId(org.id);
                                setIsAssignAdminOpen(true);
                              }}
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
        </motion.div>

        {/* Edit Organization Dialog */}
        <Dialog open={isEditOrgOpen} onOpenChange={setIsEditOrgOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
              <DialogDescription>
                Update organization details and subscription plan.
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
                  placeholder="organization-slug"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-org-plan">Subscription Plan</Label>
                <Select value={editOrgPlan} onValueChange={setEditOrgPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">
                      <div className="flex items-center gap-2">
                        <span>Free</span>
                        <span className="text-xs text-muted-foreground">- Basic features</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="starter">
                      <div className="flex items-center gap-2">
                        <span>Starter</span>
                        <span className="text-xs text-muted-foreground">- 25 assessments</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="professional">
                      <div className="flex items-center gap-2">
                        <span>Professional</span>
                        <span className="text-xs text-muted-foreground">- Unlimited</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="enterprise">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-highlight" />
                        <span>Enterprise</span>
                        <span className="text-xs text-muted-foreground">- Full access</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Plan features preview */}
                <div className="mt-2 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium mb-2">Plan includes:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {planFeatures[editOrgPlan]?.map((feature, i) => (
                      <li key={i}>• {feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-org-color" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Brand Color
                </Label>
                <div className="flex items-center gap-3">
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
              
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditOrgOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isUpdatingOrg}>
                  {isUpdatingOrg ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Users Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>All users across organizations</CardDescription>
              </div>
              <Dialog open={isAssignAdminOpen} onOpenChange={setIsAssignAdminOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Org Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Organization Admin</DialogTitle>
                    <DialogDescription>
                      Create a new user and assign them as an organization admin.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAssignOrgAdmin} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-org">Organization</Label>
                      <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-name">Full Name</Label>
                      <Input
                        id="admin-name"
                        placeholder="John Doe"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="admin@company.com"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Temporary Password</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder="••••••••"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isAssigningAdmin || !selectedOrgId}>
                      {isAssigningAdmin ? "Assigning..." : "Assign Admin"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Roles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userItem) => (
                      <TableRow key={userItem.id}>
                        <TableCell className="font-medium">
                          {userItem.full_name || 'Unnamed'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {userItem.organization_name || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {userItem.roles.length > 0 ? (
                              userItem.roles.map((role) => (
                                <Badge 
                                  key={role} 
                                  variant="outline"
                                  className={role === 'super_admin' ? 'border-highlight text-highlight' : ''}
                                >
                                  {role.replace('_', ' ')}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">No roles</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
