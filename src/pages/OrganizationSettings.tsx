import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Building2, Users, BarChart3, Upload, Trash2, UserPlus, Mail, Loader2 } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  primary_language: string;
  plan: string;
}

interface OrgUser {
  id: string;
  full_name: string | null;
  created_at: string;
  role?: string | null;
}

interface UsageStats {
  assessments: number;
  assessmentGroups: number;
  participants: number;
  planLimits: {
    assessments: number;
    assessmentGroups: number;
    participants: number;
  };
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "العربية (Arabic)" },
  { value: "fr", label: "Français (French)" },
  { value: "es", label: "Español (Spanish)" },
];

const PLAN_LIMITS: Record<string, { assessments: number; assessmentGroups: number; participants: number }> = {
  free: { assessments: 5, assessmentGroups: 3, participants: 50 },
  starter: { assessments: 20, assessmentGroups: 10, participants: 200 },
  professional: { assessments: 100, assessmentGroups: 50, participants: 1000 },
  enterprise: { assessments: -1, assessmentGroups: -1, participants: -1 }, // unlimited
};

export default function OrganizationSettings() {
  const navigate = useNavigate();
  const { user, isOrgAdmin, isSuperAdmin } = useAuth();
  const { t } = useLanguage();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Branding form state
  const [name, setName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0f172a");
  const [primaryLanguage, setPrimaryLanguage] = useState("en");
  
  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!isOrgAdmin() && !isSuperAdmin()) {
      navigate("/dashboard");
      return;
    }
    fetchOrganization();
    fetchOrgUsers();
    fetchUsageStats();
  }, [user]);

  const fetchOrganization = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    
    if (!profile?.organization_id) return;
    
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .single();
    
    if (error) {
      toast.error("Failed to load organization");
      return;
    }
    
    setOrganization(data);
    setName(data.name);
    setPrimaryColor(data.primary_color || "#0f172a");
    setPrimaryLanguage(data.primary_language || "en");
    setLoading(false);
  };

  const fetchOrgUsers = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    
    if (!profile?.organization_id) return;
    
    // Get profiles for this organization
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, created_at")
      .eq("organization_id", profile.organization_id);
    
    if (profilesError) {
      toast.error("Failed to load users");
      return;
    }

    // Get roles for these users
    const userIds = profiles?.map(p => p.id) || [];
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    // Combine profiles with roles
    const usersWithRoles: OrgUser[] = (profiles || []).map(p => ({
      ...p,
      role: roles?.find(r => r.user_id === p.id)?.role || null,
    }));
    
    setOrgUsers(usersWithRoles);
  };

  const fetchUsageStats = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    
    if (!profile?.organization_id) return;
    
    const [assessmentsRes, groupsRes, participantsRes, orgRes] = await Promise.all([
      supabase.from("assessments").select("id", { count: "exact" }).eq("organization_id", profile.organization_id),
      supabase.from("assessment_groups").select("id", { count: "exact" }).eq("organization_id", profile.organization_id),
      supabase.from("participants").select("id", { count: "exact" }).eq("organization_id", profile.organization_id),
      supabase.from("organizations").select("plan").eq("id", profile.organization_id).single(),
    ]);
    
    const plan = orgRes.data?.plan || "free";
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
    
    setUsageStats({
      assessments: assessmentsRes.count || 0,
      assessmentGroups: groupsRes.count || 0,
      participants: participantsRes.count || 0,
      planLimits: limits,
    });
  };

  const handleSaveBranding = async () => {
    if (!organization) return;
    
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        name,
        primary_color: primaryColor,
        primary_language: primaryLanguage,
      })
      .eq("id", organization.id);
    
    setSaving(false);
    
    if (error) {
      toast.error("Failed to save changes");
      return;
    }
    
    toast.success("Organization settings saved");
    fetchOrganization();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }
    
    setUploadingLogo(true);
    
    const fileExt = file.name.split(".").pop();
    const filePath = `${organization.id}/logo.${fileExt}`;
    
    // Delete old logo if exists
    if (organization.logo_url) {
      const oldPath = organization.logo_url.split("/").slice(-2).join("/");
      await supabase.storage.from("organization-logos").remove([oldPath]);
    }
    
    const { error: uploadError } = await supabase.storage
      .from("organization-logos")
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      setUploadingLogo(false);
      toast.error("Failed to upload logo");
      return;
    }
    
    const { data: urlData } = supabase.storage
      .from("organization-logos")
      .getPublicUrl(filePath);
    
    // Add cache-busting timestamp to prevent browser caching old logo
    const logoUrlWithCacheBuster = `${urlData.publicUrl}?t=${Date.now()}`;
    
    const { error: updateError } = await supabase
      .from("organizations")
      .update({ logo_url: logoUrlWithCacheBuster })
      .eq("id", organization.id);
    
    setUploadingLogo(false);
    
    if (updateError) {
      toast.error("Failed to update logo URL");
      return;
    }
    
    toast.success("Logo uploaded successfully");
    fetchOrganization();
  };

  const handleRemoveLogo = async () => {
    if (!organization?.logo_url) return;
    
    const oldPath = organization.logo_url.split("/").slice(-2).join("/");
    await supabase.storage.from("organization-logos").remove([oldPath]);
    
    const { error } = await supabase
      .from("organizations")
      .update({ logo_url: null })
      .eq("id", organization.id);
    
    if (error) {
      toast.error("Failed to remove logo");
      return;
    }
    
    toast.success("Logo removed");
    fetchOrganization();
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteFullName || !organization) return;
    
    setInviting(true);
    
    // Sign up the new user with organization_id in metadata
    const { data, error } = await supabase.auth.signUp({
      email: inviteEmail,
      password: crypto.randomUUID(), // Generate temporary password
      options: {
        data: {
          full_name: inviteFullName,
          organization_id: organization.id,
        },
      },
    });
    
    if (error) {
      setInviting(false);
      toast.error(error.message);
      return;
    }
    
    // Add hr_admin role
    if (data.user) {
      await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: "hr_admin",
      });
    }
    
    setInviting(false);
    setInviteDialogOpen(false);
    setInviteEmail("");
    setInviteFullName("");
    toast.success("User invited! They will receive an email to set their password.");
    fetchOrgUsers();
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 70) return "text-warning";
    return "text-muted-foreground";
  };

  if (loading) {
    return (
      <DashboardLayout activeItem="settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeItem="settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.settings.title}</h1>
          <p className="text-muted-foreground">
            {t.settings.description}
          </p>
        </div>

        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList>
            <TabsTrigger value="branding" className="gap-2">
              <Building2 className="h-4 w-4" />
              {t.settings.branding}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              {t.settings.users}
            </TabsTrigger>
            <TabsTrigger value="usage" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {t.settings.usage}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.settings.organizationProfile}</CardTitle>
                <CardDescription>
                  {t.settings.customizeAppearance}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo */}
                <div className="space-y-3">
                  <Label>{t.settings.logo}</Label>
                  <div className="flex items-center gap-4">
                    {organization?.logo_url ? (
                      <div className="relative">
                        <img
                          src={organization.logo_url}
                          alt="Organization logo"
                          className="h-20 w-20 rounded-lg object-contain border bg-background"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={handleRemoveLogo}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <Button variant="outline" className="relative" disabled={uploadingLogo}>
                        {uploadingLogo ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {t.settings.uploadLogo}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          disabled={uploadingLogo}
                        />
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t.settings.logoHint}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">{t.settings.organizationName}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.settings.organizationName}
                  />
                </div>

                {/* Primary Color */}
                <div className="space-y-2">
                  <Label htmlFor="color">{t.settings.primaryColor}</Label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      id="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-14 rounded border cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-32"
                      placeholder="#0f172a"
                    />
                    <div
                      className="h-10 px-4 rounded flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Preview
                    </div>
                  </div>
                </div>

                {/* Primary Language */}
                <div className="space-y-2">
                  <Label>{t.settings.primaryLanguage}</Label>
                  <Select value={primaryLanguage} onValueChange={setPrimaryLanguage}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder={t.common.select} />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSaveBranding} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {t.settings.saveChanges}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t.settings.teamMembers}</CardTitle>
                  <CardDescription>
                    {t.settings.manageUsers}
                  </CardDescription>
                </div>
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite HR Admin</DialogTitle>
                      <DialogDescription>
                        Invite a new user to manage assessments for your organization
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="invite-name">Full Name</Label>
                        <Input
                          id="invite-name"
                          value={inviteFullName}
                          onChange={(e) => setInviteFullName(e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">Email Address</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="john@company.com"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleInviteUser} disabled={inviting || !inviteEmail || !inviteFullName}>
                        {inviting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invite
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgUsers.map((orgUser) => (
                      <TableRow key={orgUser.id}>
                        <TableCell className="font-medium">
                          {orgUser.full_name || "Unnamed User"}
                          {orgUser.id === user?.id && (
                            <Badge variant="secondary" className="ml-2">You</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {orgUser.role === "org_admin" ? "Org Admin" : "HR Admin"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(orgUser.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Usage</CardTitle>
                <CardDescription>
                  Monitor your organization's resource consumption
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {organization?.plan?.toUpperCase() || "FREE"} Plan
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    Contact Jadarat to upgrade your plan
                  </span>
                </div>

                {usageStats && (
                  <div className="space-y-6">
                    {/* Assessments */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Assessments</span>
                        <span className={getUsageColor(getUsagePercentage(usageStats.assessments, usageStats.planLimits.assessments))}>
                          {usageStats.assessments} / {usageStats.planLimits.assessments === -1 ? "Unlimited" : usageStats.planLimits.assessments}
                        </span>
                      </div>
                      {usageStats.planLimits.assessments !== -1 && (
                        <Progress value={getUsagePercentage(usageStats.assessments, usageStats.planLimits.assessments)} />
                      )}
                    </div>

                    {/* Assessment Groups */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Assessment Groups</span>
                        <span className={getUsageColor(getUsagePercentage(usageStats.assessmentGroups, usageStats.planLimits.assessmentGroups))}>
                          {usageStats.assessmentGroups} / {usageStats.planLimits.assessmentGroups === -1 ? "Unlimited" : usageStats.planLimits.assessmentGroups}
                        </span>
                      </div>
                      {usageStats.planLimits.assessmentGroups !== -1 && (
                        <Progress value={getUsagePercentage(usageStats.assessmentGroups, usageStats.planLimits.assessmentGroups)} />
                      )}
                    </div>

                    {/* Participants */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Total Participants</span>
                        <span className={getUsageColor(getUsagePercentage(usageStats.participants, usageStats.planLimits.participants))}>
                          {usageStats.participants} / {usageStats.planLimits.participants === -1 ? "Unlimited" : usageStats.planLimits.participants}
                        </span>
                      </div>
                      {usageStats.planLimits.participants !== -1 && (
                        <Progress value={getUsagePercentage(usageStats.participants, usageStats.planLimits.participants)} />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
