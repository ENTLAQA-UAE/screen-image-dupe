import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t, dir } = useLanguage();
  const { toast } = useToast();

  // Pre-fill from signup metadata if available
  const metaOrgName = user?.user_metadata?.organization_name || '';
  const [orgName, setOrgName] = useState(metaOrgName);
  const [slug, setSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoSubmittedRef = useRef(false);

  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);

  const handleNameChange = (value: string) => {
    setOrgName(value);
    setSlug(generateSlug(value));
  };

  /**
   * Single RPC call that atomically:
   * 1. Creates the organization
   * 2. Links the user's profile
   * 3. Assigns org_admin role
   * The DB trigger then auto-creates the 14-day trial subscription.
   */
  const createOrganization = async (name: string, orgSlug: string) => {
    const { data, error } = await supabase.rpc('complete_onboarding', {
      p_org_name: name.trim(),
      p_org_slug: orgSlug || null,
    });

    if (error) throw error;

    toast({
      title: 'Organization created!',
      description: 'Your 14-day free trial has started. Explore the platform!',
    });

    navigate('/dashboard', { replace: true });
  };

  // If org name came from signup metadata, auto-submit once
  useEffect(() => {
    if (metaOrgName && user && !authLoading && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      setOrgName(metaOrgName);
      const autoSlug = generateSlug(metaOrgName);
      setSlug(autoSlug);

      setIsSubmitting(true);
      createOrganization(metaOrgName, autoSlug).catch((err) => {
        console.error('Auto-onboarding error:', err);
        setIsSubmitting(false);
      });
    }
  }, [metaOrgName, user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !orgName.trim()) return;

    setIsSubmitting(true);
    try {
      await createOrganization(orgName, slug);
    } catch (err: any) {
      console.error('Onboarding error:', err);
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: err.message || 'Failed to create organization',
      });
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 flex items-center justify-center p-6" dir={dir}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20"
          >
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Set Up Your Organization
          </h1>
          <p className="text-muted-foreground">
            Create your workspace to start assessing talent. You'll get a <strong className="text-primary">14-day free trial</strong> with full access.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-lg p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="org-name" className="text-sm font-medium">
                Organization Name
              </Label>
              <Input
                id="org-name"
                type="text"
                placeholder="e.g. Acme Corporation"
                className="h-12 rounded-xl border-2 border-border/50 focus:border-primary transition-all"
                value={orgName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-slug" className="text-sm font-medium">
                URL Slug <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <div className="relative">
                <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  qudurat.co/
                </span>
                <Input
                  id="org-slug"
                  type="text"
                  placeholder="acme-corp"
                  className="h-12 rounded-xl border-2 border-border/50 focus:border-primary transition-all ps-[100px]"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                />
              </div>
            </div>

            {/* Trial info */}
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">14-Day Free Trial</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Full access to all Starter plan features. No credit card required. Upgrade anytime.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-semibold text-base shadow-button hover:shadow-lg transition-all"
              disabled={isSubmitting || !orgName.trim()}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By creating an organization, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
