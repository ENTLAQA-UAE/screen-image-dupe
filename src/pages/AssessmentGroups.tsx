import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { LimitWarning, LimitBadge } from "@/components/LimitWarning";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Brain,
  Heart,
  MessageSquare,
  Languages,
  FileText,
  Loader2,
  Clock,
  CheckCircle2,
  Play,
  CalendarIcon,
  UserPlus,
  Link as LinkIcon,
  BarChart3,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Assessment {
  id: string;
  title: string;
  type: string;
}

interface AssessmentGroup {
  id: string;
  name: string;
  assessment_id: string | null;
  is_active: boolean | null;
  start_date: string | null;
  end_date: string | null;
  group_link_token: string | null;
  created_at: string | null;
  assessment?: Assessment | null;
  participants_count?: number;
  completed_count?: number;
}

const statusColors = {
  active: "bg-success/10 text-success border-success/20",
  draft: "bg-muted text-muted-foreground border-border",
  completed: "bg-accent/10 text-accent border-accent/20",
};

const getAssessmentIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'cognitive': return Brain;
    case 'personality': return Heart;
    case 'situational': return MessageSquare;
    case 'language': return Languages;
    default: return FileText;
  }
};

const getIconColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'cognitive': return "bg-gradient-to-br from-blue-500 to-cyan-500";
    case 'personality': return "bg-gradient-to-br from-rose-500 to-pink-500";
    case 'situational': return "bg-gradient-to-br from-amber-500 to-orange-500";
    case 'language': return "bg-gradient-to-br from-violet-500 to-purple-500";
    default: return "bg-gradient-to-br from-slate-500 to-slate-600";
  }
};

