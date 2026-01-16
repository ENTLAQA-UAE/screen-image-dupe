import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
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
  Eye,
  Brain,
  Heart,
  MessageSquare,
  Languages,
  FileText,
  Loader2,
  Clock,
  CheckCircle2,
  Play,
  AlertTriangle
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

const getAssessmentTypes = (t: any) => [
  { value: 'cognitive', label: t.assessments.cognitiveAssessment, icon: Brain },
  { value: 'personality', label: t.assessments.personalityProfile, icon: Heart },
  { value: 'situational', label: t.assessments.situationalJudgment, icon: MessageSquare },
  { value: 'language', label: t.assessments.languageAssessmentType, icon: Languages },
];

const getStatusConfig = (t: any) => ({
  draft: { label: t.assessments.draft, color: 'bg-muted text-muted-foreground border-border', icon: Clock },
  active: { label: t.assessments.active, color: 'bg-success/10 text-success border-success/20', icon: Play },
  archived: { label: t.assessments.archived, color: 'bg-accent/10 text-accent border-accent/20', icon: CheckCircle2 },
});

const assessmentTypeIcons: Record<string, any> = {
  cognitive: Brain,
  personality: Heart,
  situational: MessageSquare,
  language: Languages,
};

const getAssessmentIcon = (type: string) => {
  return assessmentTypeIcons[type?.toLowerCase()] || FileText;
};

const getIconColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'cognitive': return "bg-white/20 text-white";
    case 'personality': return "bg-white/20 text-white";
    case 'situational': return "bg-white/20 text-white";
    case 'language': return "bg-white/20 text-white";
    default: return "bg-white/20 text-white";
  }
};

const getCardGradient = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'cognitive': return "bg-gradient-to-br from-blue-500 to-blue-600";
    case 'personality': return "bg-gradient-to-br from-rose-500 to-rose-600";
    case 'situational': return "bg-gradient-to-br from-amber-500 to-amber-600";
    case 'language': return "bg-gradient-to-br from-violet-500 to-violet-600";
    default: return "bg-gradient-to-br from-slate-500 to-slate-600";
  }
};

