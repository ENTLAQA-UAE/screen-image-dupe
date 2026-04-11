# Qudurat — Implementation Plan (Phase-by-Phase)

> Detailed, task-level breakdown of the 16-week transformation from current Jadarat Assess MVP to production-ready Qudurat SaaS.
>
> **Reference**: See `docs/SAAS_READINESS_PLAN.md` for full strategic context.

---

## Overview

```
Phase 1 — Foundation        Weeks 1-6    Security, Next.js migration, CI/CD, billing
Phase 2 — Product           Weeks 7-12   Tenant self-service, email, AI, domains, branding, UI
Phase 3 — Launch            Weeks 13-16  Legal, observability, GTM, production cutover
Phase 4 — Qudurat 2.0      Months 5-9   Differentiators (Skills Passport, CAT, Video, API)
Phase 5 — Qudurat 3.0      Months 10-18 Moat (Internal Mobility, LLM Copilot, Sovereign Cloud)
```

---

# PHASE 1 — FOUNDATION (Weeks 1-6)

> **Goal**: Secure, tested, Next.js-based app deployed to staging with CI/CD and billing.
>
> **Exit Criteria**: All critical security gaps closed. Next.js app running on Vercel staging. CI pipeline green. Stripe/Lemon Squeezy checkout functional.

---

## Week 1 — Security & Cleanup

### Day 1-2: Secret Purge & Git Hygiene

| # | Task | Files/Commands | Done |
|---|---|---|---|
| 1.1.1 | Backup current `.env` values locally (outside repo) | Copy `.env` to `~/.qudurat-env-backup` | [ ] |
| 1.1.2 | Install `git-filter-repo` | `pip install git-filter-repo` | [ ] |
| 1.1.3 | Purge `.env` from entire git history | `git filter-repo --path .env --invert-paths --force` | [ ] |
| 1.1.4 | Force-push cleaned history to all branches | `git push --force --all` | [ ] |
| 1.1.5 | Add `.env*` to `.gitignore` | Add: `.env`, `.env.local`, `.env.*.local`, `.env.production` | [ ] |
| 1.1.6 | Create `.env.example` with placeholder values | Copy structure, replace secrets with `your_xxx_here` | [ ] |
| 1.1.7 | Rotate ALL exposed Supabase keys | Supabase Dashboard → Settings → API → Regenerate | [ ] |
| 1.1.8 | Rotate OpenAI API key | OpenAI Dashboard → API Keys → Create new, revoke old | [ ] |
| 1.1.9 | Rotate any other exposed secrets | Audit `.env` for all keys | [ ] |
| 1.1.10 | Verify no secrets remain in history | `git log --all -p -- .env` should return nothing | [ ] |

### Day 2-3: Edge Function Hardening

| # | Task | Files | Done |
|---|---|---|---|
| 1.2.1 | Enable `verify_jwt = true` on all protected edge functions | `supabase/config.toml` | [ ] |
| 1.2.2 | Keep `verify_jwt = false` ONLY for: `get-assessment`, `submit-assessment` | These are public participant endpoints | [ ] |
| 1.2.3 | Replace `Access-Control-Allow-Origin: *` with explicit origins | All files in `supabase/functions/*/index.ts` | [ ] |
| 1.2.4 | Create allowed-origins config | `supabase/functions/_shared/cors.ts` | [ ] |
| 1.2.5 | Add Zod input validation to every edge function | Each `index.ts` — validate request body with Zod schema | [ ] |
| 1.2.6 | Sanitize error responses (no internal details to client) | Wrap all handlers in try/catch, return generic errors | [ ] |
| 1.2.7 | Test all edge functions manually | Verify JWT-protected ones reject unauthenticated calls | [ ] |

### Day 3-4: Security Headers & Encryption

| # | Task | Files | Done |
|---|---|---|---|
| 1.3.1 | Add security headers to `vercel.json` | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | [ ] |
| 1.3.2 | Migrate `resend_api_key` from plaintext DB to Supabase Vault | `organization_email_settings` table migration | [ ] |
| 1.3.3 | Create Vault helper functions | `lib/secrets/vault.ts` — `storeSecret()`, `retrieveSecret()` | [ ] |
| 1.3.4 | Update any code reading `resend_api_key` to use Vault | Edge functions + any client code | [ ] |
| 1.3.5 | Verify no plaintext secrets remain in any DB table | Audit all tables for `*_key`, `*_secret`, `*_token` columns | [ ] |

### Day 5: Verification

| # | Task | Done |
|---|---|---|
| 1.4.1 | Run full app locally — verify nothing broke | [ ] |
| 1.4.2 | Deploy to Vercel preview — verify headers present | [ ] |
| 1.4.3 | Test edge functions with/without JWT | [ ] |
| 1.4.4 | Confirm `.env` not in git history | [ ] |
| 1.4.5 | Document all rotated keys in team password manager | [ ] |

---

## Week 2 — Next.js 15 Scaffold

### Day 1-2: Project Initialization

| # | Task | Commands/Files | Done |
|---|---|---|---|
| 2.1.1 | Create Next.js 15 project | `npx create-next-app@latest qudurat-next --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` | [ ] |
| 2.1.2 | Configure TypeScript strict mode | `tsconfig.json` — `"strict": true, "noUncheckedIndexedAccess": true` | [ ] |
| 2.1.3 | Install shadcn/ui | `npx shadcn@latest init` — copy existing component configs | [ ] |
| 2.1.4 | Copy all existing shadcn components | From `src/components/ui/*` to new project | [ ] |
| 2.1.5 | Install core dependencies | `@supabase/ssr`, `@supabase/supabase-js`, `next-intl`, `framer-motion`, `@tanstack/react-query`, `zod`, `sonner` | [ ] |
| 2.1.6 | Configure Tailwind with existing theme tokens | Copy `tailwind.config.ts` — colors, fonts, animations | [ ] |
| 2.1.7 | Set up font loading | `next/font/google` — Inter, Sora, Cairo, Noto Sans Arabic | [ ] |
| 2.1.8 | Configure `next.config.js` | Security headers, image domains, redirects | [ ] |

### Day 2-3: Middleware & Auth Infrastructure

| # | Task | Files | Done |
|---|---|---|---|
| 2.2.1 | Create `lib/supabase/client.ts` | Browser client via `createBrowserClient` | [ ] |
| 2.2.2 | Create `lib/supabase/server.ts` | Server Component client via `createServerClient` + cookies | [ ] |
| 2.2.3 | Create `lib/supabase/middleware.ts` | Middleware client for session refresh | [ ] |
| 2.2.4 | Create `lib/tenant/resolve.ts` | Hostname → tenant resolver (edge-cached) | [ ] |
| 2.2.5 | Write `middleware.ts` | Three concerns: tenant resolution → Supabase session → next-intl locale | [ ] |
| 2.2.6 | Configure `next-intl` | `i18n.ts`, `messages/en.json`, `messages/ar.json` (migrate from `translations.ts`) | [ ] |
| 2.2.7 | Create `app/[locale]/layout.tsx` | Root locale layout with `<html lang>`, `dir`, font classes | [ ] |
| 2.2.8 | Create `app/providers.tsx` | `'use client'` — QueryClientProvider, ThemeProvider, BrandingProvider, LanguageProvider | [ ] |

