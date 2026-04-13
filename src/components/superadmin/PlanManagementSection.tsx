import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Pencil, Trash2, Save, X, GripVertical,
  CreditCard, Users, FileText, FolderOpen, Sparkles,
  Check, Eye, EyeOff, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  description: string | null;
  description_ar: string | null;
  currency: string | null;
  price_monthly_usd: number | null;
  price_annual_usd: number | null;
  features: any;
  is_active: boolean | null;
  is_public: boolean | null;
  sort_order: number | null;
  stripe_product_id: string | null;
  stripe_price_monthly_id: string | null;
  stripe_price_annual_id: string | null;
  max_assessments: number | null;
  max_groups: number | null;
  max_users: number | null;
  max_organizations: number | null;
  max_ai_questions_monthly: number | null;
  created_at: string | null;
  updated_at: string | null;
}

const emptyPlan: Omit<Plan, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  name_ar: '',
  slug: '',
  description: '',
  description_ar: '',
  currency: 'USD',
  price_monthly_usd: 0,
  price_annual_usd: 0,
  features: [],
  is_active: true,
  is_public: true,
  sort_order: 0,
  stripe_product_id: '',
  stripe_price_monthly_id: '',
  stripe_price_annual_id: '',
  max_assessments: 5,
  max_groups: 3,
  max_users: 1,
  max_organizations: null,
  max_ai_questions_monthly: 10,
};