const AssessmentGroups = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const { t, language } = useLanguage();
  const { usage, limits, canCreate, refresh: refreshLimits } = useSubscriptionLimits();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [groups, setGroups] = useState<AssessmentGroup[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<AssessmentGroup | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    assessment_id: '',
    is_active: false,
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
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

  // Fetch assessments for dropdown
  useEffect(() => {
    const fetchAssessments = async () => {
      if (!organizationId) return;

      const { data, error } = await supabase
        .from('assessments')
        .select('id, title, type')
        .eq('organization_id', organizationId)
        .order('title');

      if (!error && data) {
        setAssessments(data);
      }
    };

    fetchAssessments();
  }, [organizationId]);

  // Fetch groups
  const fetchGroups = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('assessment_groups')
        .select(`
          *,
          assessment:assessments(id, title, type)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get participant counts
      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group) => {
          const { count: participantsCount } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          const { count: completedCount } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .eq('status', 'completed');

          return {
            ...group,
            participants_count: participantsCount || 0,
            completed_count: completedCount || 0,
          };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error(language === 'ar' ? 'فشل في تحميل مجموعات التقييم' : 'Failed to load assessment groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [organizationId]);

  const handleCreate = async () => {
    if (!organizationId || !formData.name.trim()) {
      toast.error(language === 'ar' ? 'الرجاء إدخال اسم المجموعة' : 'Please enter a group name');
      return;
    }

    // Check subscription limit
    if (!canCreate("groups")) {
      toast.error(language === 'ar' ? 'لقد وصلت إلى الحد الأقصى لمجموعات التقييم. يرجى ترقية خطتك.' : 'You have reached your assessment group limit. Please upgrade your plan.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('assessment_groups')
        .insert({
          organization_id: organizationId,
          name: formData.name.trim(),
          assessment_id: formData.assessment_id || null,
          is_active: formData.is_active,
          start_date: formData.start_date?.toISOString() || null,
          end_date: formData.end_date?.toISOString() || null,
        });

      if (error) throw error;

      toast.success(language === 'ar' ? 'تم إنشاء مجموعة التقييم بنجاح' : 'Assessment group created successfully');
      setIsCreateOpen(false);
      resetForm();
      fetchGroups();
      refreshLimits();
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error(error.message || (language === 'ar' ? 'فشل في إنشاء مجموعة التقييم' : 'Failed to create assessment group'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedGroup || !formData.name.trim()) {
      toast.error(language === 'ar' ? 'الرجاء إدخال اسم المجموعة' : 'Please enter a group name');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('assessment_groups')
        .update({
          name: formData.name.trim(),
          assessment_id: formData.assessment_id || null,
          is_active: formData.is_active,
          start_date: formData.start_date?.toISOString() || null,
          end_date: formData.end_date?.toISOString() || null,
        })
        .eq('id', selectedGroup.id);

      if (error) throw error;

      toast.success(language === 'ar' ? 'تم تحديث مجموعة التقييم بنجاح' : 'Assessment group updated successfully');
      setIsEditOpen(false);
      setSelectedGroup(null);
      resetForm();
      fetchGroups();
    } catch (error: any) {
      console.error('Error updating group:', error);
      toast.error(error.message || (language === 'ar' ? 'فشل في تحديث مجموعة التقييم' : 'Failed to update assessment group'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedGroup) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('assessment_groups')
        .delete()
        .eq('id', selectedGroup.id);

      if (error) throw error;

      toast.success(language === 'ar' ? 'تم حذف مجموعة التقييم بنجاح' : 'Assessment group deleted successfully');
      setIsDeleteOpen(false);
      setSelectedGroup(null);
      fetchGroups();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast.error(error.message || (language === 'ar' ? 'فشل في حذف مجموعة التقييم' : 'Failed to delete assessment group'));
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (group: AssessmentGroup) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      assessment_id: group.assessment_id || '',
      is_active: group.is_active || false,
      start_date: group.start_date ? new Date(group.start_date) : undefined,
      end_date: group.end_date ? new Date(group.end_date) : undefined,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (group: AssessmentGroup) => {
    setSelectedGroup(group);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      assessment_id: '',
      is_active: false,
      start_date: undefined,
      end_date: undefined,
    });
  };

  const copyInviteLink = (group: AssessmentGroup) => {
    if (group.group_link_token) {
      const link = `${window.location.origin}/assess/${group.group_link_token}?group=true`;
      navigator.clipboard.writeText(link);
      toast.success(t.groups.linkCopied);
    }
  };

  const getGroupStatus = (group: AssessmentGroup): 'active' | 'draft' | 'completed' => {
    if (!group.is_active) return 'draft';
    if (group.end_date && new Date(group.end_date) < new Date()) return 'completed';
    return 'active';
  };

  const getStatusLabel = (status: 'active' | 'draft' | 'completed') => {
    switch (status) {
      case 'active': return language === 'ar' ? 'نشط' : 'Active';
      case 'draft': return language === 'ar' ? 'مسودة' : 'Draft';
      case 'completed': return language === 'ar' ? 'مكتمل' : 'Completed';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const filteredGroups = useMemo(() =>
    groups.filter(g =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.assessment?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [groups, searchQuery]
  );

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedGroups,
    goToPage,
    totalItems,
    startIndex,
    endIndex,
    resetPage,
  } = usePagination(filteredGroups);

  // Reset to page 1 when search changes
  useEffect(() => {
    resetPage();
  }, [searchQuery]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <DashboardLayout activeItem="Assessment Groups">
      <div className="p-8">
        {/* Limit Warning */}
        <LimitWarning 
          resourceType="groups" 
          currentUsage={usage.groups} 
          limit={limits.groups}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display font-bold text-foreground mb-1"
            >
              {t.groups.title}{" "}
              <LimitBadge currentUsage={usage.groups} limit={limits.groups} />
            </motion.h1>
            <p className="text-muted-foreground">
              {t.groups.description}
            </p>
          </div>
          <Button 
            variant="hero" 
            onClick={() => setIsCreateOpen(true)}
            disabled={!canCreate("groups")}
          >
            {!canCreate("groups") && <AlertTriangle className="w-4 h-4" />}
            <Plus className="w-4 h-4" />
            {t.groups.createGroup}
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={language === 'ar' ? 'البحث في المجموعات...' : 'Search groups...'}
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
        ) : filteredGroups.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? (language === 'ar' ? 'لم يتم العثور على مجموعات' : 'No groups found') : t.groups.noGroups}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? (language === 'ar' ? 'جرب مصطلح بحث مختلف.' : 'Try a different search term.') 
                : t.groups.createFirstGroup}
            </p>
            {!searchQuery && (
              <Button variant="hero" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t.groups.createGroup}
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/30 border-0 shadow-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-white/5">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{t.groups.groupName}</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{t.assessments.title}</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{t.assessments.status}</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{t.groups.participantCount}</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">{language === 'ar' ? 'التواريخ' : 'Dates'}</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-foreground">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGroups.map((group, index) => {
                  const status = getGroupStatus(group);
                  const IconComponent = getAssessmentIcon(group.assessment?.type || '');
                  const iconColor = getIconColor(group.assessment?.type || '');

                  return (
                    <motion.tr
                      key={group.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-white/60 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${iconColor}`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium text-foreground">{group.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        {group.assessment?.title || (language === 'ar' ? 'لم يتم تعيين تقييم' : 'No assessment assigned')}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${
                          status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {status === "active" && <Play className="w-3 h-3 mr-1.5" />}
                          {status === "completed" && <CheckCircle2 className="w-3 h-3 mr-1.5" />}
                          {status === "draft" && <Clock className="w-3 h-3 mr-1.5" />}
                          {getStatusLabel(status)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/30 w-fit">
                          <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          <span className="font-semibold text-violet-700 dark:text-violet-300">{group.completed_count}</span>
                          <span className="text-violet-600/60 dark:text-violet-400/60">/ {group.participants_count}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        <div>{formatDate(group.start_date)} - {formatDate(group.end_date)}</div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/assessment-groups/${group.id}/report`)}>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              {t.groups.viewReport}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(group)}>
                              <Edit className="w-4 h-4 mr-2" />
                              {t.common.edit}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyInviteLink(group)}>
                              <LinkIcon className="w-4 h-4 mr-2" />
                              {t.groups.copyLink}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserPlus className="w-4 h-4 mr-2" />
                              {language === 'ar' ? 'إضافة مشاركين' : 'Add Participants'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(group)}
                              className="text-destructive"
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

        {/* Pagination */}
        {!loading && filteredGroups.length > 0 && (
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
            <DialogTitle>{language === 'ar' ? 'إنشاء مجموعة تقييم' : 'Create Assessment Group'}</DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'أنشئ مجموعة جديدة لتنظيم المشاركين في التقييم.' : 'Create a new group to organize participants for an assessment.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.groups.groupName} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={language === 'ar' ? 'مثال: الربع الأول 2025 - قسم تقنية المعلومات' : 'e.g., Q1 2025 - IT Department'}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.assessments.title}</Label>
              <Select
                value={formData.assessment_id}
                onValueChange={(value) => setFormData({ ...formData, assessment_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.groups.selectAssessment} />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      {assessment.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.groups.startDate}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(formData.start_date, "PPP") : (language === 'ar' ? 'اختر تاريخ' : 'Pick a date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) => setFormData({ ...formData, start_date: date })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>{t.groups.endDate}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? format(formData.end_date, "PPP") : (language === 'ar' ? 'اختر تاريخ' : 'Pick a date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) => setFormData({ ...formData, end_date: date })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="is_active" className="text-base">{language === 'ar' ? 'نشط' : 'Active'}</Label>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'جعل هذه المجموعة متاحة للمشاركين' : 'Make this group available for participants'}
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.groups.createGroup}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل مجموعة التقييم' : 'Edit Assessment Group'}</DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'تحديث إعدادات وتكوين المجموعة.' : 'Update group settings and configuration.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t.groups.groupName} *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.assessments.title}</Label>
              <Select
                value={formData.assessment_id}
                onValueChange={(value) => setFormData({ ...formData, assessment_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.groups.selectAssessment} />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      {assessment.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.groups.startDate}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(formData.start_date, "PPP") : (language === 'ar' ? 'اختر تاريخ' : 'Pick a date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) => setFormData({ ...formData, start_date: date })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>{t.groups.endDate}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? format(formData.end_date, "PPP") : (language === 'ar' ? 'اختر تاريخ' : 'Pick a date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) => setFormData({ ...formData, end_date: date })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="edit-is_active" className="text-base">{language === 'ar' ? 'نشط' : 'Active'}</Label>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'جعل هذه المجموعة متاحة للمشاركين' : 'Make this group available for participants'}
                </p>
              </div>
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.settings.saveChanges}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'حذف مجموعة التقييم' : 'Delete Assessment Group'}</DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? `هل أنت متأكد من حذف "${selectedGroup?.name}"؟ سيتم حذف جميع المشاركين المرتبطين وإجاباتهم. لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${selectedGroup?.name}"? This will also remove all associated participants and their responses. This action cannot be undone.`}
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

export default AssessmentGroups;