### Day 4-5: First Routes & Verification

| # | Task | Files | Done |
|---|---|---|---|
| 2.3.1 | Create `app/[locale]/(auth)/login/page.tsx` | Migrate login page as first test route | [ ] |
| 2.3.2 | Create `app/[locale]/(auth)/layout.tsx` | Centered card layout for auth pages | [ ] |
| 2.3.3 | Create `app/[locale]/(app)/dashboard/page.tsx` | Basic dashboard as Server Component — fetch data server-side | [ ] |
| 2.3.4 | Create `app/[locale]/(app)/layout.tsx` | App layout with sidebar + header (as `'use client'` component) | [ ] |
| 2.3.5 | Test: login → redirect to dashboard → see server-fetched data | End-to-end auth flow working | [ ] |
| 2.3.6 | Test: Arabic locale (`/ar/dashboard`) renders RTL correctly | Verify dir="rtl", Arabic fonts, mirrored layout | [ ] |
| 2.3.7 | Test: subdomain resolution in middleware | `acme.localhost:3000` resolves to correct org | [ ] |
| 2.3.8 | Keep Vite app running in parallel on different port | Both apps accessible during migration | [ ] |

---

## Week 3 — Migration Wave 1 (Marketing + Auth + Dashboard)

| # | Task | Source (Vite) | Target (Next.js) | Done |
|---|---|---|---|---|
| 3.1 | Landing/marketing page | `src/pages/Index.tsx` | `app/[locale]/(marketing)/page.tsx` (SSG) | [ ] |
| 3.2 | Pricing page | (new) | `app/[locale]/(marketing)/pricing/page.tsx` (SSG) | [ ] |
| 3.3 | Login page | `src/pages/Login.tsx` | `app/[locale]/(auth)/login/page.tsx` | [ ] |
| 3.4 | Register page | `src/pages/Register.tsx` | `app/[locale]/(auth)/register/page.tsx` | [ ] |
| 3.5 | Forgot password | (within auth) | `app/[locale]/(auth)/forgot-password/page.tsx` | [ ] |
| 3.6 | Dashboard | `src/pages/Dashboard.tsx` | `app/[locale]/(app)/dashboard/page.tsx` | [ ] |
| 3.7 | Profile page | `src/pages/Profile.tsx` | `app/[locale]/(app)/profile/page.tsx` | [ ] |
| 3.8 | Add `generateMetadata` to all routes | — | Each `page.tsx` exports metadata with localized title/desc | [ ] |
| 3.9 | Replace all `useNavigate()` with `useRouter()` | — | `next/navigation` imports | [ ] |
| 3.10 | Replace all `<Helmet>` usage | — | `generateMetadata` function | [ ] |
| 3.11 | Verify all migrated pages in EN + AR | — | Manual QA | [ ] |

---

## Week 4 — Migration Wave 2 (Core App Pages)

| # | Task | Source | Target | Done |
|---|---|---|---|---|
| 4.1 | Assessment list | `src/pages/Assessments.tsx` | `app/[locale]/(app)/assessments/page.tsx` | [ ] |
| 4.2 | Create assessment | `src/pages/CreateAssessment.tsx` | `app/[locale]/(app)/assessments/new/page.tsx` | [ ] |
| 4.3 | Assessment detail | `src/pages/AssessmentDetail.tsx` | `app/[locale]/(app)/assessments/[id]/page.tsx` | [ ] |
| 4.4 | Assessment builder | `src/pages/AssessmentBuilder.tsx` (55KB) | `app/[locale]/(app)/assessments/[id]/edit/page.tsx` — **split into sub-components, lazy-load heavy parts** | [ ] |
| 4.5 | Group list | `src/pages/Groups.tsx` | `app/[locale]/(app)/groups/page.tsx` | [ ] |
| 4.6 | Group detail | `src/pages/GroupDetail.tsx` | `app/[locale]/(app)/groups/[id]/page.tsx` | [ ] |
| 4.7 | Employee list | `src/pages/Employees.tsx` | `app/[locale]/(app)/employees/page.tsx` | [ ] |
| 4.8 | Employee profile | `src/pages/EmployeeProfile.tsx` | `app/[locale]/(app)/employees/[id]/page.tsx` | [ ] |
| 4.9 | Results overview | `src/pages/Results.tsx` | `app/[locale]/(app)/results/page.tsx` | [ ] |
| 4.10 | Individual result | `src/pages/ResultDetail.tsx` | `app/[locale]/(app)/results/[id]/page.tsx` | [ ] |
| 4.11 | Take assessment (public) | `src/pages/TakeAssessment.tsx` (83KB) | `app/assess/[token]/page.tsx` — **split into sub-components, lazy-load heavy parts** | [ ] |
| 4.12 | Admin pages | `src/pages/Admin*.tsx` | `app/[locale]/(admin)/*` | [ ] |
| 4.13 | Settings pages | `src/pages/Settings*.tsx` | `app/[locale]/(app)/settings/*` | [ ] |
| 4.14 | PWA migration | `vite-plugin-pwa` | Serwist (`@serwist/next`) | [ ] |
| 4.15 | PDF generation | `html2canvas + jsPDF` | `dynamic(() => import(...), { ssr: false })` | [ ] |
| 4.16 | Full regression test all routes EN + AR | — | Manual QA | [ ] |

---

## Week 5 — Testing & CI/CD

### Testing Setup

| # | Task | Files | Done |
|---|---|---|---|
| 5.1.1 | Install Vitest + React Testing Library + MSW | `package.json` | [ ] |
| 5.1.2 | Configure Vitest | `vitest.config.ts` | [ ] |
| 5.1.3 | Create MSW handlers for Supabase API mocking | `tests/mocks/handlers.ts` | [ ] |
| 5.1.4 | Write unit tests for utility functions | `lib/tenant/resolve.test.ts`, `lib/secrets/vault.test.ts`, etc. | [ ] |
| 5.1.5 | Write unit tests for email/AI provider factories | `lib/email/factory.test.ts`, `lib/ai/factory.test.ts` | [ ] |
| 5.1.6 | Install Playwright | `npx playwright install --with-deps` | [ ] |
| 5.1.7 | Write E2E: signup → onboarding → create assessment | `tests/e2e/onboarding.spec.ts` | [ ] |
| 5.1.8 | Write E2E: participant takes assessment → submits | `tests/e2e/take-assessment.spec.ts` | [ ] |
| 5.1.9 | Write E2E: HR admin views results | `tests/e2e/results.spec.ts` | [ ] |
| 5.1.10 | Write E2E: login/logout in EN + AR | `tests/e2e/auth.spec.ts` | [ ] |

