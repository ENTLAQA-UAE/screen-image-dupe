/**
 * Billing domain types.
 */

export type PlanSlug =
  | 'free_trial'
  | 'starter'
  | 'professional'
  | 'enterprise';

export type BillingCycle = 'monthly' | 'annual';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'paused'
  | 'pending_payment';

export type PaymentMethod =
  | 'stripe'
  | 'bank_transfer'
  | 'invoice'
  | 'free_trial'
  | 'complimentary';

export type InvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'void'
  | 'uncollectible'
  | 'pending_transfer';

export type BankTransferRequestStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'paid_confirmed'
  | 'rejected'
  | 'cancelled';

export type ProviderType =
  | 'stripe'
  | 'lemon_squeezy'
  | 'paddle'
  | 'bank_transfer';

export interface Plan {
  id: string;
  slug: PlanSlug;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  priceMonthlyUsd: number | null;
  priceAnnualUsd: number | null;
  currency: string;
  maxAssessments: number;
  maxGroups: number;
  maxUsers: number;
  maxOrganizations: number;
  maxAiQuestionsMonthly: number;
  features: Record<string, unknown>;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
}

export interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  planSlug: PlanSlug;
  planName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  paymentMethod: PaymentMethod;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  manuallyActivatedBy: string | null;
  manuallyActivatedAt: string | null;
  manualActivationNotes: string | null;
  bankTransferReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  subscriptionId: string | null;
  invoiceNumber: string;
  amountUsd: number;
  currency: string;
  taxAmount: number;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  stripeInvoiceId: string | null;
  stripeHostedUrl: string | null;
  pdfUrl: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  dueDate: string | null;
  paidAt: string | null;
  bankTransferReference: string | null;
  notes: string | null;
  createdAt: string;
}

export interface BankTransferRequest {
  id: string;
  organizationId: string;
  requestedBy: string;
  planId: string;
  planSlug: PlanSlug;
  planName: string;
  billingCycle: BillingCycle;
  amountUsd: number;
  companyName: string;
  companyVatNumber: string | null;
  billingEmail: string;
  billingAddress: string | null;
  notes: string | null;
  status: BankTransferRequestStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  proformaInvoiceId: string | null;
  activatedSubscriptionId: string | null;
  createdAt: string;
}

export interface PaymentProvider {
  id: string;
  providerType: ProviderType;
  displayName: string | null;
  isActive: boolean;
  isTestMode: boolean;

  // Stripe fields (secrets never leave the server)
  publishableKey: string | null;
  hasApiKey: boolean;
  hasWebhookSecret: boolean;
  accountId: string | null;

  // Bank transfer fields
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankIban: string | null;
  bankSwift: string | null;
  bankCurrency: string | null;
  bankInstructions: string | null;
  bankInstructionsAr: string | null;

  activatedAt: string | null;
  updatedAt: string;
}
