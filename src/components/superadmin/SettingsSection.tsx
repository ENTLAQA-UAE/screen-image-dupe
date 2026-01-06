import { motion } from 'framer-motion';
import { Settings, Shield, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

export function SettingsSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          Platform Settings
        </h1>
        <p className="text-muted-foreground">
          Configure platform-wide settings and feature flags
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Feature Flags
            </CardTitle>
            <CardDescription>Enable or disable platform features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-sm">AI Feedback Generation</p>
                <p className="text-xs text-muted-foreground">Enable AI-generated feedback for assessments</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-sm">AI Talent Snapshot</p>
                <p className="text-xs text-muted-foreground">Generate AI employee talent summaries</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-sm">Allow PDF Downloads</p>
                <p className="text-xs text-muted-foreground">Let employees download their own reports</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-sm">Question Bank Sharing</p>
                <p className="text-xs text-muted-foreground">Allow sharing questions across organizations</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-sm">Maintenance Mode</p>
                <p className="text-xs text-muted-foreground">Block user access during maintenance</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Authentication and security options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-sm">Require Email Verification</p>
                <p className="text-xs text-muted-foreground">Users must verify email before access</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Require 2FA for admin accounts</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-sm">Session Timeout</p>
                <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-sm">IP Whitelisting</p>
                <p className="text-xs text-muted-foreground">Restrict access to specific IPs</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Default Plan Limits
          </CardTitle>
          <CardDescription>Configure default limits for subscription plans</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead className="text-center">Assessments</TableHead>
                <TableHead className="text-center">Participants/Month</TableHead>
                <TableHead className="text-center">HR Admins</TableHead>
                <TableHead className="text-center">AI Credits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Free</TableCell>
                <TableCell className="text-center">
                  <Input type="number" defaultValue={5} className="w-20 mx-auto text-center" />
                </TableCell>
                <TableCell className="text-center">
                  <Input type="number" defaultValue={50} className="w-20 mx-auto text-center" />
                </TableCell>
                <TableCell className="text-center">
                  <Input type="number" defaultValue={1} className="w-20 mx-auto text-center" />
                </TableCell>
                <TableCell className="text-center">
                  <Input type="number" defaultValue={10} className="w-20 mx-auto text-center" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Starter</TableCell>
                <TableCell className="text-center">
                  <Input type="number" defaultValue={25} className="w-20 mx-auto text-center" />
                </TableCell>
                <TableCell className="text-center">
                  <Input type="number" defaultValue={250} className="w-20 mx-auto text-center" />
                </TableCell>
                <TableCell className="text-center">
                  <Input type="number" defaultValue={3} className="w-20 mx-auto text-center" />
                </TableCell>
                <TableCell className="text-center">
                  <Input type="number" defaultValue={50} className="w-20 mx-auto text-center" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Professional</TableCell>
                <TableCell className="text-center">
                  <Input type="number" defaultValue={-1} className="w-20 mx-auto text-center" />
                </TableCell>
                <TableCell className="text-center">
                  <Input type="number" defaultValue={1000} className="w-20 mx-auto text-center" />
                </TableCell>
                <TableCell className="text-center">
                  <Input type="number" defaultValue={10} className="w-20 mx-auto text-center" />
                </TableCell>
                <TableCell className="text-center">
                  <Input type="number" defaultValue={200} className="w-20 mx-auto text-center" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Enterprise</TableCell>
                <TableCell className="text-center">
                  <Input type="number" defaultValue={-1} className="w-20 mx-auto text-center" />
                </TableCell>
                <TableCell className="text-center">
                  <Input type="number" defaultValue={-1} className="w-20 mx-auto text-center" />
                </TableCell>
                <TableCell className="text-center">
                  <Input type="number" defaultValue={-1} className="w-20 mx-auto text-center" />
                </TableCell>
                <TableCell className="text-center">
                  <Input type="number" defaultValue={-1} className="w-20 mx-auto text-center" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-4">
            Use -1 for unlimited. Changes will apply to new organizations only.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