### CI/CD Setup

| # | Task | Files | Done |
|---|---|---|---|
| 5.2.1 | Create `.github/workflows/ci.yml` | Lint → Type-check → Unit tests → Build on every PR | [ ] |
| 5.2.2 | Create `.github/workflows/e2e.yml` | Playwright E2E on PR (against preview deployment) | [ ] |
| 5.2.3 | Create `.github/workflows/deploy-staging.yml` | Auto-deploy to Vercel staging on merge to `main` | [ ] |
| 5.2.4 | Create `.github/workflows/deploy-prod.yml` | Deploy to Vercel production on version tag `v*` | [ ] |
| 5.2.5 | Configure branch protection rules | Require CI pass + 1 review before merge to `main` | [ ] |
| 5.2.6 | Set up Vercel project with preview deployments | Every PR gets a preview URL | [ ] |

---

## Week 6 — Billing Integration

| # | Task | Files | Done |
|---|---|---|---|
| 6.1 | Choose payment processor (Lemon Squeezy or Stripe) | Decision document | [ ] |
| 6.2 | Create `plans` table | Supabase migration | [ ] |
| 6.3 | Create `subscriptions` table | Supabase migration | [ ] |
| 6.4 | Create `invoices` table | Supabase migration | [ ] |
| 6.5 | Create `usage_records` table | Supabase migration | [ ] |
| 6.6 | Seed plans data (Starter, Professional, Enterprise) | Migration seed | [ ] |
| 6.7 | Create checkout Server Action | `app/[locale]/(app)/settings/billing/actions.ts` | [ ] |
| 6.8 | Create webhook handler | `app/api/webhooks/stripe/route.ts` (or lemon-squeezy) | [ ] |
| 6.9 | Handle: checkout.completed | Create subscription record | [ ] |
| 6.10 | Handle: subscription.updated | Update status, plan, period | [ ] |
| 6.11 | Handle: subscription.canceled | Mark canceled, set cancel_at_period_end | [ ] |
| 6.12 | Handle: invoice.paid | Record invoice | [ ] |
| 6.13 | Handle: payment_failed | Email org admin, update status | [ ] |
| 6.14 | Create `check_subscription_limit()` DB function | Supabase migration — server-side enforcement | [ ] |
| 6.15 | Add limit checks to assessment/group/user creation | Edge functions + Server Actions | [ ] |
| 6.16 | Build billing settings page | `app/[locale]/(app)/settings/billing/page.tsx` — current plan, usage, upgrade button, invoice history | [ ] |
| 6.17 | Build pricing page with checkout buttons | `app/[locale]/(marketing)/pricing/page.tsx` | [ ] |
| 6.18 | Implement 14-day free trial flow | Auto-create trial subscription on org signup | [ ] |
| 6.19 | Test full billing cycle: trial → upgrade → payment → invoice | End-to-end in test mode | [ ] |

### Phase 1 Completion Checklist

- [ ] No secrets in git history
- [ ] All edge functions validate JWT (except public endpoints)
- [ ] CORS restricted to known origins
- [ ] Security headers present on all responses
- [ ] Next.js 15 app running on Vercel staging
- [ ] All 20 routes migrated and functional in EN + AR
- [ ] Middleware resolves tenant from hostname
- [ ] CI pipeline runs lint/type-check/test/build on every PR
- [ ] E2E tests cover critical user journeys
- [ ] Billing checkout → subscription → limits working
- [ ] 14-day free trial flow operational

---

# PHASE 2 — PRODUCT (Weeks 7-12)

> **Goal**: Full tenant self-service configuration, email lifecycle, AI integration, domain management, branding, notifications, and premium UI.
>
> **Exit Criteria**: Org admin can configure email provider, AI provider, custom domain, branding, and notifications — all self-serve. HR admin can customize notification templates. UI matches premium design system.

---

## Week 7 — Email Provider System

### Database & Backend

| # | Task | Files | Done |
|---|---|---|---|
| 7.1.1 | Create `tenant_email_providers` table | Supabase migration | [ ] |
| 7.1.2 | Create `tenant_email_logs` table | Supabase migration | [ ] |
| 7.1.3 | Add RLS policies (org_admin only) | Migration | [ ] |
| 7.1.4 | Create `EmailProviderAdapter` interface | `lib/email/types.ts` | [ ] |
| 7.1.5 | Implement `ResendAdapter` | `lib/email/providers/resend.ts` | [ ] |
| 7.1.6 | Implement `MailgunAdapter` | `lib/email/providers/mailgun.ts` | [ ] |
| 7.1.7 | Implement `SendGridAdapter` | `lib/email/providers/sendgrid.ts` | [ ] |
| 7.1.8 | Implement `SesAdapter` | `lib/email/providers/ses.ts` | [ ] |
| 7.1.9 | Implement `PostmarkAdapter` | `lib/email/providers/postmark.ts` | [ ] |
| 7.1.10 | Implement `SmtpAdapter` | `lib/email/providers/smtp.ts` | [ ] |
| 7.1.11 | Create `createEmailProvider()` factory | `lib/email/factory.ts` | [ ] |
| 7.1.12 | Create Vault integration for encrypted credentials | `lib/secrets/vault.ts` | [ ] |

### Email Lifecycle

| # | Task | Files | Done |
|---|---|---|---|
| 7.2.1 | Create email template system | `lib/email/templates/` — HTML templates with variable interpolation | [ ] |
| 7.2.2 | Welcome email template (EN + AR) | `lib/email/templates/welcome.tsx` | [ ] |
| 7.2.3 | Participant invite template | `lib/email/templates/invite.tsx` | [ ] |
| 7.2.4 | Reminder template (T-3d, T-1d, T-4h) | `lib/email/templates/reminder.tsx` | [ ] |
| 7.2.5 | Completion notification template | `lib/email/templates/completion.tsx` | [ ] |
| 7.2.6 | Result ready template | `lib/email/templates/result-ready.tsx` | [ ] |
| 7.2.7 | Trial ending templates (T-7, T-3, T-1) | `lib/email/templates/trial-ending.tsx` | [ ] |
| 7.2.8 | Payment failed template | `lib/email/templates/payment-failed.tsx` | [ ] |
| 7.2.9 | Password reset template | `lib/email/templates/password-reset.tsx` | [ ] |
| 7.2.10 | Wire email send to assessment invite flow | Update group participant creation to trigger invite email | [ ] |
| 7.2.11 | Create reminder cron job | `app/api/cron/reminders/route.ts` — check deadlines, send reminders | [ ] |
| 7.2.12 | Create trial lifecycle cron | `app/api/cron/trial-lifecycle/route.ts` | [ ] |

### Settings UI

