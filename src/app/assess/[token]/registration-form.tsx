'use client';

import { ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  groupToken: string;
  language: 'en' | 'ar';
}

/**
 * Registration form for public assessment participants.
 *
 * Calls the `register-participant` edge function with the group token.
 * On success, redirects to the actual taker UI (which will be built in
 * Phase 1 Week 5 as a full split of TakeAssessment.tsx).
 */
export function AssessmentRegistrationForm({ groupToken, language }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    employeeCode: '',
    department: '',
    jobTitle: '',
  });

  const isRtl = language === 'ar';
  const labels = isRtl
    ? {
        fullName: 'الاسم الكامل',
        email: 'البريد الإلكتروني',
        employeeCode: 'الرمز الوظيفي',
        department: 'القسم',
        jobTitle: 'المسمى الوظيفي',
        submit: 'ابدأ التقييم',
        error: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
      }
    : {
        fullName: 'Full name',
        email: 'Email',
        employeeCode: 'Employee code',
        department: 'Department (optional)',
        jobTitle: 'Job title (optional)',
        submit: 'Start assessment',
        error: 'Something went wrong. Please try again.',
      };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase config missing');
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/register-participant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
          },
          body: JSON.stringify({
            groupToken,
            ...form,
          }),
        },
      );

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorBody.error ?? labels.error);
      }

      const data = (await response.json()) as { participantId?: string };
      if (data.participantId) {
        // Store participant session in sessionStorage for the taker UI
        sessionStorage.setItem(
          'qudurat.participant',
          JSON.stringify({
            participantId: data.participantId,
            groupToken,
            startedAt: new Date().toISOString(),
          }),
        );
        window.location.href = `/assess/${groupToken}/take`;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : labels.error;
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">{labels.fullName}</Label>
          <Input
            id="fullName"
            required
            value={form.fullName}
            onChange={(e) =>
              setForm((f) => ({ ...f, fullName: e.target.value }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">{labels.email}</Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="employeeCode">{labels.employeeCode}</Label>
        <Input
          id="employeeCode"
          required
          value={form.employeeCode}
          onChange={(e) =>
            setForm((f) => ({ ...f, employeeCode: e.target.value }))
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="department">{labels.department}</Label>
          <Input
            id="department"
            value={form.department}
            onChange={(e) =>
              setForm((f) => ({ ...f, department: e.target.value }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="jobTitle">{labels.jobTitle}</Label>
          <Input
            id="jobTitle"
            value={form.jobTitle}
            onChange={(e) =>
              setForm((f) => ({ ...f, jobTitle: e.target.value }))
            }
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {labels.submit}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </>
        )}
      </Button>
    </form>
  );
}
