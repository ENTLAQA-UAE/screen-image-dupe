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
import { Building2, Plus, Users, LogOut, Shield, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  plan: string | null;
  created_at: string | null;
}

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  organization_id: string | null;
  organization_name?: string;
  roles: string[];
}

export default function SuperAdmin() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create organization form
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState('free');
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  
  // Assign org admin form
  const [isAssignAdminOpen, setIsAssignAdminOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [isAssigningAdmin, setIsAssigningAdmin] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch organizations
    const { data: orgsData, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
    } else {
      setOrganizations(orgsData || []);
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
          email: '', // Will be populated if needed
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

  const handleAssignOrgAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword || !adminName.trim() || !selectedOrgId) return;
    
    setIsAssigningAdmin(true);
    
    try {
      // Create user via signUp
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
        // Assign org_admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: signUpData.user.id,
            role: 'org_admin',
          });
        
        if (roleError) throw roleError;
        
        toast({
          title: "Organization Admin assigned",
          description: `${adminName} has been assigned as admin for the organization. They will receive a confirmation email.`,
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-accent" />
            <div>
              <h1 className="text-xl font-display font-bold">Super Admin Console</h1>
              <p className="text-sm text-muted-foreground">Jadarat Assess Platform Management</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Organizations
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{organizations.length}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Org Admins
                </CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {users.filter(u => u.roles.includes('org_admin')).length}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

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
                <CardDescription>Manage client organizations on the platform</CardDescription>
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
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell className="text-muted-foreground">{org.slug || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={org.plan === 'enterprise' ? 'default' : 'secondary'}>
                            {org.plan || 'free'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {org.created_at ? new Date(org.created_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrgId(org.id);
                              setIsAssignAdminOpen(true);
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add Admin
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

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
                                <Badge key={role} variant="outline">
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