| # | Task | Files | Done |
|---|---|---|---|
| 7.3.1 | Email provider settings page | `app/[locale]/(app)/settings/email/page.tsx` | [ ] |
| 7.3.2 | Provider dropdown with dynamic form fields | Client component — shows different fields per provider type | [ ] |
| 7.3.3 | "Send test email" button | Server Action — calls adapter.send() with test message | [ ] |
| 7.3.4 | Email send log viewer | Show last 30 days of sends with status badges | [ ] |
| 7.3.5 | Domain verification status display | Show DKIM/SPF/DMARC records and verification status | [ ] |

---

## Week 8 — AI Provider System

### Database & Backend

| # | Task | Files | Done |
|---|---|---|---|
| 8.1.1 | Create `tenant_ai_providers` table | Supabase migration | [ ] |
| 8.1.2 | Create `tenant_ai_usage` table | Supabase migration | [ ] |
| 8.1.3 | Create `tenant_prompt_templates` table | Supabase migration | [ ] |
| 8.1.4 | Add RLS policies (org_admin only) | Migration | [ ] |
| 8.1.5 | Create `AiProviderAdapter` interface | `lib/ai/types.ts` | [ ] |
| 8.1.6 | Implement `OpenAiAdapter` | `lib/ai/providers/openai.ts` | [ ] |
| 8.1.7 | Implement `AnthropicAdapter` | `lib/ai/providers/anthropic.ts` | [ ] |
| 8.1.8 | Implement `GeminiAdapter` | `lib/ai/providers/gemini.ts` | [ ] |
| 8.1.9 | Implement `AzureOpenAiAdapter` | `lib/ai/providers/azure.ts` | [ ] |
| 8.1.10 | Implement `GroqAdapter` | `lib/ai/providers/groq.ts` | [ ] |
| 8.1.11 | Implement `OllamaAdapter` | `lib/ai/providers/ollama.ts` | [ ] |
| 8.1.12 | Create `createAiProvider()` factory | `lib/ai/factory.ts` | [ ] |

### Refactor Existing AI Features

| # | Task | Files | Done |
|---|---|---|---|
| 8.2.1 | Refactor question generation edge function to use tenant's AI provider | `supabase/functions/generate-questions/index.ts` | [ ] |
| 8.2.2 | Refactor narrative generation to use tenant's AI provider | `supabase/functions/generate-narrative/index.ts` | [ ] |
| 8.2.3 | Refactor talent snapshot to use tenant's AI provider | Related edge functions | [ ] |
| 8.2.4 | Add token/cost tracking to all AI calls | Log to `tenant_ai_usage` after each call | [ ] |
| 8.2.5 | Implement monthly token/cost cap enforcement | Check cap before each AI call, return error if exceeded | [ ] |
| 8.2.6 | Seed default prompt templates | Per use case × per language | [ ] |

### Settings UI

| # | Task | Files | Done |
|---|---|---|---|
| 8.3.1 | AI provider settings page | `app/[locale]/(app)/settings/ai/page.tsx` | [ ] |
| 8.3.2 | Provider dropdown with dynamic form | Different fields per provider (API key, base URL, model picker) | [ ] |
| 8.3.3 | Per-use-case model routing UI | Dropdowns for question gen / narrative / snapshot / group insights | [ ] |
| 8.3.4 | Temperature/max-tokens/top-p sliders | Per use case | [ ] |
| 8.3.5 | "Test AI" button | Server Action — canned prompt, shows response + latency + tokens | [ ] |
| 8.3.6 | Usage dashboard | Token counts, cost estimates, monthly trend chart (Tremor) | [ ] |
| 8.3.7 | Prompt template editor | List templates by use case, edit with variable picker, version history | [ ] |

---

## Week 9 — Domain Management

### Database & Backend

| # | Task | Files | Done |
|---|---|---|---|
| 9.1.1 | Add `subdomain` column to `organizations` table | Supabase migration — `TEXT UNIQUE` | [ ] |
| 9.1.2 | Add `subdomain_changed_at` column | Migration | [ ] |
| 9.1.3 | Create `tenant_custom_domains` table | Migration — domain, verification status, SSL status | [ ] |
| 9.1.4 | Add RLS policies | org_admin only | [ ] |
| 9.1.5 | Backfill existing orgs with subdomain slugs | Migration script — generate from org name | [ ] |

### Subdomain System

| # | Task | Files | Done |
|---|---|---|---|
| 9.2.1 | Subdomain slug validator | `lib/tenant/validators.ts` — length, charset, reserved words, profanity | [ ] |
| 9.2.2 | Real-time uniqueness check API | Server Action — check against DB | [ ] |
| 9.2.3 | Subdomain input field in org settings | With live validation feedback | [ ] |
| 9.2.4 | 30-day change cooldown enforcement | Check `subdomain_changed_at` | [ ] |
| 9.2.5 | Update middleware tenant resolver for subdomains | `lib/tenant/resolve.ts` — parse `{slug}.qudurat.com` | [ ] |

### Custom Domain System

| # | Task | Files | Done |
|---|---|---|---|
| 9.3.1 | Custom domain input UI | `app/[locale]/(app)/settings/domains/page.tsx` | [ ] |
| 9.3.2 | DNS record display (CNAME/A/AAAA instructions) | Show what records to add at registrar | [ ] |
| 9.3.3 | DNS verification polling | Server Action — DNS lookup to verify records | [ ] |
| 9.3.4 | Verification status polling UI | Auto-refresh with status badges (pending/verified/failed) | [ ] |
| 9.3.5 | Vercel Domains API integration for SSL | Auto-provision SSL on verification | [ ] |
| 9.3.6 | Domain verification cron job | `app/api/cron/verify-domains/route.ts` — check pending domains every hour | [ ] |
| 9.3.7 | Update middleware for custom domain resolution | `lib/tenant/resolve.ts` — lookup custom domain → org | [ ] |
| 9.3.8 | Edge cache invalidation on domain add/remove | Clear Redis/Edge Config cache | [ ] |
| 9.3.9 | Cookie scoping per domain | Ensure auth cookies scoped to the correct domain | [ ] |
| 9.3.10 | 301 redirect from old subdomain to new custom domain | Middleware redirect logic | [ ] |

---

## Week 10 — Branding System

### Database & Backend

| # | Task | Files | Done |
|---|---|---|---|
| 10.1.1 | Create `tenant_branding` table | Supabase migration — all branding fields | [ ] |
| 10.1.2 | Add RLS policies | org_admin for write, all org members for read | [ ] |
| 10.1.3 | Create OKLCH color scale generator | `lib/branding/color-scale.ts` | [ ] |
| 10.1.4 | Create CSS variable injection system | `lib/branding/css-vars.ts` — generates `:root {}` from branding config | [ ] |
| 10.1.5 | Edge function/middleware to serve branding CSS per hostname | Cache CSS per tenant, serve in middleware | [ ] |

### Branding Editor UI

