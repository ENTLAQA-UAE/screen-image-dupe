'use client';

import {
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  MoreHorizontal,
  Play,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  Users,
  XCircle,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Participant {
  id: string;
  full_name: string;
  email: string;
  employee_code: string | null;
  department: string | null;
  job_title: string | null;
  status: string;
  group_id: string | null;
  group_name: string;
  started_at: string | null;
  completed_at: string | null;
  score_summary: unknown;
  created_at: string;
}

interface Group {
  id: string;
  name: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  invited: { label: 'Invited', icon: Clock, color: 'bg-slate-100 text-slate-600' },
  active: { label: 'Active', icon: Play, color: 'bg-blue-100 text-blue-600' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
  abandoned: { label: 'Abandoned', icon: XCircle, color: 'bg-red-100 text-red-600' },
};

export function ParticipantsClient({ organizationId }: { organizationId: string }) {
  const locale = useLocale();
  const supabase = createClient();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Add dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    fullName: '',
    email: '',
    employeeCode: '',
    department: '',
    jobTitle: '',
    groupId: '',
  });

  // CSV import dialog
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvGroupId, setCsvGroupId] = useState('');
  const [importing, setImporting] = useState(false);

  const fetchData = useCallback(async () => {
    const [{ data: pData }, { data: gData }] = await Promise.all([
      supabase
        .from('participants')
        .select('id, full_name, email, employee_code, department, job_title, status, group_id, started_at, completed_at, score_summary, created_at, assessment_groups(name)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false }),
      supabase
        .from('assessment_groups')
        .select('id, name')
        .eq('organization_id', organizationId)
        .order('name'),
    ]);

    setParticipants(
      (pData ?? []).map((p) => {
        const g = p.assessment_groups as unknown as { name: string } | null;
        return { ...p, group_name: g?.name ?? '' } as Participant;
      }),
    );
    setGroups((gData ?? []) as Group[]);
    setLoading(false);
  }, [supabase, organizationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add participant
  const handleAdd = async () => {
    if (!addForm.fullName || !addForm.email || !addForm.groupId) {
      toast.error('Name, email, and group are required');
      return;
    }
    setAdding(true);
    const { error } = await supabase.from('participants').insert({
      organization_id: organizationId,
      full_name: addForm.fullName,
      email: addForm.email,
      employee_code: addForm.employeeCode || null,
      department: addForm.department || null,
      job_title: addForm.jobTitle || null,
      group_id: addForm.groupId,
      status: 'invited',
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Participant added');
      setIsAddOpen(false);
      setAddForm({ fullName: '', email: '', employeeCode: '', department: '', jobTitle: '', groupId: '' });
      fetchData();
    }
    setAdding(false);
  };

  // CSV import
  const handleCsvImport = async () => {
    if (!csvGroupId || !csvText.trim()) {
      toast.error('Select a group and paste CSV data');
      return;
    }
    setImporting(true);
    const lines = csvText.trim().split('\n').filter(Boolean);
    let imported = 0;

    for (const line of lines) {
      const parts = line.split(',').map((s) => s.trim());
      if (parts.length < 2) continue;
      const [fullName, email, employeeCode, department, jobTitle] = parts;
      if (!fullName || !email) continue;

      const { error } = await supabase.from('participants').insert({
        organization_id: organizationId,
        full_name: fullName,
        email,
        employee_code: employeeCode || null,
        department: department || null,
        job_title: jobTitle || null,
        group_id: csvGroupId,
        status: 'invited',
      });

      if (!error) imported++;
    }

    toast.success(`Imported ${imported} participants`);
    setIsCsvOpen(false);
    setCsvText('');
    setImporting(false);
    fetchData();
  };

  // CSV export
  const handleCsvExport = () => {
    const header = 'Name,Email,Employee Code,Department,Job Title,Group,Status,Completed';
    const rows = filtered.map(
      (p) =>
        `${p.full_name},${p.email},${p.employee_code ?? ''},${p.department ?? ''},${p.job_title ?? ''},${p.group_name},${p.status},${p.completed_at ?? ''}`,
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'participants.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  // Reset participant
  const handleReset = async (id: string) => {
    if (!confirm('Reset this participant? Their responses will be cleared.')) return;
    const { error } = await supabase
      .from('participants')
      .update({ status: 'invited', started_at: null, completed_at: null, score_summary: null })
      .eq('id', id);
    if (error) toast.error('Failed to reset');
    else { toast.success('Participant reset'); fetchData(); }
    setMenuOpen(null);
  };

  // Delete participant
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this participant?')) return;
    const { error } = await supabase.from('participants').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Participant deleted'); fetchData(); }
    setMenuOpen(null);
  };

  // Filter
  const filtered = participants.filter((p) => {
    const matchSearch =
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchGroup = groupFilter === 'all' || p.group_id === groupFilter;
    return matchSearch && matchStatus && matchGroup;
  });

  const extractScore = (summary: unknown) => {
    const s = summary as { percentage?: number; total_score?: number } | null;
    return s?.percentage ?? s?.total_score ?? null;
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
          <h1 className="font-display text-2xl font-bold tracking-tight">Participants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {participants.length} total • {participants.filter((p) => p.status === 'completed').length} completed
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCsvOpen(true)}>
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={handleCsvExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add participant
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="ps-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="all">All statuses</option>
          <option value="invited">Invited</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="abandoned">Abandoned</option>
        </select>
        <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="all">All groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No participants</h3>
          <p className="mt-1 text-sm text-muted-foreground">Add participants or import via CSV</p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">Group</th>
                <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-end text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score</th>
                <th className="px-6 py-3 text-end text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const status = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.invited;
                const score = extractScore(p.score_summary);
                const isOpen = menuOpen === p.id;

                return (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                    <td className="px-6 py-3 font-medium">{p.full_name}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{p.email}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{p.group_name || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium', status.color)}>
                        <status.icon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-end font-mono text-sm">
                      {score !== null ? `${score}%` : '—'}
                    </td>
                    <td className="px-6 py-3 text-end">
                      <div className="relative inline-block">
                        <button onClick={() => setMenuOpen(isOpen ? null : p.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {isOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                            <div className="absolute end-0 z-50 mt-1 w-44 rounded-xl border border-border bg-card py-1 shadow-xl">
                              <MenuItem icon={RotateCcw} label="Reset" onClick={() => handleReset(p.id)} />
                              <MenuItem icon={Trash2} label="Delete" destructive onClick={() => handleDelete(p.id)} />
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

      {/* Add Participant Dialog */}
      {isAddOpen && (
        <Dialog onClose={() => setIsAddOpen(false)}>
          <h2 className="font-display text-xl font-bold">Add participant</h2>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Full name *</Label><Input value={addForm.fullName} onChange={(e) => setAddForm((f) => ({ ...f, fullName: e.target.value }))} /></div>
              <div><Label>Email *</Label><Input type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <div><Label>Group *</Label>
              <select value={addForm.groupId} onChange={(e) => setAddForm((f) => ({ ...f, groupId: e.target.value }))} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="">Select group...</option>
                {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><Label>Employee code</Label><Input value={addForm.employeeCode} onChange={(e) => setAddForm((f) => ({ ...f, employeeCode: e.target.value }))} /></div>
              <div><Label>Department</Label><Input value={addForm.department} onChange={(e) => setAddForm((f) => ({ ...f, department: e.target.value }))} /></div>
              <div><Label>Job title</Label><Input value={addForm.jobTitle} onChange={(e) => setAddForm((f) => ({ ...f, jobTitle: e.target.value }))} /></div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={adding}>
              {adding && <Loader2 className="h-4 w-4 animate-spin" />}
              Add participant
            </Button>
          </div>
        </Dialog>
      )}

      {/* CSV Import Dialog */}
      {isCsvOpen && (
        <Dialog onClose={() => setIsCsvOpen(false)}>
          <h2 className="font-display text-xl font-bold">Import participants from CSV</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste CSV data with columns: Name, Email, Employee Code, Department, Job Title
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <Label>Target group *</Label>
              <select value={csvGroupId} onChange={(e) => setCsvGroupId(e.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="">Select group...</option>
                {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
              </select>
            </div>
            <div>
              <Label>CSV data</Label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={8}
                placeholder={"John Doe,john@example.com,EMP001,Engineering,Senior Dev\nJane Smith,jane@example.com,EMP002,HR,Manager"}
                className="flex min-h-[150px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCsvOpen(false)}>Cancel</Button>
            <Button onClick={handleCsvImport} disabled={importing}>
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              Import
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

// ==============================================================================
// Shared components
// ==============================================================================

function Dialog({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
          {children}
        </div>
      </div>
    </>
  );
}

function MenuItem({ icon: Icon, label, onClick, destructive }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button onClick={onClick} className={cn('flex w-full items-center gap-2 px-3 py-2 text-start text-sm', destructive ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-muted')}>
      <Icon className="h-4 w-4" />{label}
    </button>
  );
}
