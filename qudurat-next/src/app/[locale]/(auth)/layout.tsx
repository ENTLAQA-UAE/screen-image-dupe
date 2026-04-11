import type { ReactNode } from 'react';

/**
 * Auth layout — centered card for login, register, password reset.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary-50/20 p-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