| # | Task | Files | Done |
|---|---|---|---|
| 10.2.1 | Branding settings page | `app/[locale]/(app)/settings/branding/page.tsx` | [ ] |
| 10.2.2 | Logo upload (light + dark) with preview | File upload to Supabase Storage, preview in simulated header | [ ] |
| 10.2.3 | Favicon upload | Auto-crop from logo if not provided | [ ] |
| 10.2.4 | Color picker for primary/secondary/accent | Live swatches with auto-generated 50-950 scales | [ ] |
| 10.2.5 | Real-time preview panel | Shows mini-dashboard/buttons/forms with new colors | [ ] |
| 10.2.6 | Font family picker | Dropdown with Latin + Arabic font pairs | [ ] |
| 10.2.7 | Border radius / density pickers | Segmented controls: sharp/rounded/pill, compact/comfortable | [ ] |
| 10.2.8 | Email branding section | Header logo, accent color, footer text, social links | [ ] |
| 10.2.9 | Assessment-taker branding | Welcome/completion copy (EN + AR), CTA URL | [ ] |
| 10.2.10 | White-label toggle | "Powered by Qudurat" show/hide (gated by plan) | [ ] |
| 10.2.11 | Certificate template upload | HTML/PDF template, preview with sample data | [ ] |
| 10.2.12 | Apply branding to assessment-taker pages | `app/assess/[token]` reads tenant branding and applies CSS vars | [ ] |
| 10.2.13 | Apply branding to email templates | Templates pull org branding (logo, colors, footer) | [ ] |

---

## Week 11 — Notification System

### Database & Backend

| # | Task | Files | Done |
|---|---|---|---|
| 11.1.1 | Create `notification_events` table + seed events | Supabase migration | [ ] |
| 11.1.2 | Create `user_notification_preferences` table | Migration | [ ] |
| 11.1.3 | Create `user_email_templates` table | Migration | [ ] |
| 11.1.4 | Create `notification_log` table | Migration | [ ] |
| 11.1.5 | Add RLS policies | Users manage own preferences, org_admin sets org policy | [ ] |
| 11.1.6 | Create notification dispatch service | `lib/notifications/dispatch.ts` — routes event to correct channels | [ ] |
| 11.1.7 | Create digest aggregation cron | `app/api/cron/digests/route.ts` — hourly/daily/weekly digests | [ ] |
| 11.1.8 | In-app notification via Supabase Realtime | Real-time insert to notification channel | [ ] |
| 11.1.9 | Webhook delivery | POST to configured URL with event payload | [ ] |

### Notification Center UI

| # | Task | Files | Done |
|---|---|---|---|
| 11.2.1 | Notification preferences page | `app/[locale]/(app)/notifications/page.tsx` | [ ] |
| 11.2.2 | Event grid with per-event channel toggles | Checkboxes for email/in-app/webhook/slack per event | [ ] |
| 11.2.3 | Digest frequency dropdown per event | realtime/hourly/daily/weekly | [ ] |
| 11.2.4 | Quiet hours configuration | Timezone picker, start/end time pickers | [ ] |
| 11.2.5 | Custom email template editor | Split-pane: editor + live preview | [ ] |
| 11.2.6 | Variable picker (click to insert) | Dropdown with all available variables per event | [ ] |
| 11.2.7 | Bilingual template support (EN + AR tabs) | Tab switcher for language | [ ] |
| 11.2.8 | Reset-to-default button per template | Restore original template | [ ] |
| 11.2.9 | Send log / notification history | Timeline with status badges, filter by event/channel | [ ] |
| 11.2.10 | In-app notification bell in header | Real-time badge count, dropdown list | [ ] |

---

## Week 12 — UI Transformation

### Component Upgrades

| # | Task | Done |
|---|---|---|
| 12.1.1 | Install Tremor — replace dashboard charts with Tremor components | [ ] |
| 12.1.2 | Install cmdk — add ⌘K command palette (search assessments, participants, results) | [ ] |
| 12.1.3 | Install Vaul — replace mobile modals with bottom sheets | [ ] |
| 12.1.4 | Install @dnd-kit — add drag-to-reorder in Assessment Builder | [ ] |
| 12.1.5 | Install TanStack Table — upgrade all data tables (sorting, filtering, column visibility) | [ ] |
| 12.1.6 | Upgrade all loading states to skeleton shimmers | [ ] |
| 12.1.7 | Add empty states with illustrations to all list pages | [ ] |

### Motion System

| # | Task | Done |
|---|---|---|
| 12.2.1 | Add Framer Motion page transitions (fade + slide between routes) | [ ] |
| 12.2.2 | Add stagger reveal animations on dashboard KPI cards | [ ] |
| 12.2.3 | Add number count-up animations on dashboard stats | [ ] |
| 12.2.4 | Add shared layout animations (card → detail expansion) | [ ] |
| 12.2.5 | Add success confirmation animation on assessment submission | [ ] |
| 12.2.6 | Add `prefers-reduced-motion` respect to all animations | [ ] |

### Dark Mode & Themes

| # | Task | Done |
|---|---|---|
| 12.3.1 | Implement dark mode with `next-themes` | [ ] |
| 12.3.2 | Audit all components for dark mode compatibility | [ ] |
| 12.3.3 | Add theme toggle in header | [ ] |
| 12.3.4 | Implement high-contrast accessibility theme | [ ] |

### Accessibility Sweep

| # | Task | Done |
|---|---|---|
| 12.4.1 | Full keyboard navigation audit (every page) | [ ] |
| 12.4.2 | Add skip-navigation links | [ ] |
| 12.4.3 | Add ARIA labels to all interactive elements | [ ] |
| 12.4.4 | Add focus management (trap in modals, restore on close) | [ ] |
| 12.4.5 | Color contrast audit (4.5:1 minimum) | [ ] |
| 12.4.6 | Screen reader testing (NVDA/VoiceOver) | [ ] |

### Phase 2 Completion Checklist

- [ ] Org admin can configure email provider (6 providers) from settings
- [ ] Test email sends successfully through configured provider
- [ ] Email lifecycle operational (invites, reminders, trial emails)
- [ ] Org admin can configure AI provider (10+ providers) from settings
- [ ] AI question generation uses tenant's configured provider
- [ ] AI narrative generation uses tenant's configured provider
- [ ] AI usage tracked with cost estimates
- [ ] Subdomain creation and validation working
- [ ] Custom domain verification and SSL provisioning working
- [ ] Middleware resolves tenants from custom domains
- [ ] Full branding editor operational (logos, colors, fonts, radius)
- [ ] Branding applies to assessment-taker pages and emails
- [ ] Notification preferences configurable per user per event
- [ ] Custom email templates with live preview working
- [ ] In-app notification bell with real-time updates
- [ ] Dashboard uses Tremor charts
- [ ] ⌘K command palette functional
- [ ] Dark mode working
- [ ] WCAG 2.1 AA accessibility compliance

---

