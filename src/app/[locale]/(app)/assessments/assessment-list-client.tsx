'use client';

import {
  Brain,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  FileText,
  Heart,
  Languages,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

// ==============================================================================
// Types & constants
// ==============================================================================

interface Assessment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string | null;
  language: string | null;
  is_graded: boolean | null;
  created_at: string | null;
  questions_count: number;
}

const CARD_GRADIENTS: Record<string, string> = {
  cognitive: 'bg-gradient-to-br from-blue-500 to-blue-600',
  personality: 'bg-gradient-to-br from-rose-500 to-rose-600',
  situational: 'bg-gradient-to-br from-amber-500 to-amber-600',
  behavioral: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
  language: 'bg-gradient-to-br from-violet-500 to-violet-600',
  custom: 'bg-gradient-to-br from-slate-500 to-slate-600',
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cognitive: Brain,
  personality: Heart,
  situational: MessageSquare,
  behavioral: MessageSquare,
  language: Languages,
  custom: FileText,
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: 'Draft', icon: Clock },
  active: { label: 'Active', icon: Play },
  archived: { label: 'Archived', icon: CheckCircle2 },
};

// ==============================================================================
// Main component
// ==============================================================================

export function AssessmentListClient({ organizationId }: { organizationId: string }) {
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Fetch assessments
  const fetchAssessments = useCallback(async () => {
    const { data, error } = await supabase
      .from('assessments')
      .select('id, title, description, type, status, language, is_graded, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assessments:', error);
      setLoading(false);
      return;
    }

    // Get question counts
    const withCounts = await Promise.all(
      (data ?? []).map(async (a) => {
        const { count } = await supabase
          .from('questions')
          .select('id', { count: 'exact', head: true })
          .eq('assessment_id', a.id);
        return { ...a, questions_count: count ?? 0 } as Assessment;
      }),
    );

    setAssessments(withCounts);
    setLoading(false);
  }, [supabase, organizationId]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // Status change
  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('assessments')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
      return;
    }
    toast.success(`Status changed to ${newStatus}`);
    setMenuOpen(null);
    fetchAssessments();
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;

    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete assessment');
      return;
    }
    toast.success('Assessment deleted');
    setMenuOpen(null);
    fetchAssessments();
  };

  // Filter
  const filtered = assessments.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Assessments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, manage, and launch assessments
          </p>
        </div>
        <Button onClick={() => router.push(`/${locale}/assessments/new`)}>
          <Plus className="h-4 w-4" />
          New assessment
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-80">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assessments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
          />
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && !loading && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">
            {searchQuery ? 'No assessments found' : 'No assessments yet'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery
              ? 'Try a different search term'
              : 'Create your first assessment to get started'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => router.push(`/${locale}/assessments/new`)}
              className="mt-4"
            >
              <Plus className="h-4 w-4" />
              Create assessment
            </Button>
          )}
        </div>
      )}

      {/* Card grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((assessment) => {
            const IconComponent =
              TYPE_ICONS[assessment.type] ?? FileText;
            const gradient =
              CARD_GRADIENTS[assessment.type] ?? CARD_GRADIENTS.custom;
            const status =
              STATUS_CONFIG[assessment.status ?? 'draft'] ??
              STATUS_CONFIG.draft!;
            const StatusIcon = status!.icon;
            const isMenuOpen = menuOpen === assessment.id;

            return (
              <div
                key={assessment.id}
                className={cn(
                  'relative rounded-2xl p-6 text-white transition-all hover:scale-[1.02] hover:shadow-xl',
                  gradient,
                )}
              >
                {/* Top: icon + menu */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <IconComponent className="h-7 w-7" />
                  </div>

                  {/* Dropdown menu */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setMenuOpen(isMenuOpen ? null : assessment.id)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {isMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute end-0 z-50 mt-1 w-48 rounded-xl border border-border bg-card py-1 shadow-xl">
                          <MenuAction
                            icon={Eye}
                            label="Preview"
                            onClick={() => {
                              setMenuOpen(null);
                              router.push(
                                `/${locale}/assessments/${assessment.id}`,
                              );
                            }}
                          />
                          <MenuAction
                            icon={Edit}
                            label="Edit questions"
                            onClick={() => {
                              setMenuOpen(null);
                              router.push(
                                `/${locale}/assessments/${assessment.id}/edit`,
                              );
                            }}
                          />

                          <div className="my-1 border-t border-border" />

                          {assessment.status !== 'active' && (
                            <MenuAction
                              icon={Play}
                              label="Set Active"
                              onClick={() =>
                                handleStatusChange(assessment.id, 'active')
                              }
                            />
                          )}
                          {assessment.status !== 'draft' && (
                            <MenuAction
                              icon={Clock}
                              label="Set Draft"
                              onClick={() =>
                                handleStatusChange(assessment.id, 'draft')
                              }
                            />
                          )}
                          {assessment.status !== 'archived' && (
                            <MenuAction
                              icon={CheckCircle2}
                              label="Archive"
                              onClick={() =>
                                handleStatusChange(assessment.id, 'archived')
                              }
                            />
                          )}

                          <div className="my-1 border-t border-border" />

                          <MenuAction
                            icon={Trash2}
                            label="Delete"
                            destructive
                            onClick={() => handleDelete(assessment.id)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Title + description */}
                <h3
                  className="cursor-pointer text-lg font-semibold text-white line-clamp-1 hover:underline"
                  onClick={() =>
                    router.push(`/${locale}/assessments/${assessment.id}`)
                  }
                >
                  {assessment.title}
                </h3>
                <p className="mt-1 text-sm text-white/70 line-clamp-2">
                  {assessment.description ?? 'No description'}
                </p>

                {/* Status + question count */}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </span>
                  <span className="font-medium text-white/80">
                    {assessment.questions_count} questions
                  </span>
                </div>

                {/* Date */}
                <div className="mt-4 border-t border-white/20 pt-4 text-xs text-white/60">
                  Created {formatDate(assessment.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==============================================================================
// Dropdown menu item
// ==============================================================================

function MenuAction({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-start text-sm transition-colors',
        destructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-muted',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
