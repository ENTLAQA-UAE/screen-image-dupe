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
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
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
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [saving, setSaving] = useState(false);
  
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display font-bold text-foreground mb-1"
            >
              Participants
            </motion.h1>
            <p className="text-muted-foreground">
              View and manage assessment participants across all groups.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={() => exportToCsv({
                filename: 'participants',
                headers: ['Employee Code', 'Full Name', 'Email', 'Department', 'Job Title', 'Group', 'Status', 'Started At', 'Completed At'],
                data: filteredParticipants,
                columnMap: {
                  'Employee Code': 'employee_code',
                  'Full Name': 'full_name',
                  'Email': 'email',
                  'Department': 'department',
                  'Job Title': 'job_title',
                  'Group': 'group.name',
                  'Status': 'status',
                  'Started At': 'started_at',
                  'Completed At': 'completed_at',
                }
              })}
              disabled={filteredParticipants.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="hero" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Participant
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search participants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="started">Started</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
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
            <p className="text-muted-foreground">You are not assigned to any organization.</p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery || filterGroup !== 'all' || filterStatus !== 'all' 
                ? 'No participants found' 
                : 'No participants yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterGroup !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters.'
                : 'Add your first participant to get started.'}
            </p>
            {!searchQuery && filterGroup === 'all' && filterStatus === 'all' && (
              <Button variant="hero" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Participant
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Participant</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Group</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Started</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Completed</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-foreground">Actions</th>
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
                      className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {participant.full_name || 'Unnamed'}
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
                      <td className="py-4 px-6 text-muted-foreground">
                        {participant.group?.name || 'No group'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
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
                              Copy Access Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(participant)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(participant)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
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
            <span>Total: {participants.length}</span>
            <span>Invited: {participants.filter(p => p.status === 'invited').length}</span>
            <span>Started: {participants.filter(p => p.status === 'started').length}</span>
            <span>Completed: {participants.filter(p => p.status === 'completed').length}</span>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Participant</DialogTitle>
            <DialogDescription>
              Add a new participant to your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee_code">Employee Code (Optional)</Label>
              <Input
                id="employee_code"
                value={formData.employee_code}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                placeholder="EMP001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group">Assessment Group (Optional)</Label>
              <Select
                value={formData.group_id}
                onValueChange={(value) => setFormData({ ...formData, group_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
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
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Participant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Participant</DialogTitle>
            <DialogDescription>
              Update participant details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Full Name</Label>
              <Input
                id="edit_full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_employee_code">Employee Code (Optional)</Label>
              <Input
                id="edit_employee_code"
                value={formData.employee_code}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                placeholder="EMP001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_group">Assessment Group (Optional)</Label>
              <Select
                value={formData.group_id}
                onValueChange={(value) => setFormData({ ...formData, group_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
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
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Participant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedParticipant?.full_name || selectedParticipant?.email || 'this participant'}"? This action cannot be undone and will also delete all their responses.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
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