# PHASE 3 — LAUNCH (Weeks 13-16)

> **Goal**: Production-ready for paid customers. Legal docs, observability, marketing site, and successful production cutover.
>
> **Exit Criteria**: First paying customer can sign up, configure their tenant, and run real assessments — end to end — on production with full monitoring.

---

## Week 13 — Legal & Compliance

### Legal Documents

| # | Task | Files | Done |
|---|---|---|---|
| 13.1.1 | Engage legal counsel specializing in MENA + GDPR | Contract signed | [ ] |
| 13.1.2 | Draft Terms of Service (EN + AR) | `app/[locale]/(marketing)/terms/page.tsx` | [ ] |
| 13.1.3 | Draft Privacy Policy (EN + AR) | `app/[locale]/(marketing)/privacy/page.tsx` | [ ] |
| 13.1.4 | Draft Data Processing Agreement template | `public/legal/dpa-template.pdf` | [ ] |
| 13.1.5 | Draft Cookie Policy (EN + AR) | `app/[locale]/(marketing)/cookies/page.tsx` | [ ] |
| 13.1.6 | Draft Acceptable Use Policy | `app/[locale]/(marketing)/aup/page.tsx` | [ ] |
| 13.1.7 | Draft Sub-processor list | `app/[locale]/(marketing)/sub-processors/page.tsx` | [ ] |
| 13.1.8 | Legal review of all documents | Legal counsel sign-off | [ ] |

### Compliance Features

| # | Task | Files | Done |
|---|---|---|---|
| 13.2.1 | Cookie consent banner | `components/CookieConsent.tsx` — 3 categories (necessary/analytics/marketing) | [ ] |
| 13.2.2 | Gate PostHog/analytics on consent | Only init after opt-in | [ ] |
| 13.2.3 | Store consent preferences in cookie + DB | For logged-in users | [ ] |
| 13.2.4 | Data export endpoint (GDPR Art. 15) | Server Action — export user data as JSON | [ ] |
| 13.2.5 | Account deletion flow (GDPR Art. 17) | Cascade delete user data, anonymize audit logs | [ ] |
| 13.2.6 | Create `audit_logs` table | Supabase migration | [ ] |
| 13.2.7 | Instrument all sensitive actions with audit logging | Wrap Server Actions with audit trail | [ ] |
| 13.2.8 | Audit log UI for org admins | `app/[locale]/(app)/settings/security/audit/page.tsx` | [ ] |
| 13.2.9 | DSAR (Data Subject Access Request) workflow | Request form + admin response workflow | [ ] |
| 13.2.10 | Breach notification runbook | `docs/runbooks/breach-notification.md` | [ ] |
| 13.2.11 | Sign data processor agreements with sub-processors | Supabase, Vercel, OpenAI, etc. | [ ] |

---

## Week 14 — Observability

### Error Tracking

| # | Task | Files | Done |
|---|---|---|---|
| 14.1.1 | Create Sentry project | Sentry dashboard | [ ] |
| 14.1.2 | Install `@sentry/nextjs` | `package.json` | [ ] |
| 14.1.3 | Run `npx @sentry/wizard -i nextjs` | Auto-config | [ ] |
| 14.1.4 | Configure `sentry.client.config.ts` | Error tracking, session replay (redact PII) | [ ] |
| 14.1.5 | Configure `sentry.server.config.ts` | Server-side error tracking | [ ] |
| 14.1.6 | Configure `sentry.edge.config.ts` | Edge runtime error tracking | [ ] |
| 14.1.7 | Set up `instrumentation.ts` | Sentry init, performance monitoring | [ ] |
| 14.1.8 | Add global error boundary | `app/error.tsx` | [ ] |
| 14.1.9 | Add root error page | `app/global-error.tsx` | [ ] |
| 14.1.10 | Configure source map upload in CI | `.github/workflows/deploy-prod.yml` | [ ] |
| 14.1.11 | Test error reporting | Trigger test error, verify in Sentry | [ ] |

### Product Analytics

| # | Task | Files | Done |
|---|---|---|---|
| 14.2.1 | Create PostHog project | PostHog dashboard | [ ] |
| 14.2.2 | Install `posthog-js` + `posthog-node` | `package.json` | [ ] |
| 14.2.3 | Initialize PostHog client-side (post-consent) | `lib/analytics/posthog-client.ts` | [ ] |
| 14.2.4 | Initialize PostHog server-side | `lib/analytics/posthog-server.ts` | [ ] |
| 14.2.5 | Define event taxonomy | `lib/analytics/events.ts` — typed events | [ ] |
| 14.2.6 | Track key events | signup, login, create_assessment, invite_sent, assessment_completed, upgrade, etc. | [ ] |
| 14.2.7 | Set up feature flags | `lib/analytics/flags.ts` — for gradual rollouts | [ ] |
| 14.2.8 | Configure session recording (with PII masking) | PostHog settings | [ ] |
| 14.2.9 | Build product dashboards in PostHog | Funnel analysis, retention, cohorts | [ ] |

### Infrastructure Monitoring

| # | Task | Done |
|---|---|---|
| 14.3.1 | Enable Vercel Analytics on all routes | [ ] |
| 14.3.2 | Enable Vercel Speed Insights | [ ] |
| 14.3.3 | Set up uptime monitoring (Better Stack or UptimeRobot) | [ ] |
| 14.3.4 | Create status page at `status.qudurat.com` (Instatus) | [ ] |
| 14.3.5 | Set up PagerDuty or Opsgenie for on-call alerts | [ ] |
| 14.3.6 | Configure Sentry alert rules (error rate, performance regressions) | [ ] |
| 14.3.7 | Configure Supabase DB alerts (connection pool, query performance) | [ ] |
| 14.3.8 | Set up structured JSON logging in all edge functions | [ ] |

---

## Week 15 — GTM Assets

### Marketing Site

| # | Task | Files | Done |
|---|---|---|---|
| 15.1.1 | Hero section with animated gradient | `app/[locale]/(marketing)/page.tsx` | [ ] |
| 15.1.2 | Features grid (bento layout) | 6 feature cards with icons | [ ] |
| 15.1.3 | Social proof section | Client logos, stats counter | [ ] |
| 15.1.4 | Pricing table | 3-tier with monthly/annual toggle | [ ] |
| 15.1.5 | Testimonials carousel | Placeholder quotes initially | [ ] |
| 15.1.6 | Footer with legal links, social, newsletter | — | [ ] |
| 15.1.7 | About page | Team, mission, MENA focus story | [ ] |
| 15.1.8 | Contact page | Sales form, support links | [ ] |
| 15.1.9 | Customers / case studies page | Initial placeholders | [ ] |
| 15.1.10 | Documentation landing page | `/docs` with category cards | [ ] |
| 15.1.11 | Blog infrastructure (MDX-based) | `/blog` with post listing | [ ] |
| 15.1.12 | Initial 3 blog posts | Assessment best practices, MENA hiring, Vision 2030 | [ ] |

