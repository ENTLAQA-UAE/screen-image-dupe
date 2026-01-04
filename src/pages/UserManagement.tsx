import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, UserPlus, Trash2, Loader2, Shield, Calendar, Pencil, Eye, EyeOff, Copy, Check } from "lucide-react";

type AppRole = "org_admin" | "hr_admin";

interface OrgUser {
  id: string;
  full_name: string | null;
  created_at: string | null;
  role: AppRole | null;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const { user, isOrgAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>("");
  const [maxHrAdmins, setMaxHrAdmins] = useState<number>(5);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create user dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("hr_admin");
  const [inviting, setInviting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Delete state
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<OrgUser | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState<AppRole>("hr_admin");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isOrgAdmin() && !isSuperAdmin()) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isOrgAdmin, isSuperAdmin, navigate]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchOrganization();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (organizationId) {
      fetchOrgUsers();
    }
  }, [organizationId]);

  const fetchOrganization = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();
    
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }
    
    setOrganizationId(profile.organization_id);
    
    const { data: org } = await supabase
      .from("organizations")
      .select("name, max_hr_admins")
      .eq("id", profile.organization_id)
      .maybeSingle();
    
    if (org) {
      setOrganizationName(org.name);
      setMaxHrAdmins(org.max_hr_admins || 5);
    }
  };

  const fetchOrgUsers = async () => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      // Get all profiles for this organization
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .eq("organization_id", organizationId);
      
      if (profilesError) throw profilesError;
      
      if (!profiles || profiles.length === 0) {
        setOrgUsers([]);
        setLoading(false);
        return;
      }
      
      // Get roles for these users
      const userIds = profiles.map(p => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);
      
      if (rolesError) throw rolesError;
      
      // Map profiles with their roles
      const users: OrgUser[] = profiles.map(p => {
        const userRole = roles?.find(r => r.user_id === p.id);
        return {
          id: p.id,
          full_name: p.full_name,
          created_at: p.created_at,
          role: userRole?.role as AppRole | null,
        };
      });
      
      setOrgUsers(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!inviteEmail || !inviteFullName || !invitePassword || !organizationId) return;
    
    // Check limit
    const hrAdminCount = orgUsers.filter(u => u.role === "hr_admin").length;
    if (inviteRole === "hr_admin" && hrAdminCount >= maxHrAdmins) {
      toast.error(`You have reached the maximum of ${maxHrAdmins} HR admins for your plan.`);
      return;
    }
    
    setInviting(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: inviteEmail,
        password: invitePassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: inviteFullName,
            organization_id: organizationId,
          },
        },
      });
      
      if (error) throw error;
      
      if (!data.user) {
        throw new Error("Failed to create user");
      }

      const newUserId = data.user.id;
      
      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Ensure profile exists and has correct organization_id
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, organization_id")
        .eq("id", newUserId)
        .maybeSingle();
      
      if (!existingProfile) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: newUserId,
          full_name: inviteFullName,
          organization_id: organizationId,
        });
        
        if (profileError) {
          console.error("Profile creation error:", profileError);
          throw new Error("Failed to create user profile");
        }
      } else if (!existingProfile.organization_id) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ organization_id: organizationId, full_name: inviteFullName })
          .eq("id", newUserId);
        
        if (updateError) {
          console.error("Profile update error:", updateError);
        }
      }
      
      // Add role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: newUserId,
        role: inviteRole,
      });
      
      if (roleError) {
        console.error("Role assignment error:", roleError);
        throw new Error("Failed to assign role. Please try again.");
      }
      
      // Show created credentials
      setCreatedCredentials({ email: inviteEmail, password: invitePassword });
      fetchOrgUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.message?.includes("already registered")) {
        toast.error("This email is already registered.");
      } else {
        toast.error(error.message || "Failed to create user");
      }
    } finally {
      setInviting(false);
    }
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setInviteEmail("");
    setInviteFullName("");
    setInvitePassword("");
    setInviteRole("hr_admin");
    setShowPassword(false);
    setCreatedCredentials(null);
    setCopiedField(null);
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRemoveUser = async (userId: string, role: AppRole | null) => {
    setDeletingUserId(userId);
    
    try {
      // Remove the user's role
      if (role) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);
        
        if (roleError) throw roleError;
      }
      
      // Update their profile to remove organization association
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ organization_id: null })
        .eq("id", userId);
      
      if (profileError) throw profileError;
      
      toast.success("User removed successfully");
      fetchOrgUsers();
    } catch (error: any) {
      console.error("Error removing user:", error);
      toast.error("Failed to remove user");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleOpenEditDialog = (userItem: OrgUser) => {
    setEditingUser(userItem);
    setEditFullName(userItem.full_name || "");
    setEditRole(userItem.role || "hr_admin");
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !editFullName.trim()) return;
    
    setIsUpdating(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: editFullName.trim() })
        .eq("id", editingUser.id);
      
      if (profileError) throw profileError;
      
      // Update role if changed
      if (editingUser.role !== editRole) {
        // Remove old role
        if (editingUser.role) {
          await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", editingUser.id)
            .eq("role", editingUser.role);
        }
        
        // Add new role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: editingUser.id,
          role: editRole,
        });
        
        if (roleError) throw roleError;
      }
      
      toast.success("User updated successfully");
      setEditDialogOpen(false);
      setEditingUser(null);
      setEditFullName("");
      fetchOrgUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRoleBadgeColor = (role: AppRole | null) => {
    if (role === "org_admin") return "bg-highlight/10 text-highlight border-highlight/20";
    return "bg-primary/10 text-primary border-primary/20";
  };

  const hrAdminCount = orgUsers.filter(u => u.role === "hr_admin").length;

  if (authLoading || loading) {
    return (
      <DashboardLayout activeItem="User Management">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeItem="User Management">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display font-bold text-foreground mb-1"
            >
              {t.userManagement.title}
            </motion.h1>
            <p className="text-muted-foreground">
              {t.userManagement.description} {organizationName}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-base px-4 py-2">
              <Users className="w-4 h-4 me-2" />
              {hrAdminCount} / {maxHrAdmins} {t.orgDashboard.hrAdmins}
            </Badge>
            <Dialog open={createDialogOpen} onOpenChange={(open) => !open && handleCloseCreateDialog()}>
              <DialogTrigger asChild>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <UserPlus className="w-4 h-4 me-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Create a new user for your organization with a temporary password.
                  </DialogDescription>
                </DialogHeader>
                
                {createdCredentials ? (
                  <div className="space-y-4 py-4">
                    <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                      <p className="text-success font-medium mb-2">User created successfully!</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Share these credentials with the user. They should change their password after first login.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Label className="w-20 shrink-0">Email:</Label>
                          <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">{createdCredentials.email}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy(createdCredentials.email, "email")}
                          >
                            {copiedField === "email" ? (
                              <Check className="h-4 w-4 text-success" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="w-20 shrink-0">Password:</Label>
                          <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">{createdCredentials.password}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy(createdCredentials.password, "password")}
                          >
                            {copiedField === "password" ? (
                              <Check className="h-4 w-4 text-success" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleCloseCreateDialog} className="w-full">
                      Done
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hr_admin">HR Admin</SelectItem>
                          <SelectItem value="org_admin">Organization Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full-name">{t.userManagement.fullName}</Label>
                      <Input
                        id="full-name"
                        value={inviteFullName}
                        onChange={(e) => setInviteFullName(e.target.value)}
                        placeholder={t.userManagement.enterFullName}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t.userManagement.emailAddress}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder={t.userManagement.enterEmail}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Temporary Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={invitePassword}
                          onChange={(e) => setInvitePassword(e.target.value)}
                          placeholder="Enter a temporary password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Min 6 characters. This will be shown after creation.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={handleCloseCreateDialog}>
                        {t.userManagement.cancel}
                      </Button>
                      <Button 
                        onClick={handleCreateUser} 
                        disabled={inviting || !inviteEmail || !inviteFullName || !invitePassword || invitePassword.length < 6}
                      >
                        {inviting && <Loader2 className="w-4 h-4 animate-spin me-2" />}
                        Create User
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Limit Warning */}
        {hrAdminCount >= maxHrAdmins && (
          <Card className="border-warning bg-warning/10">
            <CardContent className="py-4">
              <p className="text-warning-foreground flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {t.userManagement.limitReached} ({maxHrAdmins}) {t.userManagement.contactSupport}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Organization Users
              </CardTitle>
              <CardDescription>
                Manage users and their roles within your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orgUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t.userManagement.noHRAdmins}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t.userManagement.inviteFirst}
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <UserPlus className="w-4 h-4 me-2" />
                    Create First User
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.userManagement.user}</TableHead>
                      <TableHead>{t.userManagement.role}</TableHead>
                      <TableHead>{t.userManagement.added}</TableHead>
                      <TableHead className="w-28"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgUsers.map((userItem) => (
                      <TableRow key={userItem.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              userItem.role === "org_admin" ? "bg-highlight/10" : "bg-primary/10"
                            }`}>
                              <Shield className={`w-5 h-5 ${
                                userItem.role === "org_admin" ? "text-highlight" : "text-primary"
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium">
                                {userItem.full_name || "Unknown"}
                              </p>
                              {userItem.id === user?.id && (
                                <p className="text-xs text-muted-foreground">You</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getRoleBadgeColor(userItem.role)}>
                            {userItem.role === "org_admin" ? "Org Admin" : "HR Admin"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {formatDate(userItem.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEditDialog(userItem)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {userItem.id !== user?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    disabled={deletingUserId === userItem.id}
                                  >
                                    {deletingUserId === userItem.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove {userItem.full_name || "this user"} from your organization? 
                                      They will lose access to all organization resources.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t.userManagement.cancel}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRemoveUser(userItem.id, userItem.role)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {t.userManagement.remove}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user details and role assignment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-full-name">{t.userManagement.fullName}</Label>
                <Input
                  id="edit-full-name"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder={t.userManagement.enterFullName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hr_admin">HR Admin</SelectItem>
                    <SelectItem value="org_admin">Organization Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                {t.userManagement.cancel}
              </Button>
              <Button 
                onClick={handleUpdateUser} 
                disabled={isUpdating || !editFullName.trim()}
              >
                {isUpdating && <Loader2 className="w-4 h-4 animate-spin me-2" />}
                {t.common.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
