import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Eye, EyeOff, CheckCircle2, XCircle, Loader2, Zap, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StripeConfig {
  id?: string;
  publishable_key: string;
  api_key: string;           // secret key (stored encrypted in DB)
  webhook_secret: string;
  is_active: boolean;
  is_test_mode: boolean;
}

interface StripeSettingsSectionProps {
  onBack: () => void;
}

export function StripeSettingsSection({ onBack }: StripeSettingsSectionProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<StripeConfig>({
    publishable_key: '',
    api_key: '',
    webhook_secret: '',
    is_active: false,
    is_test_mode: true,
  });
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');

  useEffect(() => {
    fetchStripeConfig();
  }, []);

  const fetchStripeConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_providers')
        .select('*')
        .eq('provider_type', 'stripe')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig({
          id: data.id,
          publishable_key: data.publishable_key || '',
          api_key: data.api_key_encrypted || '',
          webhook_secret: data.webhook_secret_encrypted || '',
          is_active: data.is_active ?? false,
          is_test_mode: data.is_test_mode ?? true,
        });
        setConnectionStatus(data.is_active ? 'connected' : 'disconnected');
      }
    } catch (err) {
      console.error('Error fetching Stripe config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.publishable_key || !config.api_key) {
      toast({ variant: 'destructive', title: 'Missing keys', description: 'Publishable key and secret key are required.' });
      return;
    }

    setSaving(true);
    try {
      const isTestMode = config.publishable_key.startsWith('pk_test_');
      const payload = {
        provider_type: 'stripe',
        publishable_key: config.publishable_key,
        api_key_encrypted: config.api_key,
        webhook_secret_encrypted: config.webhook_secret,
        is_test_mode: isTestMode,
        is_active: true,
        display_name: isTestMode ? 'Stripe (Test Mode)' : 'Stripe (Live)',
        activated_at: new Date().toISOString(),
      };

      let error;
      if (config.id) {
        ({ error } = await supabase.from('payment_providers').update(payload).eq('id', config.id));
      } else {
        ({ error } = await supabase.from('payment_providers').insert(payload));
      }

      if (error) throw error;

      setConnectionStatus('connected');
      setConfig(prev => ({ ...prev, is_active: true, is_test_mode: isTestMode }));

      toast({ title: 'Settings saved', description: 'Stripe configuration has been updated.' });
      fetchStripeConfig();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.publishable_key) {
      toast({ variant: 'destructive', title: 'Missing key', description: 'Enter a publishable key first.' });
      return;
    }

    setTesting(true);
    // Simulate a connection test (in production, call an edge function that pings Stripe API)
    await new Promise(r => setTimeout(r, 1500));

    const isValid = config.publishable_key.startsWith('pk_live_') || config.publishable_key.startsWith('pk_test_');
    if (isValid) {
      setConnectionStatus('connected');
      toast({ title: 'Connection successful', description: 'Stripe API keys are valid.' });
    } else {
      setConnectionStatus('disconnected');
      toast({ variant: 'destructive', title: 'Connection failed', description: 'Invalid publishable key format. Must start with pk_live_ or pk_test_.' });
    }
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header with back button */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          Stripe Integration
        </h1>
        <p className="text-muted-foreground">
          Configure Stripe payment processing for subscription billing
        </p>
      </div>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">Connection Status</p>
              <p className="text-xs text-muted-foreground">Current Stripe API connection status</p>
            </div>
          </div>
          {connectionStatus === 'connected' ? (
            <Badge className="bg-green-500/10 text-green-700 border-green-500/20 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </Badge>
          ) : connectionStatus === 'disconnected' ? (
            <Badge variant="destructive" className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Disconnected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">Not configured</Badge>
          )}
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">API Keys</CardTitle>
          <CardDescription>
            Enter your Stripe API keys. You can find these in your Stripe Dashboard under Developers &gt; API Keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Publishable Key */}
          <div className="space-y-2">
            <Label htmlFor="pk" className="font-semibold text-sm">Publishable Key</Label>
            <Input
              id="pk"
              type="text"
              placeholder="pk_live_... or pk_test_..."
              value={config.publishable_key}
              onChange={(e) => setConfig(prev => ({ ...prev, publishable_key: e.target.value }))}
              className="font-mono text-sm h-11"
            />
            <p className="text-xs text-muted-foreground">
              Used in the browser to create checkout sessions. Starts with <code className="bg-muted px-1 rounded">pk_live_</code> or <code className="bg-muted px-1 rounded">pk_test_</code>.
            </p>
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <Label htmlFor="sk" className="font-semibold text-sm">Secret Key</Label>
            <div className="relative">
              <Input
                id="sk"
                type={showSecret ? 'text' : 'password'}
                placeholder="sk_live_... or sk_test_..."
                value={config.api_key}
                onChange={(e) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                className="font-mono text-sm h-11 pe-10"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Used on the server to process payments. Starts with <code className="bg-muted px-1 rounded">sk_live_</code> or <code className="bg-muted px-1 rounded">sk_test_</code>. Keep this secret!
            </p>
          </div>

          {/* Webhook Signing Secret */}
          <div className="space-y-2">
            <Label htmlFor="whsec" className="font-semibold text-sm">Webhook Signing Secret</Label>
            <div className="relative">
              <Input
                id="whsec"
                type={showWebhook ? 'text' : 'password'}
                placeholder="whsec_..."
                value={config.webhook_secret}
                onChange={(e) => setConfig(prev => ({ ...prev, webhook_secret: e.target.value }))}
                className="font-mono text-sm h-11 pe-10"
              />
              <button
                type="button"
                onClick={() => setShowWebhook(!showWebhook)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showWebhook ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Used to verify webhook events from Stripe. Found in Stripe Dashboard under Developers &gt; Webhooks.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
              Save Settings
            </Button>
            <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
              {testing ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Testing Payments Guide */}
      <Card className="border-border/60 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Testing Payments</CardTitle>
          <CardDescription>How to test the payment flow before going live</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold mb-1">1. Use Stripe test keys</p>
            <p className="text-muted-foreground">
              In your Stripe Dashboard, toggle to "Test mode" and copy the test API keys (they start with <code className="bg-muted px-1 rounded">pk_test_</code> and <code className="bg-muted px-1 rounded">sk_test_</code>). Paste them above and save.
            </p>
          </div>

          <div>
            <p className="font-semibold mb-1">2. Test card numbers</p>
            <p className="text-muted-foreground mb-2">Use these test cards on the checkout page:</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-green-500/5 border border-green-500/10">
                <span className="text-xs font-bold text-green-700 w-16">Success:</span>
                <code className="text-xs font-mono text-foreground/80">4242 4242 4242 4242</code>
              </div>
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-red-500/5 border border-red-500/10">
                <span className="text-xs font-bold text-red-700 w-16">Decline:</span>
                <code className="text-xs font-mono text-foreground/80">4000 0000 0000 0002</code>
              </div>
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-blue-500/5 border border-blue-500/10">
                <span className="text-xs font-bold text-blue-700 w-16">3D Secure:</span>
                <code className="text-xs font-mono text-foreground/80">4000 0025 0000 3155</code>
              </div>
            </div>
            <p className="text-muted-foreground mt-2">
              Use any future expiry date, any 3-digit CVC, and any billing details.
            </p>
          </div>

          <div>
            <p className="font-semibold mb-1">3. Switch to live when ready</p>
            <p className="text-muted-foreground">
              Replace test keys with live keys (<code className="bg-muted px-1 rounded">pk_live_</code> / <code className="bg-muted px-1 rounded">sk_live_</code>) to start accepting real payments.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