### SEO

| # | Task | Files | Done |
|---|---|---|---|
| 15.2.1 | `generateMetadata` on every route | Localized title/description/keywords | [ ] |
| 15.2.2 | `hreflang` alternate tags via next-intl | `<link rel="alternate" hreflang="ar">` | [ ] |
| 15.2.3 | `app/sitemap.ts` — locale-aware sitemap | Auto-generated | [ ] |
| 15.2.4 | `app/robots.ts` — robots.txt | Allow crawling, sitemap reference | [ ] |
| 15.2.5 | Dynamic OG images via `@vercel/og` | For blog posts, assessments, orgs | [ ] |
| 15.2.6 | Structured data (JSON-LD) | Organization, SoftwareApplication, FAQ, BreadcrumbList | [ ] |
| 15.2.7 | Submit sitemap to Google Search Console | — | [ ] |
| 15.2.8 | Submit sitemap to Bing Webmaster Tools | — | [ ] |
| 15.2.9 | Core Web Vitals audit | Target all green (LCP<2.5s, FID<100ms, CLS<0.1) | [ ] |
| 15.2.10 | Lighthouse audit on all public pages | Score 95+ | [ ] |

### Onboarding & Docs

| # | Task | Files | Done |
|---|---|---|---|
| 15.3.1 | In-app onboarding tour | `components/OnboardingTour.tsx` — tooltip-based walkthrough | [ ] |
| 15.3.2 | First-run checklist | Create org → invite team → create first assessment → send first invite | [ ] |
| 15.3.3 | User knowledge base (in `/docs`) | 20+ how-to articles | [ ] |
| 15.3.4 | Video tutorials (screen recordings) | Key flows with narration | [ ] |
| 15.3.5 | Email lifecycle final polish | All templates tested end-to-end | [ ] |

---

## Week 16 — Launch Preparation

### Production Cutover

| # | Task | Done |
|---|---|---|
| 16.1.1 | Create production Supabase project | [ ] |
| 16.1.2 | Run all migrations on production DB | [ ] |
| 16.1.3 | Seed production data (plans, notification events, default prompts) | [ ] |
| 16.1.4 | Configure production environment variables in Vercel | [ ] |
| 16.1.5 | Configure production Stripe/Lemon Squeezy account (live mode) | [ ] |
| 16.1.6 | Configure production Resend/Email sending domain with DKIM/SPF/DMARC | [ ] |
| 16.1.7 | Configure production OpenAI/Anthropic API keys | [ ] |
| 16.1.8 | Set up `qudurat.com` domain in Vercel | [ ] |
| 16.1.9 | Configure wildcard DNS `*.qudurat.com` | [ ] |
| 16.1.10 | SSL certificate verification | [ ] |
| 16.1.11 | Final production smoke test | Full user journey in production | [ ] |
| 16.1.12 | DNS cutover from old to new | [ ] |

### Beta & Launch

| # | Task | Done |
|---|---|---|
| 16.2.1 | Recruit 5-10 beta customers | Initial MENA HR teams | [ ] |
| 16.2.2 | Onboard beta customers personally | White-glove setup calls | [ ] |
| 16.2.3 | Create feedback loop (Intercom, surveys) | [ ] |
| 16.2.4 | Monitor Sentry + PostHog daily for issues | [ ] |
| 16.2.5 | Iterate on beta feedback | [ ] |
| 16.2.6 | Build launch announcement (blog post + email) | [ ] |
| 16.2.7 | Prepare press kit (logo, screenshots, boilerplate) | [ ] |
| 16.2.8 | Product Hunt launch preparation | [ ] |
| 16.2.9 | LinkedIn launch post (founder + company) | [ ] |
| 16.2.10 | Soft launch to existing network | Friends & family | [ ] |
| 16.2.11 | Public launch announcement | [ ] |

### Phase 3 Completion Checklist

- [ ] ToS, Privacy Policy, DPA, Cookie Policy, AUP published and legally reviewed
- [ ] Cookie consent banner operational
- [ ] Audit logging capturing all sensitive actions
- [ ] Sentry receiving errors from client/server/edge
- [ ] PostHog tracking key events, dashboards built
- [ ] Uptime monitoring + status page live
- [ ] Marketing site live with EN + AR + SEO
- [ ] Core Web Vitals all green
- [ ] In-app onboarding tour working
- [ ] Production environment fully configured
- [ ] 5-10 beta customers onboarded
- [ ] Public launch announcement published
- [ ] First paying customer acquired

---

# PHASE 4 — QUDURAT 2.0 (Months 5-9)

> **Goal**: Differentiators that separate Qudurat from Evalufy and global competitors.
>
> **Exit Criteria**: Skills Passport, Adaptive CAT, Video Interview, Public API, and 3+ native integrations all shipped.

---

## Month 5 — Skills Passport & Taxonomy

| # | Task | Done |
|---|---|---|
| 17.1 | Import ESCO taxonomy (2700+ skills, EU standard) | [ ] |
| 17.2 | Import SFIA taxonomy (IT/technical skills) | [ ] |
| 17.3 | Map assessment types to skills taxonomy | [ ] |
| 17.4 | Create `skills`, `employee_skills`, `skill_assessments` tables | [ ] |
| 17.5 | Proficiency level scoring (Novice → Expert) | [ ] |
| 17.6 | Longitudinal tracking (skill over time) | [ ] |
| 17.7 | Skills Passport UI on employee profile | [ ] |
| 17.8 | Skills search and filtering | [ ] |
| 17.9 | Export Skills Passport as PDF | [ ] |
| 17.10 | Arabic translations for all skills | [ ] |

---

## Month 6 — Adaptive Cognitive Testing (CAT)

| # | Task | Done |
|---|---|---|
| 18.1 | Implement Item Response Theory (IRT) scoring | [ ] |
| 18.2 | Build question calibration pipeline | [ ] |
| 18.3 | Calibrate initial cognitive question bank (500+ items) | [ ] |
| 18.4 | Create adaptive algorithm (next question based on ability estimate) | [ ] |
| 18.5 | Stopping criteria (confidence interval-based) | [ ] |
| 18.6 | Adaptive assessment type in Assessment Builder | [ ] |
| 18.7 | Real-time difficulty adjustment in TakeAssessment page | [ ] |
| 18.8 | CAT-specific results display (ability estimate, percentile, SE) | [ ] |
| 18.9 | Validation study (compare CAT to fixed-length version) | [ ] |
| 18.10 | Document the psychometric methodology | [ ] |

---

## Month 7 — Video Interview Module

