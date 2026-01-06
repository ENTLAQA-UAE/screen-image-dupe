import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Organization, UserWithRole, AppRole } from './types';

interface UsersSectionProps {
  users: UserWithRole[];
  organizations: Organization[];
  isLoading: boolean;
  onRefresh: () => void;
  isAssignAdminOpen: boolean;
  setIsAssignAdminOpen: (open: boolean) => void;
  selectedOrgId: string;
  setSelectedOrgId: (id: string) => void;
}

export function UsersSection({ 
  users, 
  organizations, 
  isLoading, 
  onRefresh,
  isAssignAdminOpen,
  setIsAssignAdminOpen,
  selectedOrgId,
  setSelectedOrgId
}: UsersSectionProps) {
  const { toast } = useToast();
  
  // Create user form
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');
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
        
        setCreatedPassword(adminPassword);
        
        toast({
          title: "User created successfully",
          description: `${adminName} has been assigned as ${selectedRole.replace('_', ' ')} for the organization.`,
        });
        
        onRefresh();
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
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editUserName.trim() || null,
          organization_id: editUserOrgId || null,
        })
        .eq('id', editingUser.id);
      
      if (profileError) throw profileError;
      
      const currentRoles = editingUser.roles as AppRole[];
      const rolesToAdd = editUserRoles.filter(r => !currentRoles.includes(r));
      const rolesToRemove = currentRoles.filter(r => !editUserRoles.includes(r as AppRole));
      
      if (rolesToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', editingUser.id)
          .in('role', rolesToRemove);
        
        if (removeError) throw removeError;
      }
      
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
      onRefresh();
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

  return (
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
            <Button onClick={() => setIsAssignAdminOpen(true)}>
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
  );
}