export function PlanManagementSection() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyPlan);
  const [featuresText, setFeaturesText] = useState('');
  const [subCounts, setSubCounts] = useState<Record<string, number>>({});

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load plans' });
    } else {
      setPlans(data || []);
    }

    // Get subscription counts per plan
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('plan_id');

    if (subs) {
      const counts: Record<string, number> = {};
      for (const s of subs) {
        counts[s.plan_id] = (counts[s.plan_id] || 0) + 1;
      }
      setSubCounts(counts);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateDialog = () => {
    setEditingPlan(null);
    setFormData({ ...emptyPlan, sort_order: plans.length });
    setFeaturesText('');
    setDialogOpen(true);
  };

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      name_ar: plan.name_ar || '',
      slug: plan.slug,
      description: plan.description || '',
      description_ar: plan.description_ar || '',
      currency: plan.currency || 'USD',
      price_monthly_usd: plan.price_monthly_usd,
      price_annual_usd: plan.price_annual_usd,
      features: plan.features,
      is_active: plan.is_active ?? true,
      is_public: plan.is_public ?? true,
      sort_order: plan.sort_order ?? 0,
      stripe_product_id: plan.stripe_product_id || '',
      stripe_price_monthly_id: plan.stripe_price_monthly_id || '',
      stripe_price_annual_id: plan.stripe_price_annual_id || '',
      max_assessments: plan.max_assessments,
      max_groups: plan.max_groups,
      max_users: plan.max_users,
      max_organizations: plan.max_organizations,
      max_ai_questions_monthly: plan.max_ai_questions_monthly,
    });
    setFeaturesText(
      Array.isArray(plan.features)
        ? plan.features.join('\n')
        : typeof plan.features === 'string'
          ? plan.features
          : ''
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Name and slug are required' });
      return;
    }

    setSaving(true);

    const payload = {
      name: formData.name.trim(),
      name_ar: formData.name_ar?.trim() || null,
      slug: formData.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
      description: formData.description?.trim() || null,
      description_ar: formData.description_ar?.trim() || null,
      currency: formData.currency || 'USD',
      price_monthly_usd: formData.price_monthly_usd,
      price_annual_usd: formData.price_annual_usd,
      features: featuresText.trim()
        ? featuresText.split('\n').map(f => f.trim()).filter(Boolean)
        : [],
      is_active: formData.is_active,
      is_public: formData.is_public,
      sort_order: formData.sort_order ?? 0,
      stripe_product_id: formData.stripe_product_id?.trim() || null,
      stripe_price_monthly_id: formData.stripe_price_monthly_id?.trim() || null,
      stripe_price_annual_id: formData.stripe_price_annual_id?.trim() || null,
      max_assessments: formData.max_assessments,
      max_groups: formData.max_groups,
      max_users: formData.max_users,
      max_organizations: formData.max_organizations,
      max_ai_questions_monthly: formData.max_ai_questions_monthly,
    };

    let error;
    if (editingPlan) {
      ({ error } = await supabase
        .from('plans')
        .update(payload)
        .eq('id', editingPlan.id));
    } else {
      ({ error } = await supabase.from('plans').insert(payload));
    }

    setSaving(false);

    if (error) {
      console.error('Save plan error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message.includes('duplicate')
          ? 'A plan with this slug already exists'
          : error.message,
      });
    } else {
      toast({ title: editingPlan ? 'Plan Updated' : 'Plan Created', description: `"${payload.name}" saved successfully.` });
      setDialogOpen(false);
      fetchPlans();
    }
  };

  const handleDelete = async () => {
    if (!deletingPlan) return;

    const count = subCounts[deletingPlan.id] || 0;
    if (count > 0) {
      toast({
        variant: 'destructive',
        title: 'Cannot Delete',
        description: `This plan has ${count} active subscription(s). Deactivate them first or move them to another plan.`,
      });
      setDeleteDialogOpen(false);
      return;
    }

    const { error } = await supabase.from('plans').delete().eq('id', deletingPlan.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Plan Deleted', description: `"${deletingPlan.name}" has been removed.` });
      fetchPlans();
    }
    setDeleteDialogOpen(false);
  };

  const toggleActive = async (plan: Plan) => {
    const { error } = await supabase
      .from('plans')
      .update({ is_active: !plan.is_active })
      .eq('id', plan.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      fetchPlans();
    }
  };

  const formatLimit = (val: number | null) => {
    if (val === null || val === undefined) return '—';
    if (val === -1) return '∞';
    return val.toLocaleString();
  };

  const formatPrice = (val: number | null) => {
    if (val === null || val === undefined || val === 0) return 'Free';
    return `$${val}`;
  };

  const tierColors: Record<string, string> = {
    free: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    professional: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  };

  const updateField = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const numField = (label: string, key: keyof typeof formData, tooltip?: string) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={formData[key] === null || formData[key] === undefined ? '' : String(formData[key])}
        onChange={(e) => {
          const v = e.target.value;
          updateField(key, v === '' ? null : Number(v));
        }}
        className="h-9"
        placeholder="-1 = unlimited"
      />
      {tooltip && <p className="text-[10px] text-muted-foreground">{tooltip}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Subscription Plans</h2>
          <p className="text-sm text-muted-foreground">
            Manage the {plans.length} plan tiers available to organizations
          </p>
        </div>
        <Button onClick={openCreateDialog} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Plan
        </Button>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-4">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className={`border transition-all ${!plan.is_active ? 'opacity-60 border-dashed' : 'border-border/60'}`}>
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-4">
                  {/* Sort handle & info */}
                  <div className="flex items-center gap-3 shrink-0 pt-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {plan.sort_order ?? idx}
                    </div>
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{plan.name}</h3>
                      {plan.name_ar && (
                        <span className="text-sm text-muted-foreground" dir="rtl">({plan.name_ar})</span>
                      )}
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tierColors[plan.slug] || ''}`}>
                        {plan.slug}
                      </Badge>
                      {!plan.is_active && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Inactive</Badge>
                      )}
                      {!plan.is_public && plan.is_active && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                          <EyeOff className="h-2.5 w-2.5" /> Hidden
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                      {plan.description || 'No description'}
                    </p>

                    {/* Limits row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" /> {formatLimit(plan.max_assessments)} assessments
                      </span>
                      <span className="flex items-center gap-1">
                        <FolderOpen className="h-3 w-3" /> {formatLimit(plan.max_groups)} groups
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {formatLimit(plan.max_users)} users
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> {formatLimit(plan.max_ai_questions_monthly)} AI/mo
                      </span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="text-end shrink-0">
                    <div className="text-sm font-semibold text-foreground">
                      {formatPrice(plan.price_monthly_usd)}<span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </div>
                    {plan.price_annual_usd ? (
                      <div className="text-xs text-muted-foreground">
                        {formatPrice(plan.price_annual_usd)}/yr
                      </div>
                    ) : null}
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {subCounts[plan.id] || 0} org{(subCounts[plan.id] || 0) !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleActive(plan)}
                      title={plan.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {plan.is_active
                        ? <ToggleRight className="h-4 w-4 text-emerald-500" />
                        : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      }
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(plan)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => { setDeletingPlan(plan); setDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {plans.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <CreditCard className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No plans configured yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first plan to enable subscriptions and trials
              </p>
              <Button onClick={openCreateDialog} size="sm" className="mt-4 gap-1.5">
                <Plus className="h-4 w-4" />
                Create First Plan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create New Plan'}</DialogTitle>
            <DialogDescription>
              {editingPlan
                ? 'Update plan details, limits, and pricing.'
                : 'Configure a new subscription tier for organizations.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Basic Info */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Basic Info
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Plan Name (EN)</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      updateField('name', e.target.value);
                      if (!editingPlan) {
                        updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 30));
                      }
                    }}
                    placeholder="e.g. Professional"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Plan Name (AR)</Label>
                  <Input
                    value={formData.name_ar || ''}
                    onChange={(e) => updateField('name_ar', e.target.value)}
                    placeholder="e.g. احترافي"
                    className="h-9"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g. professional"
                    className="h-9 font-mono text-xs"
                    disabled={!!editingPlan}
                  />
                  {editingPlan && (
                    <p className="text-[10px] text-muted-foreground">Slug cannot be changed after creation</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sort Order</Label>
                  <Input
                    type="number"
                    value={formData.sort_order ?? 0}
                    onChange={(e) => updateField('sort_order', Number(e.target.value))}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Description (EN)</Label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Brief plan description..."
                    className="min-h-[60px] text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description (AR)</Label>
                  <Textarea
                    value={formData.description_ar || ''}
                    onChange={(e) => updateField('description_ar', e.target.value)}
                    placeholder="وصف الخطة..."
                    className="min-h-[60px] text-xs"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Pricing (USD)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Monthly Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_monthly_usd ?? ''}
                    onChange={(e) => updateField('price_monthly_usd', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="0 = Free"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Annual Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_annual_usd ?? ''}
                    onChange={(e) => updateField('price_annual_usd', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="0 = Free"
                    className="h-9"
                  />
                  {formData.price_monthly_usd && formData.price_annual_usd ? (
                    <p className="text-[10px] text-emerald-600">
                      {Math.round((1 - formData.price_annual_usd / (formData.price_monthly_usd * 12)) * 100)}% annual savings
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <Separator />

            {/* Limits */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Plan Limits
              </h4>
              <p className="text-[10px] text-muted-foreground mb-3">Use -1 for unlimited. Leave empty for no limit.</p>
              <div className="grid grid-cols-3 gap-3">
                {numField('Max Assessments', 'max_assessments')}
                {numField('Max Groups', 'max_groups')}
                {numField('Max Users (HR Admins)', 'max_users')}
                {numField('Max Organizations', 'max_organizations')}
                {numField('AI Questions / Month', 'max_ai_questions_monthly')}
              </div>
            </div>

            <Separator />

            {/* Stripe IDs */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Stripe Integration
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Stripe Product ID</Label>
                  <Input
                    value={formData.stripe_product_id || ''}
                    onChange={(e) => updateField('stripe_product_id', e.target.value)}
                    placeholder="prod_..."
                    className="h-9 font-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Stripe Monthly Price ID</Label>
                    <Input
                      value={formData.stripe_price_monthly_id || ''}
                      onChange={(e) => updateField('stripe_price_monthly_id', e.target.value)}
                      placeholder="price_..."
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Stripe Annual Price ID</Label>
                    <Input
                      value={formData.stripe_price_annual_id || ''}
                      onChange={(e) => updateField('stripe_price_annual_id', e.target.value)}
                      placeholder="price_..."
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Features list */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Check className="h-4 w-4" /> Features (one per line)
              </h4>
              <Textarea
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                placeholder={"Up to 5 assessments\n1 HR admin\nBasic analytics\nEmail support"}
                className="min-h-[100px] text-xs"
              />
            </div>

            <Separator />

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active ?? true}
                  onCheckedChange={(v) => updateField('is_active', v)}
                />
                <Label className="text-xs">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_public ?? true}
                  onCheckedChange={(v) => updateField('is_public', v)}
                />
                <Label className="text-xs">Public (visible on pricing page)</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan: {deletingPlan?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the "{deletingPlan?.name}" plan.
              {(subCounts[deletingPlan?.id || ''] || 0) > 0
                ? ` This plan has ${subCounts[deletingPlan?.id || '']} active subscription(s) — it cannot be deleted.`
                : ' This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={(subCounts[deletingPlan?.id || ''] || 0) > 0}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
