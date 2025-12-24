import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Users, UserPlus, Trash2, Mail, Loader2, Shield, Calendar } from "lucide-react";

interface HRAdmin {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string | null;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const { user, isOrgAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>("");
  const [maxHrAdmins, setMaxHrAdmins] = useState<number>(5);
  const [hrAdmins, setHrAdmins] = useState<HRAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviting, setInviting] = useState(false);
  
  // Delete state
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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
      fetchHRAdmins();
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

  const fetchHRAdmins = async () => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      // Get all users with hr_admin role for this organization
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .eq("organization_id", organizationId);
      
      if (profilesError) throw profilesError;
      
      if (!profiles || profiles.length === 0) {
        setHrAdmins([]);
        setLoading(false);
        return;
      }
      
      // Get roles for these users
      const userIds = profiles.map(p => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("user_id", userIds)
        .eq("role", "hr_admin");
      
      if (rolesError) throw rolesError;
      
      // Filter to only HR admins
      const hrAdminIds = new Set(roles?.map(r => r.user_id) || []);
      const hrAdminProfiles = profiles.filter(p => hrAdminIds.has(p.id));
      
      // Get emails from auth (we'll just show the full_name for now since we can't access auth.users)
      const admins: HRAdmin[] = hrAdminProfiles.map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: null, // Email not accessible from profiles
        created_at: p.created_at,
      }));
      
      setHrAdmins(admins);
    } catch (error) {
      console.error("Error fetching HR admins:", error);
      toast.error("Failed to load HR admins");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteFullName || !organizationId) return;
    
    // Check limit
    if (hrAdmins.length >= maxHrAdmins) {
      toast.error(`You have reached the maximum of ${maxHrAdmins} HR admins for your plan.`);
      return;
    }
    
    setInviting(true);
    
    try {
      // Sign up the new user with organization_id in metadata
      const tempPassword = crypto.randomUUID();
      const { data, error } = await supabase.auth.signUp({
        email: inviteEmail,
        password: tempPassword,
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
      
      // Add hr_admin role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: "hr_admin",
      });
      
      if (roleError) throw roleError;
      
      // Create profile for the user
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: inviteFullName,
        organization_id: organizationId,
      });
      
      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Profile might already be created by trigger, continue
      }
      
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteFullName("");
      toast.success("HR Admin invited! They will receive an email to set their password.");
      fetchHRAdmins();
    } catch (error: any) {
      console.error("Error inviting user:", error);
      if (error.message?.includes("already registered")) {
        toast.error("This email is already registered.");
      } else {
        toast.error(error.message || "Failed to invite user");
      }
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    setDeletingUserId(userId);
    
    try {
      // Remove the user's role
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "hr_admin");
      
      if (roleError) throw roleError;
      
      // Update their profile to remove organization association
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ organization_id: null })
        .eq("id", userId);
      
      if (profileError) throw profileError;
      
      toast.success("HR Admin removed successfully");
      fetchHRAdmins();
    } catch (error: any) {
      console.error("Error removing user:", error);
      toast.error("Failed to remove user");
    } finally {
      setDeletingUserId(null);
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
              User Management
            </motion.h1>
            <p className="text-muted-foreground">
              Invite and manage HR Admin users for {organizationName}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-base px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              {hrAdmins.length} / {maxHrAdmins} HR Admins
            </Badge>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={hrAdmins.length >= maxHrAdmins}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite HR Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite HR Admin</DialogTitle>
                  <DialogDescription>
                    Send an invitation to add a new HR Admin to your organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input
                      id="full-name"
                      value={inviteFullName}
                      onChange={(e) => setInviteFullName(e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleInviteUser} 
                    disabled={inviting || !inviteEmail || !inviteFullName}
                  >
                    {inviting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Limit Warning */}
        {hrAdmins.length >= maxHrAdmins && (
          <Card className="border-warning bg-warning/10">
            <CardContent className="py-4">
              <p className="text-warning-foreground flex items-center gap-2">
                <Shield className="w-5 h-5" />
                You have reached the maximum number of HR Admins ({maxHrAdmins}) for your plan.
                Contact support to upgrade.
              </p>
            </CardContent>
          </Card>
        )}

        {/* HR Admins Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                HR Admin Users
              </CardTitle>
              <CardDescription>
                Users with HR Admin access can manage assessments, groups, and view participant results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hrAdmins.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No HR Admins yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Invite your first HR Admin to help manage assessments.
                  </p>
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite HR Admin
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hrAdmins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Shield className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {admin.full_name || "Unknown"}
                              </p>
                              {admin.email && (
                                <p className="text-sm text-muted-foreground">
                                  {admin.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">HR Admin</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {formatDate(admin.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={deletingUserId === admin.id}
                              >
                                {deletingUserId === admin.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove HR Admin</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {admin.full_name || "this user"} as an HR Admin?
                                  They will lose access to manage assessments and view results.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveUser(admin.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
