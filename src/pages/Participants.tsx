import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { LimitWarning, LimitBadge } from "@/components/LimitWarning";
import { 
  Plus, 
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Loader2,
  Clock,
  CheckCircle2,
  Play,
  Mail,
  Link as LinkIcon,
  User,
  Upload,
  Download,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  XCircle,
  Timer,
} from "lucide-react";
import { CsvImportDialog } from "@/components/participants/CsvImportDialog";
import { useCsvExport } from "@/hooks/useCsvExport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AssessmentGroup {
  id: string;
  name: string;
  assessment?: {
    title: string;
  } | null;
}

interface Participant {
  id: string;
  full_name: string | null;
  email: string | null;
  employee_code: string | null;
  status: string | null;
  group_id: string | null;
  access_token: string | null;
  started_at: string | null;
  completed_at: string | null;
  score_summary: any;
  submission_type: string | null;
  group?: AssessmentGroup | null;
}

const statusColors: Record<string, string> = {
  invited: "bg-muted text-muted-foreground border-border",
  started: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  completed: "bg-success/10 text-success border-success/20",
};

const statusIcons: Record<string, React.ElementType> = {
  invited: Clock,
  started: Play,
  completed: CheckCircle2,
};

const Participants = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const { t } = useLanguage();
  const { usage, limits, canCreate, refresh: refreshLimits } = useSubscriptionLimits();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [groups, setGroups] = useState<AssessmentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  const { exportToCsv } = useCsvExport();
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    employee_code: '',
    group_id: '',
  });

  // Redirect Super Admins
  useEffect(() => {
    if (!authLoading && isSuperAdmin()) {
      navigate('/super-admin', { replace: true });
    }
  }, [authLoading, isSuperAdmin, navigate]);

  // Fetch organization
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle();
      
      setOrganizationId(profile?.organization_id || null);
    };

    fetchOrganization();
  }, [user]);

  // Fetch groups for dropdown
  useEffect(() => {
    const fetchGroups = async () => {
      if (!organizationId) return;

      const { data, error } = await supabase
        .from('assessment_groups')
        .select(`
          id, 
          name,
          assessment:assessments(title)
        `)
        .eq('organization_id', organizationId)
        .order('name');

      if (!error && data) {
        setGroups(data as AssessmentGroup[]);
      }
    };

    fetchGroups();
  }, [organizationId]);

  // Fetch participants
  const fetchParticipants = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('participants')
        .select(`
          *,
          group:assessment_groups(
            id,
            name,
            assessment:assessments(title)
          )
        `)
        .eq('organization_id', organizationId)
        .order('id', { ascending: false });

      if (error) throw error;

      setParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [organizationId]);

  const handleCreate = async () => {
    if (!organizationId) {
      toast.error('Organization not found');
      return;
    }

    if (!formData.full_name.trim() && !formData.email.trim()) {
      toast.error('Please enter a name or email');
      return;
    }

    // Check subscription limit
    if (!canCreate("participants")) {
      toast.error('You have reached your participant limit. Please upgrade your plan.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('participants')
        .insert({
          organization_id: organizationId,
          full_name: formData.full_name.trim() || null,
          email: formData.email.trim() || null,
          employee_code: formData.employee_code.trim() || null,
          group_id: formData.group_id || null,
          status: 'invited',
        });

      if (error) throw error;

      toast.success('Participant added successfully');
      setIsCreateOpen(false);
      resetForm();
      fetchParticipants();
      refreshLimits(); // Refresh usage counts
    } catch (error: any) {
      console.error('Error creating participant:', error);
      toast.error(error.message || 'Failed to add participant');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedParticipant) return;

    if (!formData.full_name.trim() && !formData.email.trim()) {
      toast.error('Please enter a name or email');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('participants')
        .update({
          full_name: formData.full_name.trim() || null,
          email: formData.email.trim() || null,
          employee_code: formData.employee_code.trim() || null,
          group_id: formData.group_id || null,
        })
        .eq('id', selectedParticipant.id);

      if (error) throw error;

      toast.success('Participant updated successfully');
      setIsEditOpen(false);
      setSelectedParticipant(null);
      resetForm();
      fetchParticipants();
    } catch (error: any) {
      console.error('Error updating participant:', error);
      toast.error(error.message || 'Failed to update participant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedParticipant) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', selectedParticipant.id);

      if (error) throw error;

      toast.success('Participant deleted successfully');
      setIsDeleteOpen(false);
      setSelectedParticipant(null);
      fetchParticipants();
    } catch (error: any) {
      console.error('Error deleting participant:', error);
      toast.error(error.message || 'Failed to delete participant');
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (participant: Participant) => {
    setSelectedParticipant(participant);
    setFormData({
      full_name: participant.full_name || '',
      email: participant.email || '',
      employee_code: participant.employee_code || '',
      group_id: participant.group_id || '',
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsDeleteOpen(true);
  };

  const openResetDialog = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsResetOpen(true);
  };

  const handleResetParticipant = async () => {
    if (!selectedParticipant) return;

    setResetting(true);
    try {
      // Delete all responses for this participant
      const { error: deleteResponsesError } = await supabase
        .from('responses')
        .delete()
        .eq('participant_id', selectedParticipant.id);

      if (deleteResponsesError) throw deleteResponsesError;

      // Reset participant status and clear results
      const { error: updateError } = await supabase
        .from('participants')
        .update({
          status: 'invited',
          started_at: null,
          completed_at: null,
          score_summary: null,
          ai_report_text: null,
          submission_type: null,
        })
        .eq('id', selectedParticipant.id);

      if (updateError) throw updateError;

      toast.success(t.participants.resetSuccess);
      setIsResetOpen(false);
      setSelectedParticipant(null);
      fetchParticipants();
    } catch (error: any) {
      console.error('Error resetting participant:', error);
      toast.error(t.participants.resetError);
    } finally {
      setResetting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      employee_code: '',
      group_id: '',
    });
  };

  const copyAccessLink = (participant: Participant) => {
    if (participant.access_token) {
      const link = `${window.location.origin}/assess/${participant.access_token}`;
      navigator.clipboard.writeText(link);
      toast.success('Access link copied to clipboard');
    }
  };

  const resendInvitationLink = async (participant: Participant) => {
    if (!participant.email) {
      toast.error('Participant has no email address');
      return;
    }

    // Generate a new access token
    const newToken = crypto.randomUUID();
    
    try {
      const { error } = await supabase
        .from('participants')
        .update({ 
          access_token: newToken,
          status: participant.status === 'completed' ? 'invited' : participant.status // Reset if completed
        })
        .eq('id', participant.id);

      if (error) throw error;

      const link = `${window.location.origin}/assess/${newToken}`;
      await navigator.clipboard.writeText(link);
      
      toast.success('New invitation link generated and copied to clipboard');
      fetchParticipants();
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast.error(error.message || 'Failed to resend invitation');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'MMM d, yyyy HH:mm');
  };

  const filteredParticipants = participants.filter(p => {
    const matchesSearch = 
      (p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (p.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (p.employee_code?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (p.group?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const matchesGroup = filterGroup === 'all' || p.group_id === filterGroup;
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    
    return matchesSearch && matchesGroup && matchesStatus;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <DashboardLayout activeItem="Participants">
      <div className="p-8">
        {/* Limit Warning */}
        <LimitWarning 
          resourceType="participants" 
          currentUsage={usage.participants} 
          limit={limits.participants}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display font-bold text-foreground mb-1"
            >
              {t.participants.title}{" "}
              <LimitBadge currentUsage={usage.participants} limit={limits.participants} />
            </motion.h1>
            <p className="text-muted-foreground">
              {t.participants.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsImportOpen(true)}
              disabled={!canCreate("participants")}
            >
              <Upload className="w-4 h-4 mr-2" />
              {t.participants.import}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => exportToCsv({
                filename: 'participants',
                headers: [t.participants.employeeCode, t.participants.name, t.participants.email, t.participants.department, t.participants.jobTitle, t.participants.group, t.participants.status, 'Started At', t.participants.completedAt],
                data: filteredParticipants,
                columnMap: {
                  [t.participants.employeeCode]: 'employee_code',
                  [t.participants.name]: 'full_name',
                  [t.participants.email]: 'email',
                  [t.participants.department]: 'department',
                  [t.participants.jobTitle]: 'job_title',
                  [t.participants.group]: 'group.name',
                  [t.participants.status]: 'status',
                  'Started At': 'started_at',
                  [t.participants.completedAt]: 'completed_at',
                }
              })}
              disabled={filteredParticipants.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              {t.participants.export}
            </Button>
            <Button 
              variant="hero" 
              onClick={() => setIsCreateOpen(true)}
              disabled={!canCreate("participants")}
            >
              {!canCreate("participants") && <AlertTriangle className="w-4 h-4" />}
              <Plus className="w-4 h-4" />
              {t.participants.add}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.participants.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t.participants.allGroups} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.participants.allGroups}</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t.participants.allStatuses} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.participants.allStatuses}</SelectItem>
              <SelectItem value="invited">{t.participants.invited}</SelectItem>
              <SelectItem value="started">{t.participants.started}</SelectItem>
              <SelectItem value="completed">{t.participants.completed}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : !organizationId ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">{t.participants.notAssigned}</p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery || filterGroup !== 'all' || filterStatus !== 'all' 
                ? t.participants.noParticipants 
                : t.participants.noParticipantsYet}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterGroup !== 'all' || filterStatus !== 'all'
                ? t.participants.tryAdjustFilters
                : t.participants.addFirstParticipant}
            </p>
            {!searchQuery && filterGroup === 'all' && filterStatus === 'all' && (
              <Button variant="hero" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t.participants.add}
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/30 border-0 shadow-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-white/5">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{t.participants.participant}</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{t.participants.group}</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{t.participants.status}</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{t.participants.startedAt}</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{t.participants.completedAt}</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-foreground">{t.participants.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map((participant, index) => {
                  const status = participant.status || 'invited';
                  const StatusIcon = statusIcons[status] || Clock;

                  return (
                    <motion.tr
                      key={participant.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-white/60 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {participant.full_name || t.participants.unnamed}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              {participant.email && (
                                <>
                                  <Mail className="w-3 h-3" />
                                  {participant.email}
                                </>
                              )}
                              {participant.employee_code && !participant.email && (
                                <>ID: {participant.employee_code}</>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {participant.group?.name ? (
                          <span className="px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/30 text-sm text-violet-700 dark:text-violet-300">
                            {participant.group.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{t.participants.noGroup}</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${
                            status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            status === 'started' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            <StatusIcon className="w-3 h-3 mr-1.5" />
                            {t.participants[status as keyof typeof t.participants] || status}
                          </span>
                          {status === 'completed' && participant.submission_type && participant.submission_type !== 'normal' && (
                            <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-medium ${
                              participant.submission_type === 'auto_submitted' 
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {participant.submission_type === 'auto_submitted' ? (
                                <>
                                  <XCircle className="w-2.5 h-2.5 mr-1" />
                                  {t.participants.submissionAutoSubmitted}
                                </>
                              ) : (
                                <>
                                  <Timer className="w-2.5 h-2.5 mr-1" />
                                  {t.participants.submissionTimeExpired}
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {formatDate(participant.started_at)}
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {formatDate(participant.completed_at)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => copyAccessLink(participant)}>
                              <LinkIcon className="w-4 h-4 mr-2" />
                              {t.participants.copyAccessLink}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => resendInvitationLink(participant)}
                              disabled={!participant.email}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              {t.participants.resendInvitationLink}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(participant)}>
                              <Edit className="w-4 h-4 mr-2" />
                              {t.common.edit}
                            </DropdownMenuItem>
                            {(status === 'completed' || status === 'started') && (
                              <DropdownMenuItem 
                                onClick={() => openResetDialog(participant)}
                                className="text-amber-600 focus:text-amber-600"
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                {t.participants.resetParticipant}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(participant)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t.common.delete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {!loading && organizationId && participants.length > 0 && (
          <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
            <span>{t.participants.total}: {participants.length}</span>
            <span>{t.participants.invited}: {participants.filter(p => p.status === 'invited').length}</span>
            <span>{t.participants.started}: {participants.filter(p => p.status === 'started').length}</span>
            <span>{t.participants.completed}: {participants.filter(p => p.status === 'completed').length}</span>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.participants.addParticipant}</DialogTitle>
            <DialogDescription>
              {t.participants.addParticipantDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">{t.participants.fullName}</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.participants.email}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee_code">{t.participants.employeeCodeOptional}</Label>
              <Input
                id="employee_code"
                value={formData.employee_code}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                placeholder="EMP001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group">{t.participants.assessmentGroupOptional}</Label>
              <Select
                value={formData.group_id}
                onValueChange={(value) => setFormData({ ...formData, group_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.participants.selectGroup} />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.participants.addParticipant}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.participants.editParticipant}</DialogTitle>
            <DialogDescription>
              {t.participants.editParticipantDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">{t.participants.fullName}</Label>
              <Input
                id="edit_full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">{t.participants.email}</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_employee_code">{t.participants.employeeCodeOptional}</Label>
              <Input
                id="edit_employee_code"
                value={formData.employee_code}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                placeholder="EMP001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_group">{t.participants.assessmentGroupOptional}</Label>
              <Select
                value={formData.group_id}
                onValueChange={(value) => setFormData({ ...formData, group_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.participants.selectGroup} />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.participants.deleteParticipant}</DialogTitle>
            <DialogDescription>
              {t.participants.deleteParticipantConfirm} "{selectedParticipant?.full_name || selectedParticipant?.email || t.participants.participant}"? {t.participants.deleteParticipantWarning}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-500" />
              {t.participants.resetParticipant}
            </DialogTitle>
            <DialogDescription>
              {t.participants.resetParticipantConfirm}
              <br />
              <span className="text-amber-600 font-medium mt-2 block">
                {t.participants.resetParticipantWarning}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>{t.participants.name}:</strong> {selectedParticipant?.full_name || '-'}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>{t.participants.email}:</strong> {selectedParticipant?.email || '-'}
            </p>
            {selectedParticipant?.employee_code && (
              <p className="text-sm text-muted-foreground">
                <strong>{t.participants.employeeCode}:</strong> {selectedParticipant.employee_code}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button 
              onClick={handleResetParticipant} 
              disabled={resetting}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {resetting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.participants.resetParticipant}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      {organizationId && (
        <CsvImportDialog
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          organizationId={organizationId}
          groupId={filterGroup !== 'all' ? filterGroup : undefined}
          onSuccess={fetchParticipants}
        />
      )}
    </DashboardLayout>
  );
};

export default Participants;
