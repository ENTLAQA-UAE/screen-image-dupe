import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Eye,
  Brain,
  Heart,
  MessageSquare,
  Languages,
  FileText,
  Loader2,
  Clock,
  CheckCircle2,
  Play
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Assessment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string | null;
  language: string | null;
  is_graded: boolean | null;
  created_at: string | null;
  questions_count?: number;
}

const assessmentTypes = [
  { value: 'cognitive', label: 'Cognitive Assessment', icon: Brain },
  { value: 'personality', label: 'Personality Profile', icon: Heart },
  { value: 'situational', label: 'Situational Judgment', icon: MessageSquare },
  { value: 'language', label: 'Language Assessment', icon: Languages },
];

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground border-border', icon: Clock },
  active: { label: 'Active', color: 'bg-success/10 text-success border-success/20', icon: Play },
  archived: { label: 'Archived', color: 'bg-accent/10 text-accent border-accent/20', icon: CheckCircle2 },
};

const getAssessmentIcon = (type: string) => {
  const found = assessmentTypes.find(t => t.value === type);
  return found?.icon || FileText;
};

const getIconColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'cognitive': return "bg-blue-500/10 text-blue-500";
    case 'personality': return "bg-rose-500/10 text-rose-500";
    case 'situational': return "bg-amber-500/10 text-amber-500";
    case 'language': return "bg-violet-500/10 text-violet-500";
    default: return "bg-accent/10 text-accent";
  }
};

const Assessments = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'cognitive',
    language: 'en',
    is_graded: false,
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

  // Fetch assessments
  const fetchAssessments = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get question counts
      const assessmentsWithCounts = await Promise.all(
        (data || []).map(async (assessment) => {
          const { count } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('assessment_id', assessment.id);

          return { ...assessment, questions_count: count || 0 };
        })
      );

      setAssessments(assessmentsWithCounts);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [organizationId]);

  const handleCreate = async () => {
    if (!organizationId || !formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('assessments')
        .insert({
          organization_id: organizationId,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          type: formData.type,
          language: formData.language,
          is_graded: formData.is_graded,
          status: 'draft',
          created_by: user?.id,
        });

      if (error) throw error;

      toast.success('Assessment created successfully');
      setIsCreateOpen(false);
      resetForm();
      fetchAssessments();
    } catch (error: any) {
      console.error('Error creating assessment:', error);
      toast.error(error.message || 'Failed to create assessment');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAssessment || !formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('assessments')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          type: formData.type,
          language: formData.language,
          is_graded: formData.is_graded,
        })
        .eq('id', selectedAssessment.id);

      if (error) throw error;

      toast.success('Assessment updated successfully');
      setIsEditOpen(false);
      setSelectedAssessment(null);
      resetForm();
      fetchAssessments();
    } catch (error: any) {
      console.error('Error updating assessment:', error);
      toast.error(error.message || 'Failed to update assessment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAssessment) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', selectedAssessment.id);

      if (error) throw error;

      toast.success('Assessment deleted successfully');
      setIsDeleteOpen(false);
      setSelectedAssessment(null);
      fetchAssessments();
    } catch (error: any) {
      console.error('Error deleting assessment:', error);
      toast.error(error.message || 'Failed to delete assessment');
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setFormData({
      title: assessment.title,
      description: assessment.description || '',
      type: assessment.type,
      language: assessment.language || 'en',
      is_graded: assessment.is_graded || false,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'cognitive',
      language: 'en',
      is_graded: false,
    });
  };

  const filteredAssessments = assessments.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <DashboardLayout activeItem="Assessments">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display font-bold text-foreground mb-1"
            >
              Assessments
            </motion.h1>
            <p className="text-muted-foreground">
              Create and manage your assessment templates.
            </p>
          </div>
          <Button variant="hero" onClick={() => navigate('/assessments/new')}>
            <Plus className="w-4 h-4" />
            Create Assessment
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
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
        ) : filteredAssessments.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? 'No assessments found' : 'No assessments yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search term.' : 'Create your first assessment to get started.'}
            </p>
            {!searchQuery && (
              <Button variant="hero" onClick={() => navigate('/assessments/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Assessment
              </Button>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredAssessments.map((assessment, index) => {
              const IconComponent = getAssessmentIcon(assessment.type);
              const iconColor = getIconColor(assessment.type);
              const status = statusConfig[assessment.status as keyof typeof statusConfig] || statusConfig.draft;
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={assessment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColor}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/assessments/${assessment.id}/preview`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(assessment)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/assessments/new?edit=${assessment.id}`)}>
                          <FileText className="w-4 h-4 mr-2" />
                          Edit Questions
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(assessment)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                    {assessment.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {assessment.description || 'No description'}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </span>
                    <span className="text-muted-foreground">
                      {assessment.questions_count} questions
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                    Created {formatDate(assessment.created_at)}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Assessment</DialogTitle>
            <DialogDescription>
              Create a new assessment template for your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Cognitive Assessment Q1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this assessment..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assessmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Assessment</DialogTitle>
            <DialogDescription>
              Update assessment details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assessmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assessment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedAssessment?.title}"? This action cannot be undone.
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
    </DashboardLayout>
  );
};

export default Assessments;