| # | Task | Done |
|---|---|---|
| 19.1 | Integrate video recording (MediaRecorder API) | [ ] |
| 19.2 | Upload to Supabase Storage (or Cloudflare Stream) | [ ] |
| 19.3 | Async one-way interview flow | [ ] |
| 19.4 | Video playback with speed control | [ ] |
| 19.5 | AI transcription (Whisper API, Arabic + English) | [ ] |
| 19.6 | Sentiment analysis on responses | [ ] |
| 19.7 | Key moments detection (pauses, emphasis) | [ ] |
| 19.8 | Video interview template library | [ ] |
| 19.9 | Rating/scoring interface for reviewers | [ ] |
| 19.10 | Share video link with stakeholders | [ ] |

---

## Month 8 — Public API & Webhooks

| # | Task | Done |
|---|---|---|
| 20.1 | Design REST API (OpenAPI 3.0 spec) | [ ] |
| 20.2 | Implement API key management | [ ] |
| 20.3 | Implement API endpoints: assessments, groups, participants, results | [ ] |
| 20.4 | Rate limiting per API key (Upstash Redis) | [ ] |
| 20.5 | Webhook system (configurable event subscriptions) | [ ] |
| 20.6 | Webhook signing (HMAC-SHA256) | [ ] |
| 20.7 | Webhook retry logic with exponential backoff | [ ] |
| 20.8 | API documentation (Swagger UI) | [ ] |
| 20.9 | Developer portal | [ ] |
| 20.10 | SDK libraries (JavaScript, Python) | [ ] |

---

## Month 9 — Native Integrations

| # | Task | Done |
|---|---|---|
| 21.1 | Slack integration (notifications, slash commands) | [ ] |
| 21.2 | Microsoft Teams integration | [ ] |
| 21.3 | Greenhouse ATS connector | [ ] |
| 21.4 | Workday connector | [ ] |
| 21.5 | BambooHR connector | [ ] |
| 21.6 | Zapier integration (for long-tail) | [ ] |
| 21.7 | Integration marketplace UI | [ ] |
| 21.8 | Bias auditing dashboard (adverse impact analysis) | [ ] |
| 21.9 | Gamified assessment variants | [ ] |
| 21.10 | Team composition analytics (skills heatmaps) | [ ] |

---

# PHASE 5 — QUDURAT 3.0 (Months 10-18)

> **Goal**: Moat features that make Qudurat indispensable and hard to replicate.

---

## Months 10-12 — Internal Mobility Engine

| # | Task | Done |
|---|---|---|
| 22.1 | Open role data model (JD, required skills, team) | [ ] |
| 22.2 | Employee-to-role matching algorithm | [ ] |
| 22.3 | Skills gap analysis | [ ] |
| 22.4 | Recommended training paths | [ ] |
| 22.5 | Manager approval workflow | [ ] |
| 22.6 | Anonymous browsing for employees | [ ] |
| 22.7 | Career path visualization | [ ] |
| 22.8 | Success prediction model | [ ] |

---

## Months 13-15 — LLM HR Copilot

| # | Task | Done |
|---|---|---|
| 23.1 | Chat interface with streaming responses | [ ] |
| 23.2 | RAG over assessment results | [ ] |
| 23.3 | Candidate comparison queries | [ ] |
| 23.4 | Hiring recommendations | [ ] |
| 23.5 | Natural language report generation | [ ] |
| 23.6 | Arabic conversational support | [ ] |
| 23.7 | Context-aware suggestions | [ ] |
| 23.8 | Integration with prompt library | [ ] |

---

## Months 16-18 — Sovereign Deployment & Fine-Tuning

| # | Task | Done |
|---|---|---|
| 24.1 | AWS Bahrain region deployment | [ ] |
| 24.2 | Azure UAE North deployment | [ ] |
| 24.3 | Self-hosted Docker/Kubernetes option | [ ] |
| 24.4 | Air-gapped deployment documentation | [ ] |
| 24.5 | Arabic LLM fine-tuning (partner with Falcon/JAIS) | [ ] |
| 24.6 | HR-specific domain fine-tuning | [ ] |
| 24.7 | MENA-specific cultural context training | [ ] |
| 24.8 | SOC 2 Type II audit completion | [ ] |
| 24.9 | ISO 27001 certification | [ ] |
| 24.10 | Enterprise sales enablement (case studies, demos) | [ ] |

---

## Appendix: Dependency Graph

```
Phase 1 (Foundation) ──┬─→ Phase 2 (Product) ──┬─→ Phase 3 (Launch) ──→ PUBLIC LAUNCH
                       │                         │
                       │                         └─→ Phase 4 (2.0) ──→ Phase 5 (3.0)
                       │
                       └─→ (Security, CI/CD, migrations block everything downstream)

Critical Path: Week 1 → 2 → 3-4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16

Can parallelize:
- Weeks 7 & 8 (Email & AI providers) — different engineers
- Weeks 9 & 10 (Domains & Branding) — different engineers
- Weeks 13 & 14 (Legal & Observability) — different workstreams
- Phase 4 features within month (Skills/CAT/Video can run parallel)
```

---

## Appendix: Milestone Gates

| Gate | Week | Criteria to Proceed |
|---|---|---|
| **G1: Security cleared** | End of Week 1 | No secrets in git, keys rotated, headers configured |
| **G2: Next.js scaffold** | End of Week 2 | Middleware working, first route migrated, both apps running |
| **G3: Core migration** | End of Week 4 | All 20 routes migrated, EN + AR functional |
| **G4: CI/CD operational** | End of Week 5 | All tests running, green pipeline, automated deploys |
| **G5: Billing functional** | End of Week 6 | Checkout → subscription → limits enforced |
| **G6: Tenant self-service** | End of Week 11 | Email + AI + Domains + Branding + Notifications all working |
| **G7: UI transformation** | End of Week 12 | Premium UI complete, WCAG AA compliant |
| **G8: Legal ready** | End of Week 13 | All legal documents published and reviewed |
| **G9: Observability ready** | End of Week 14 | Sentry + PostHog + uptime monitoring active |
| **G10: GTM assets ready** | End of Week 15 | Marketing site live, SEO optimized, onboarding tour working |
| **G11: PRODUCTION LAUNCH** | End of Week 16 | Beta customers onboarded, public launch announced |
| **G12: 2.0 Differentiators** | End of Month 9 | Skills Passport, CAT, Video, API all shipped |
| **G13: 3.0 Moat** | End of Month 18 | Internal Mobility, LLM Copilot, Sovereign deploy complete |

---

## Appendix: Daily Standup Structure

For team coordination during implementation:

```
Morning (9:00 AM GST):
1. Yesterday: What got done
2. Today: What's planned (reference task #)
3. Blockers: Any dependencies or questions
4. Phase health: On track for current week's gate?

Weekly Friday Review:
1. Week checklist: Which items completed vs planned
2. Gate status: Are we on track for the milestone gate?
3. Risks surfaced this week
4. Next week's focus
```

---

*This implementation plan is version-controlled alongside the strategic plan. Update task statuses as you progress. Each completed checkbox represents one step closer to launch.*

*Generated for the Qudurat project — April 2026*
