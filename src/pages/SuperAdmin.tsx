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
  CreditCard,
  UserCog,
  Settings,
  Power,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useNavigate, Link } from 'react-router-dom';

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  plan: string | null;
  primary_color: string | null;
  logo_url: string | null;
  created_at: string | null;
  is_active: boolean | null;
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

type AppRole = "super_admin" | "org_admin" | "hr_admin";

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

type ActiveSection = 'dashboard' | 'organizations' | 'users' | 'subscriptions' | 'settings';

export default function SuperAdmin() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
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
  const [selectedRole, setSelectedRole] = useState<AppRole>('org_admin');
  const [isAssigningAdmin, setIsAssigningAdmin] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  
  // Edit user state
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserOrgId, setEditUserOrgId] = useState('');
  const [editUserRoles, setEditUserRoles] = useState<AppRole[]>([]);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    
    const { data: orgsData, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
    } else {
      setOrganizations(orgsData || []);
      
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
    
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');
    
    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }
    
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
            role: selectedRole,
          });
        
        if (roleError) throw roleError;
        
        // Show the created password
        setCreatedPassword(adminPassword);
        
        toast({
          title: "User created successfully",
          description: `${adminName} has been assigned as ${selectedRole.replace('_', ' ')} for the organization.`,
        });
        
        fetchData();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create user",
        description: error.message,
      });
    }
    
    setIsAssigningAdmin(false);
  };

  const handleCloseCreateDialog = () => {
    setIsAssignAdminOpen(false);
    setAdminEmail('');
    setAdminPassword('');
    setAdminName('');
    setSelectedOrgId('');
    setSelectedRole('org_admin');
    setCreatedPassword(null);
  };

  const handleOpenEditUser = (userItem: UserWithRole) => {
    setEditingUser(userItem);
    setEditUserName(userItem.full_name || '');
    setEditUserOrgId(userItem.organization_id || '');
    setEditUserRoles(userItem.roles as AppRole[]);
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    setIsUpdatingUser(true);
    
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editUserName.trim() || null,
          organization_id: editUserOrgId || null,
        })
        .eq('id', editingUser.id);
      
      if (profileError) throw profileError;
      
      // Get current roles
      const currentRoles = editingUser.roles as AppRole[];
      
      // Determine roles to add and remove
      const rolesToAdd = editUserRoles.filter(r => !currentRoles.includes(r));
      const rolesToRemove = currentRoles.filter(r => !editUserRoles.includes(r as AppRole));
      
      // Remove roles
      if (rolesToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', editingUser.id)
          .in('role', rolesToRemove);
        
        if (removeError) throw removeError;
      }
      
      // Add roles
      if (rolesToAdd.length > 0) {
        const { error: addError } = await supabase
          .from('user_roles')
          .insert(rolesToAdd.map(role => ({
            user_id: editingUser.id,
            role,
          })));
        
        if (addError) throw addError;
      }
      
      toast({
        title: "User updated",
        description: `${editUserName || 'User'} has been updated successfully.`,
      });
      
      setIsEditUserOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update user",
        description: error.message,
      });
    }
    
    setIsUpdatingUser(false);
  };

  const toggleRole = (role: AppRole) => {
    if (editUserRoles.includes(role)) {
      setEditUserRoles(editUserRoles.filter(r => r !== role));
    } else {
      setEditUserRoles([...editUserRoles, role]);
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
      fetchData();
    }
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

  const navItems = [
    { id: 'dashboard' as ActiveSection, icon: BarChart3, label: 'Dashboard' },
    { id: 'organizations' as ActiveSection, icon: Building2, label: 'Organizations' },
    { id: 'users' as ActiveSection, icon: UserCog, label: 'Users & Roles' },
    { id: 'subscriptions' as ActiveSection, icon: CreditCard, label: 'Subscriptions' },
    { id: 'settings' as ActiveSection, icon: Settings, label: 'Platform Settings' },
  ];

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Super Admin';
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 h-screen bg-sidebar fixed left-0 top-0 border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-accent rounded-lg flex items-center justify-center shadow-glow">
              <span className="text-accent-foreground font-display font-bold">J</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-sidebar-foreground">Jadarat</span>
              <span className="text-[10px] text-sidebar-foreground/60 -mt-0.5 tracking-wider">ASSESS</span>
            </div>
          </Link>
        </div>

        {/* Super Admin Badge */}
        <div className="px-4 py-3 mx-4 mt-4 rounded-xl bg-highlight/10 border border-highlight/20">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-highlight" />
            <span className="text-xs font-semibold text-highlight">SUPER ADMIN</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 mt-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeSection === item.id 
                  ? "bg-sidebar-accent text-sidebar-primary" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-highlight/20 flex items-center justify-center">
              <span className="text-highlight font-semibold text-sm">
                {getUserName().charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{getUserName()}</p>
              <p className="text-xs text-highlight truncate">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-64 flex-1">
        <main className="p-8">
          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
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
                  <Button variant="outline" size="sm" onClick={() => setActiveSection('organizations')}>
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
          )}

          {/* Organizations Section */}
          {activeSection === 'organizations' && (
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
          )}

          {/* Users Section */}
          {activeSection === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-display font-bold text-foreground mb-1">
                    Users & Roles
                  </h1>
                  <p className="text-muted-foreground">
                    Manage all platform users and their role assignments
                  </p>
                </div>
                <Dialog open={isAssignAdminOpen} onOpenChange={(open) => !open && handleCloseCreateDialog()}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>
                        Create a new user and assign them to an organization with a role.
                      </DialogDescription>
                    </DialogHeader>
                    {createdPassword ? (
                      <div className="space-y-4 py-4">
                        <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                          <p className="text-success font-medium mb-2">User created successfully!</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Share these credentials with the user. They should change their password after first login.
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label className="w-20">Email:</Label>
                              <code className="flex-1 bg-muted px-2 py-1 rounded text-sm">{adminEmail}</code>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="w-20">Password:</Label>
                              <code className="flex-1 bg-muted px-2 py-1 rounded text-sm">{createdPassword}</code>
                            </div>
                          </div>
                        </div>
                        <Button onClick={handleCloseCreateDialog} className="w-full">
                          Done
                        </Button>
                      </div>
                    ) : (
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
                          <Label htmlFor="admin-role">Role</Label>
                          <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="org_admin">Organization Admin</SelectItem>
                              <SelectItem value="hr_admin">HR Admin</SelectItem>
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
                            type="text"
                            placeholder="Enter a temporary password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            required
                            minLength={6}
                          />
                          <p className="text-xs text-muted-foreground">
                            This password will be shown after creation. Min 6 characters.
                          </p>
                        </div>
                        <Button type="submit" className="w-full" disabled={isAssigningAdmin || !selectedOrgId}>
                          {isAssigningAdmin ? "Creating..." : "Create User"}
                        </Button>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="pt-6">
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
                          <TableHead className="w-20"></TableHead>
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
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditUser(userItem)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Edit User Dialog */}
              <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                      Update user details and role assignments.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Full Name</Label>
                      <Input
                        id="edit-name"
                        value={editUserName}
                        onChange={(e) => setEditUserName(e.target.value)}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-org">Organization</Label>
                      <Select value={editUserOrgId} onValueChange={setEditUserOrgId}>
                        <SelectTrigger>
                          <SelectValue placeholder="No organization" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No organization</SelectItem>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Roles</Label>
                      <div className="flex flex-wrap gap-2">
                        {(['org_admin', 'hr_admin', 'super_admin'] as AppRole[]).map((role) => (
                          <Badge
                            key={role}
                            variant={editUserRoles.includes(role) ? 'default' : 'outline'}
                            className={`cursor-pointer transition-colors ${
                              role === 'super_admin' 
                                ? editUserRoles.includes(role) 
                                  ? 'bg-highlight text-highlight-foreground' 
                                  : 'border-highlight/50 text-highlight hover:bg-highlight/10'
                                : ''
                            }`}
                            onClick={() => toggleRole(role)}
                          >
                            {role.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click on a role to toggle it on/off
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateUser} disabled={isUpdatingUser}>
                      {isUpdatingUser ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          )}

          {/* Subscriptions Section */}
          {activeSection === 'subscriptions' && (
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
                              onClick={() => openEditOrg(org)}
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
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-8">
                <h1 className="text-2xl font-display font-bold text-foreground mb-1">
                  Platform Settings
                </h1>
                <p className="text-muted-foreground">
                  Configure platform-wide settings and feature flags
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Feature Flags
                    </CardTitle>
                    <CardDescription>Enable or disable platform features</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium text-sm">AI Feedback Generation</p>
                        <p className="text-xs text-muted-foreground">Enable AI-generated feedback for assessments</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium text-sm">AI Talent Snapshot</p>
                        <p className="text-xs text-muted-foreground">Generate AI employee talent summaries</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium text-sm">Allow PDF Downloads</p>
                        <p className="text-xs text-muted-foreground">Let employees download their own reports</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium text-sm">Question Bank Sharing</p>
                        <p className="text-xs text-muted-foreground">Allow sharing questions across organizations</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-sm">Maintenance Mode</p>
                        <p className="text-xs text-muted-foreground">Block user access during maintenance</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>Authentication and security options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium text-sm">Require Email Verification</p>
                        <p className="text-xs text-muted-foreground">Users must verify email before access</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium text-sm">Two-Factor Authentication</p>
                        <p className="text-xs text-muted-foreground">Require 2FA for admin accounts</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium text-sm">Session Timeout</p>
                        <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-sm">IP Whitelisting</p>
                        <p className="text-xs text-muted-foreground">Restrict access to specific IPs</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Default Plan Limits
                  </CardTitle>
                  <CardDescription>Configure default limits for subscription plans</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-center">Assessments</TableHead>
                        <TableHead className="text-center">Participants/Month</TableHead>
                        <TableHead className="text-center">HR Admins</TableHead>
                        <TableHead className="text-center">AI Credits</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell><Badge className={planColors.free}>Free</Badge></TableCell>
                        <TableCell className="text-center">5</TableCell>
                        <TableCell className="text-center">50</TableCell>
                        <TableCell className="text-center">1</TableCell>
                        <TableCell className="text-center">10</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><Badge className={planColors.starter}>Starter</Badge></TableCell>
                        <TableCell className="text-center">25</TableCell>
                        <TableCell className="text-center">250</TableCell>
                        <TableCell className="text-center">3</TableCell>
                        <TableCell className="text-center">50</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><Badge className={planColors.professional}>Professional</Badge></TableCell>
                        <TableCell className="text-center">Unlimited</TableCell>
                        <TableCell className="text-center">1000</TableCell>
                        <TableCell className="text-center">10</TableCell>
                        <TableCell className="text-center">200</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><Badge className={planColors.enterprise}>Enterprise</Badge></TableCell>
                        <TableCell className="text-center">Unlimited</TableCell>
                        <TableCell className="text-center">Unlimited</TableCell>
                        <TableCell className="text-center">Unlimited</TableCell>
                        <TableCell className="text-center">Unlimited</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </main>
      </div>

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
                  <SelectItem value="free">Free - Basic features</SelectItem>
                  <SelectItem value="starter">Starter - 25 assessments</SelectItem>
                  <SelectItem value="professional">Professional - Unlimited</SelectItem>
                  <SelectItem value="enterprise">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-highlight" />
                      Enterprise - Full access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
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
    </div>
  );
}
