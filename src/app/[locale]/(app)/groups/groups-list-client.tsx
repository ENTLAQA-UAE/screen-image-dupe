'use client';

import {
  Brain,

  Clock,


  FileText,
  Heart,
  Languages,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

// ==============================================================================
// Types
// ==============================================================================

interface AssessmentGroup {
  id: string;
  name: string;
  assessment_id: string | null;
  is_active: boolean | null;
  group_link_token: string | null;
  end_date: string | null;
  start_date: string | null;
  created_at: string | null;
  assessment_title: string;
  assessment_type: string;
  participant_count: number;
  completed_count: number;
}

interface Assessment {
  id: string;
  title: string;
  type: string;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cognitive: Brain,
  personality: Heart,
  situational: MessageSquare,
  behavioral: MessageSquare,
  language: Languages,
};

const TYPE_COLORS: Record<string, string> = {
  cognitive: 'bg-blue-500',
  personality: 'bg-rose-500',
  situational: 'bg-amber-500',
  behavioral: 'bg-emerald-500',
  language: 'bg-violet-500',
};

// ==============================================================================
// Main component
// ==============================================================================

export function GroupsListClient({ organizationId }: { organizationId: string }) {
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [groups, setGroups] = useState<AssessmentGroup[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    assessmentId: '',
  });

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    const { data, error } = await supabase
      .from('assessment_groups')
      .select('id, name, assessment_id, is_active, group_link_token, end_date, start_date, created_at, assessments(title, type)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching groups:', error);
      setLoading(false);
      return;
    }

    // Get participant counts
    const withCounts = await Promise.all(
      (data ?? []).map(async (g) => {
        const { count: total } = await supabase
          .from('participants')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', g.id);

        const { count: completed } = await supabase
          .from('participants')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', g.id)
          .eq('status', 'completed');

        const assessment = g.assessments as unknown as { title: string; type: string } | null;

        return {
          id: g.id,
          name: g.name,
          assessment_id: g.assessment_id,
          is_active: g.is_active,
          group_link_token: g.group_link_token,
          end_date: g.end_date,
          start_date: g.start_date,
          created_at: g.created_at,
          assessment_title: assessment?.title ?? '',
          assessment_type: assessment?.type ?? '',
          participant_count: total ?? 0,
          completed_count: completed ?? 0,
        } as AssessmentGroup;
      }),
    );

    setGroups(withCounts);
    setLoading(false);
  }, [supabase, organizationId]);

  // Fetch assessments for create dialog
  const fetchAssessments = useCallback(async () => {
    const { data } = await supabase
      .from('assessments')
      .select('id, title, type')
      .eq('organization_id', organizationId)
      .order('title');

    setAssessments((data ?? []) as Assessment[]);
  }, [supabase, organizationId]);

  useEffect(() => {
    fetchGroups();
    fetchAssessments();
  }, [fetchGroups, fetchAssessments]);

  // Create group
  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (!createForm.assessmentId) {
      toast.error('Please select an assessment');
      return;
    }

    setCreating(true);
    const { error } = await supabase.from('assessment_groups').insert({
      organization_id: organizationId,
      name: createForm.name.trim(),
      assessment_id: createForm.assessmentId,
      is_active: false,
    });

    if (error) {
      toast.error(error.message);
      setCreating(false);
      return;
    }

    toast.success('Group created');
    setIsCreateOpen(false);
    setCreateForm({ name: '', assessmentId: '' });
    setCreating(false);
    fetchGroups();
  };

  // Toggle active status
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('assessment_groups')
      .update({ is_active: !currentActive })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
      return;
    }
    toast.success(currentActive ? 'Group deactivated' : 'Group activated');
    setMenuOpen(null);
    fetchGroups();
  };

  // Delete group
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this group? All participant data will be lost.')) return;

    const { error } = await supabase
      .from('assessment_groups')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete group');
      return;
    }
    toast.success('Group deleted');
    setMenuOpen(null);
    fetchGroups();
  };

  // Copy link
  const copyLink = (token: string | null) => {
    if (!token) {
      toast.error('No link token available');
      return;
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const link = `${appUrl}/assess/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Assessment link copied');
    setMenuOpen(null);
  };

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
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
            Assessment Groups
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize participants and launch assessments
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New group
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-80">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
          />
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No groups yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a group to invite participants to take an assessment
          </p>
          <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create group
          </Button>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Group
                </th>
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assessment
                </th>
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Participants
                </th>
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Created
                </th>
                <th className="px-6 py-4 text-end text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((group) => {
                const IconComp = TYPE_ICONS[group.assessment_type] ?? FileText;
                const iconColor = TYPE_COLORS[group.assessment_type] ?? 'bg-slate-500';
                const isMenuOpen = menuOpen === group.id;
                const completionPct =
                  group.participant_count > 0
                    ? Math.round(
                        (group.completed_count / group.participant_count) * 100,
                      )
                    : 0;

                return (
                  <tr
                    key={group.id}
                    className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm',
                            iconColor,
                          )}
                        >
                          <IconComp className="h-5 w-5" />
                        </div>
                        <span
                          className="cursor-pointer font-medium hover:text-primary hover:underline"
                          onClick={() =>
                            router.push(`/${locale}/groups/${group.id}`)
                          }
                        >
                          {group.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {group.assessment_title || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium',
                          group.is_active
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                        )}
                      >
                        {group.is_active ? (
                          <Play className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {group.is_active ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="font-medium">
                          {group.completed_count}
                        </span>
                        <span className="text-muted-foreground">
                          {' '}
                          / {group.participant_count}
                        </span>
                        {group.participant_count > 0 && (
                          <span className="ms-2 text-xs text-muted-foreground">
                            ({completionPct}%)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(group.created_at)}
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="relative inline-block">
                        <button
                          onClick={() =>
                            setMenuOpen(isMenuOpen ? null : group.id)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                                icon={Users}
                                label="View details"
                                onClick={() => {
                                  setMenuOpen(null);
                                  router.push(
                                    `/${locale}/groups/${group.id}`,
                                  );
                                }}
                              />
                              <MenuAction
                                icon={LinkIcon}
                                label="Copy assessment link"
                                onClick={() =>
                                  copyLink(group.group_link_token)
                                }
                              />
                              <div className="my-1 border-t border-border" />
                              <MenuAction
                                icon={group.is_active ? Clock : Play}
                                label={
                                  group.is_active ? 'Deactivate' : 'Activate'
                                }
                                onClick={() =>
                                  handleToggleActive(
                                    group.id,
                                    !!group.is_active,
                                  )
                                }
                              />
                              <div className="my-1 border-t border-border" />
                              <MenuAction
                                icon={Trash2}
                                label="Delete"
                                destructive
                                onClick={() => handleDelete(group.id)}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Group Dialog */}
      {isCreateOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsCreateOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <h2 className="font-display text-xl font-bold">
                Create assessment group
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Set up a group to invite participants
              </p>

              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="groupName">Group name</Label>
                  <Input
                    id="groupName"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="e.g., Engineering Team Q2"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="assessmentId">Assessment</Label>
                  <select
                    id="assessmentId"
                    value={createForm.assessmentId}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        assessmentId: e.target.value,
                      }))
                    }
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select an assessment...</option>
                    {assessments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Create group
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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
