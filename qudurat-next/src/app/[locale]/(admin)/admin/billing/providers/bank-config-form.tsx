'use client';

import { Loader2 } from 'lucide-react';
import { useActionState } from 'react';
import { toast } from 'sonner';

import {
  configureBankTransferAction,
  type ProviderConfigResult,
} from '@/app/[locale]/(admin)/admin/billing/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIban: string;
  bankSwift: string;
  bankCurrency: string;
  bankInstructions: string;
  bankInstructionsAr: string;
  isActive: boolean;
}

export function BankConfigForm({
  bankName,
  bankAccountName,
  bankAccountNumber,
  bankIban,
  bankSwift,
  bankCurrency,
  bankInstructions,
  bankInstructionsAr,
  isActive,
}: Props) {
  const [state, formAction, isPending] = useActionState<
    ProviderConfigResult | null,
    FormData
  >(configureBankTransferAction, null);

  if (state?.ok) {
    toast.success('Bank details saved');
  }

  const fieldError = (field: string) =>
    state && !state.ok ? state.errors[field] : undefined;

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && state.message && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="bankName">Bank name</Label>
          <Input
            id="bankName"
            name="bankName"
            required
            defaultValue={bankName}
            placeholder="e.g. Emirates NBD"
            aria-invalid={!!fieldError('bankName')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bankAccountName">Account holder name</Label>
          <Input
            id="bankAccountName"
            name="bankAccountName"
            required
            defaultValue={bankAccountName}
            placeholder="Qudurat LLC"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bankAccountNumber">Account number</Label>
        <Input
          id="bankAccountNumber"
          name="bankAccountNumber"
          required
          defaultValue={bankAccountNumber}
          className="font-mono"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="bankIban">IBAN</Label>
          <Input
            id="bankIban"
            name="bankIban"
            defaultValue={bankIban}
            placeholder="AE07 0331 2345 6789 0123 456"
            className="font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bankSwift">SWIFT / BIC code</Label>
          <Input
            id="bankSwift"
            name="bankSwift"
            defaultValue={bankSwift}
            placeholder="EBILAEAD"
            className="font-mono"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bankCurrency">Primary currency (3-letter code)</Label>
        <Input
          id="bankCurrency"
          name="bankCurrency"
          required
          defaultValue={bankCurrency}
          maxLength={3}
          placeholder="USD"
          className="w-32 uppercase"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bankInstructions">Payment instructions (English)</Label>
        <textarea
          id="bankInstructions"
          name="bankInstructions"
          rows={4}
          defaultValue={bankInstructions}
          placeholder="Include your organization ID in the transfer reference. Email the receipt to billing@qudurat.com after transfer..."
          className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bankInstructionsAr">
          Payment instructions (Arabic)
        </Label>
        <textarea
          id="bankInstructionsAr"
          name="bankInstructionsAr"
          rows={4}
          dir="rtl"
          defaultValue={bankInstructionsAr}
          className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-arabic shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
        />
      </div>

      <label className="flex items-center gap-2 border-t border-border pt-4">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={isActive}
          className="h-4 w-4 rounded border-input text-primary"
        />
        <span className="text-sm font-medium">
          Active (customers can request bank transfer payment)
        </span>
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save bank details
      </Button>
    </form>
  );
}