const Assessments = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const { t } = useLanguage();
  const { usage, limits, loading: limitsLoading, canCreate, refresh: refreshLimits } = useSubscriptionLimits();
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

    // Check subscription limit
    if (!canCreate("assessments")) {
      toast.error('You have reached your assessment limit. Please upgrade your plan.');
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
      refreshLimits(); // Refresh usage counts
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

  const handleStatusChange = async (assessmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('assessments')
        .update({ status: newStatus })
        .eq('id', assessmentId);

      if (error) throw error;

      toast.success(`Assessment status changed to ${newStatus}`);
      fetchAssessments();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
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

  const filteredAssessments = useMemo(() => 
    assessments.filter(a =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.type.toLowerCase().includes(searchQuery.toLowerCase())
    ), [assessments, searchQuery]
  );

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedAssessments,
    goToPage,
    totalItems,
    startIndex,
    endIndex,
    resetPage,
  } = usePagination(filteredAssessments);

  // Reset to page 1 when search changes
  useEffect(() => {
    resetPage();
  }, [searchQuery]);

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
        {/* Limit Warning */}
        <LimitWarning 
          resourceType="assessments" 
          currentUsage={usage.assessments} 
          limit={limits.assessments}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display font-bold text-foreground mb-1"
            >
              {t.assessments.title}
              <LimitBadge currentUsage={usage.assessments} limit={limits.assessments} />
            </motion.h1>
            <p className="text-muted-foreground">
              {t.assessments.description}
            </p>
          </div>
          <Button 
            variant="hero" 
            onClick={() => navigate('/assessments/new')}
            disabled={!canCreate("assessments")}
          >
            {!canCreate("assessments") && <AlertTriangle className="w-4 h-4" />}
            <Plus className="w-4 h-4" />
            {t.assessments.createNew}
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.assessments.search}
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
            <p className="text-muted-foreground">{t.assessments.notAssigned}</p>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? t.assessments.noAssessments : t.assessments.noAssessments}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? t.common.noData : t.assessments.createFirst}
            </p>
            {!searchQuery && (
              <Button variant="hero" onClick={() => navigate('/assessments/new')}>
                <Plus className="w-4 h-4 mr-2" />
                {t.assessments.createNew}
              </Button>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {paginatedAssessments.map((assessment, index) => {
              const assessmentTypes = getAssessmentTypes(t);
              const statusConfig = getStatusConfig(t);
              const IconComponent = getAssessmentIcon(assessment.type);
              const iconColor = getIconColor(assessment.type);
              const cardGradient = getCardGradient(assessment.type);
              const status = statusConfig[assessment.status as keyof typeof statusConfig] || statusConfig.draft;
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={assessment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-2xl p-6 hover:shadow-xl transition-all hover:scale-[1.02] ${cardGradient} text-white`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${iconColor} backdrop-blur-sm`}>
                      <IconComponent className="w-7 h-7" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/assessments/${assessment.id}/preview`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          {t.assessments.preview}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(assessment)}>
                          <Edit className="w-4 h-4 mr-2" />
                          {t.assessments.edit}
                        </DropdownMenuItem>
                        {assessment.status === 'draft' && (
                          <DropdownMenuItem onClick={() => navigate(`/assessments/new?edit=${assessment.id}`)}>
                            <FileText className="w-4 h-4 mr-2" />
                            {t.builder.questions}
                          </DropdownMenuItem>
                        )}
                        {/* Status change options */}
                        {assessment.status !== 'active' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(assessment.id, 'active')}>
                            <Play className="w-4 h-4 mr-2" />
                            {t.assessments.active}
                          </DropdownMenuItem>
                        )}
                        {assessment.status !== 'draft' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(assessment.id, 'draft')}>
                            <Clock className="w-4 h-4 mr-2" />
                            {t.assessments.draft}
                          </DropdownMenuItem>
                        )}
                        {assessment.status !== 'archived' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(assessment.id, 'archived')}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {t.assessments.archived}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(assessment)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t.assessments.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-semibold text-white text-lg mb-1 line-clamp-1">
                    {assessment.title}
                  </h3>
                  <p className="text-sm text-white/70 mb-4 line-clamp-2">
                    {assessment.description || t.assessments.noDescription}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                      <StatusIcon className="w-3 h-3 mr-1.5" />
                      {status.label}
                    </span>
                    <span className="text-white/80 font-medium">
                      {assessment.questions_count} {t.assessments.questions.toLowerCase()}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/20 text-xs text-white/60">
                    {t.assessments.created} {formatDate(assessment.created_at)}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && filteredAssessments.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t.assessments.createAssessment}</DialogTitle>
            <DialogDescription>
              {t.assessments.createAssessmentDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t.builder.assessmentTitle} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Cognitive Assessment Q1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t.builder.description}</Label>
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
                <Label>{t.assessments.type}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAssessmentTypes(t).map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.assessments.language}</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t.assessments.english}</SelectItem>
                    <SelectItem value="ar">{t.assessments.arabic}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.assessments.createAssessment}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t.assessments.editAssessment}</DialogTitle>
            <DialogDescription>
              {t.assessments.editAssessmentDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">{t.builder.assessmentTitle} *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t.builder.description}</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.assessments.type}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAssessmentTypes(t).map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.assessments.language}</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t.assessments.english}</SelectItem>
                    <SelectItem value="ar">{t.assessments.arabic}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.assessments.saveChanges}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.assessments.deleteAssessment}</DialogTitle>
            <DialogDescription>
              {t.assessments.deleteConfirm} "{selectedAssessment?.title}"? {t.assessments.deleteWarning}
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
    </DashboardLayout>
  );
};

export default Assessments;