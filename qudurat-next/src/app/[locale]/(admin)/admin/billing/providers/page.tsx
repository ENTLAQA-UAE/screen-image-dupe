import { Building2, CreditCard } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { BankConfigForm } from '@/app/[locale]/(admin)/admin/billing/providers/bank-config-form';
import { StripeConfigForm } from '@/app/[locale]/(admin)/admin/billing/providers/stripe-config-form';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { listPaymentProviders } from '@/lib/domain/billing-queries';

export const metadata: Metadata = {
  title: 'Payment Providers',
};

export default async function PaymentProvidersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const providers = await listPaymentProviders();
  const stripe = providers.find((p) => p.providerType === 'stripe');
  const bank = providers.find((p) => p.providerType === 'bank_transfer');

  return (
    <div className="container max-w-4xl py-10">
      <PageHeader
        title="Payment Providers"
        description="Configure how customers pay for their subscriptions"
      />

      {/* Stripe */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe
              </CardTitle>
              <CardDescription className="mt-1">
                Accept credit and debit card payments via Stripe Checkout
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={stripe?.isActive ? 'success' : 'secondary'}>
                {stripe?.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {stripe?.isTestMode && <Badge variant="warning">Test mode</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <StripeConfigForm
            hasExistingConfig={!!stripe?.hasApiKey}
            publishableKey={stripe?.publishableKey ?? ''}
            accountId={stripe?.accountId ?? ''}
            isTestMode={stripe?.isTestMode ?? true}
            isActive={stripe?.isActive ?? false}
          />
        </CardContent>
      </Card>

      {/* Bank transfer */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Bank Transfer
              </CardTitle>
              <CardDescription className="mt-1">
                Accept wire transfers from enterprise and offline customers.
                Details shown on customer billing page and invoices.
              </CardDescription>
            </div>
            <Badge variant={bank?.isActive ? 'success' : 'secondary'}>
              {bank?.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <BankConfigForm
            bankName={bank?.bankName ?? ''}
            bankAccountName={bank?.bankAccountName ?? ''}
            bankAccountNumber={bank?.bankAccountNumber ?? ''}
            bankIban={bank?.bankIban ?? ''}
            bankSwift={bank?.bankSwift ?? ''}
            bankCurrency={bank?.bankCurrency ?? 'USD'}
            bankInstructions={bank?.bankInstructions ?? ''}
            bankInstructionsAr={bank?.bankInstructionsAr ?? ''}
            isActive={bank?.isActive ?? false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
