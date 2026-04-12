import {
  BarChart3,
  Brain,
  Globe,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Auth layout — split-screen: left form, right teal gradient hero.
 * Same pattern as Kawadir ATS login screen.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const features = [
    { icon: Sparkles, text: 'AI-powered question generation' },
    { icon: Users, text: 'Smart team collaboration' },
    { icon: BarChart3, text: 'Advanced analytics & insights' },
    { icon: Shield, text: 'Enterprise-grade security' },
    { icon: Globe, text: 'Multi-language support' },
    { icon: Brain, text: 'Cognitive & personality assessments' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left: Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-white font-bold">
              ق
            </div>
            <div>
              <span className="font-display text-xl font-bold">قدرات</span>
              <span className="mx-1.5 text-muted-foreground">·</span>
              <span className="font-display text-xl font-bold text-primary">
                QUDURAT
              </span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md">{children}</div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          Powered by{' '}
          <span className="font-semibold text-primary">Qudurat</span> ·
          AI-Powered Assessment
        </div>
      </div>

      {/* Right: Gradient hero (hidden on mobile) */}
      <div className="hidden w-1/2 flex-col justify-center bg-gradient-to-br from-teal-500 via-teal-600 to-teal-800 p-12 lg:flex xl:w-[45%]">
        {/* Decorative circle */}
        <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />

        <div className="relative">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white font-bold">
                ق
              </div>
              <span className="font-display text-xl font-bold text-white">
                QUDURAT
              </span>
            </div>
          </div>

          <h2 className="font-display text-4xl font-bold leading-tight text-white xl:text-5xl">
            Smarter Assessments,
          </h2>
          <h2 className="font-display text-4xl font-bold leading-tight text-white/70 xl:text-5xl">
            Powered by AI.
          </h2>

          <p className="mt-4 max-w-md text-lg text-teal-100/80">
            Transform your talent evaluation with intelligent assessments and
            data-driven decisions.
          </p>

          {/* Feature list */}
          <div className="mt-10 space-y-3">
            {features.map((feature) => (
              <div
                key={feature.text}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-white/15"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
                  <feature.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-white">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
