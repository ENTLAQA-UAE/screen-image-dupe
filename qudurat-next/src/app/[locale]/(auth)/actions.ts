'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

// ==============================================================================
// Validation schemas
// ==============================================================================

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name is too long'),
    email: z
      .string()
      .trim()
      .email('Please enter a valid email address')
      .max(255),
    organizationName: z
      .string()
      .trim()
      .min(2, 'Organization name must be at least 2 characters')
      .max(120),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password is too long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

// ==============================================================================
// Action result type
// ==============================================================================

export type ActionResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string>; message?: string };

// ==============================================================================
// Login
// ==============================================================================

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const err of parsed.error.errors) {
      if (err.path[0]) errors[err.path[0] as string] = err.message;
    }
    return { ok: false, errors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      ok: false,
      errors: {},
      message:
        error.message === 'Invalid login credentials'
          ? 'Email or password is incorrect'
          : error.message,
    };
  }

  const locale = (formData.get('locale') as string) ?? 'en';
  redirect(`/${locale}/dashboard`);
}

// ==============================================================================
// Register
// ==============================================================================

export async function registerAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    organizationName: formData.get('organizationName'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const err of parsed.error.errors) {
      if (err.path[0]) errors[err.path[0] as string] = err.message;
    }
    return { ok: false, errors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        organization_name: parsed.data.organizationName,
      },
    },
  });

  if (error) {
    return { ok: false, errors: {}, message: error.message };
  }

  const locale = (formData.get('locale') as string) ?? 'en';
  redirect(`/${locale}/dashboard`);
}

// ==============================================================================
// Forgot password
// ==============================================================================

export async function forgotPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const err of parsed.error.errors) {
      if (err.path[0]) errors[err.path[0] as string] = err.message;
    }
    return { ok: false, errors };
  }

  const supabase = await createClient();
  const locale = (formData.get('locale') as string) ?? 'en';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${appUrl}/${locale}/reset-password` },
  );

  if (error) {
    return { ok: false, errors: {}, message: error.message };
  }

  return { ok: true };
}

// ==============================================================================
// Logout
// ==============================================================================

export async function logoutAction(locale: string = 'en'): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}
