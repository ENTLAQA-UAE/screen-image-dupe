# `SAAS_READINESS_PLAN`

The user owns a bilingual (EN/AR) enterprise HR assessment product currently named "Jadarat Assess", which they want rebranded to **Qudurat** (Arabic: قدرات — meaning "capabilities/aptitudes"). The product is feature-complete as an MVP on a Vite + React 18 + Supabase stack with strong multi-tenancy foundations but is **not production-ready** for a paid SaaS launch.

The user has asked for a comprehensive plan that goes well beyond code hygiene and covers:

1. Product rebrand to **Qudurat**
2. **Competitive intelligence** on assessment SaaS market (global + MENA)
3. **New feature opportunities** to empower the product
4. **Premium UI/UX enhancement** to match Linear/Notion/Vercel-tier polish
5. **Technology migration from Vite to Next.js** (App Router, Supabase SSR, server components)
6. Production hardening (security, compliance, billing, testing, observability, legal)
7. Deliverable as a `.md` file committed to the repo for user review

This plan file is being built incrementally as research agents return their findings.

---

## Status of Research

- Initial codebase exploration (agent a0cf33f52725e5d9b — completed)
- Competitive landscape research — global + MENA assessment SaaS, pricing, 2026 feature trends (agent a2966beb3d17ee51d — completed)
- Vite → Next.js 15 migration research — App Router, Supabase SSR, next-intl, Serwist, testing, billing (agent a8cddc38c08bce76e — completed)

All three research streams are complete. Ready to synthesize into the final deliverable.

---

## Deliverables on Approval

1. Create `docs/SAAS_READINESS_PLAN.md` in the project repo with the full rebranded comprehensive plan.
2. Commit on branch `claude/saas-readiness-assessment-p3yw9` with a clear message.
3. Push to `origin/claude/saas-readiness-assessment-p3yw9`.
4. Do NOT open a PR unless the user asks.

---

## Current Codebase Baseline (from Phase 1 exploration)

**Product**: Multi-tenant, bilingual EN/AR enterprise assessment SaaS. Personas: Super Admin → Org Admin → HR Admin → public Employee. Assessment types: cognitive, personality, behavioral, SJT, language, generic quiz/profile.

**Stack**: Vite 5, React 18, TypeScript, React Router v6, Tailwind, shadcn/Radix, Framer Motion, Supabase (Postgres + Auth + Edge Functions + Storage), TanStack Query, vite-plugin-pwa, Vercel deploy.

**Strengths**:

- 20 routes with role-gated `ProtectedRoute` wrapper
- 13 DB tables with comprehensive RLS policies and `SECURITY DEFINER` helper functions (`has_role`, `is_org_admin`, `is_hr_admin`)
- 7 edge functions covering public assessment flow + AI generation + scoring
- Full EN/AR translations (~2000 keys, `src/i18n/translations.ts`)
- RTL layout, font switching (Noto Sans Arabic + Cairo vs Inter + Sora)
- PWA with offline response queueing (`useOfflineSupport`)
- Organization branding context (logo, color, per-org language default)
- Real-time progress dashboard via Supabase Realtime
- Subscription limits framework (client-side only)
- Employee talent snapshots with AI narratives

**Critical Gaps** (ship-blockers):

1. `.env` committed to git; `.gitignore` missing `.env*`
2. No security headers in `vercel.json`
3. `verify_jwt = false` on all edge functions; CORS `*`
4. Plaintext `resend_api_key` in DB
5. No tests, no CI/CD, no error boundary, no Sentry
6. No Stripe integration; subscription limits enforced only client-side
7. No ToS, Privacy Policy, DPA, cookie consent
8. No audit logging
9. No analytics, no structured logging, no web-vitals
10. Resend configured as data model but no send logic
11. `TakeAssessment.tsx` (83KB) and `AssessmentBuilder.tsx` (55KB) not lazy-loaded
12. README unchanged Lovable boilerplate

---

## Final Document Structure — `docs/SAAS_READINESS_PLAN.md`

The deliverable is a single long-form markdown document (~3,500–5,000 lines) that the user can read linearly. It will be organized in twelve parts, each backed by the three research streams already completed. Content summary of what each part will contain:

### Part I — Executive Brief

- Rebrand narrative: "Qudurat" (قدرات — "capabilities/aptitudes") as the MENA-first, bilingual enterprise assessment platform
- One-paragraph positioning, vision, mission statements
- **Readiness Scorecard** (0–5 per dimension): Product, Architecture, Security, Billing, Legal, Observability, Testing, UI/UX, Performance, GTM — with current score and target score
- TL;DR path to launch: 3 phases over ~16 weeks

### Part II — Current State Deep Assessment

- Product feature inventory (extracted from Phase 1 codebase exploration)
- Architecture map: 20 routes, 13 tables, 7 edge functions, Supabase Realtime, PWA offline queue
- **Critical gaps matrix** with severity × effort (from Phase 1 findings)
- File-level issue list (`.env` committed, missing `.env*` in gitignore, `verify_jwt=false`, CORS `*`, plaintext Resend key, 83KB/55KB pages not lazy-loaded, no tests, no CI, etc.)

### Part III — Market Intelligence (MENA-focused)

- **Global competitor profiles**: Mercer|Mettl, Criteria Corp, HireVue, Harver, Pymetrics, TestGorilla, eSkill, HackerRank, Codility, SHL, Hogan, Predictive Index, Plum, Aon cut-e, Thomas International
- **MENA-specific competitors**: Evalufy (direct threat), Talentera, Psytech, Menaitech, Tharwah, Profiles ME
- **Feature matrix** (14 rows × 15+ vendors × ~40 features) showing where Qudurat uniquely wins: Arabic RTL, dialect awareness, MENA data residency, AI narratives, multi-tenancy at mid-market tier
- **2026 trend analysis**: generative AI question generation, adaptive/CAT testing, gamification, deep-fake/cheating detection, skills-based hiring (85% adoption), continuous assessment + internal mobility, fairness auditing (NYC LL144, EU AI Act), LLM HR copilots
- **Pricing intelligence**: per-assessment vs per-seat vs hybrid vs usage; 2024→2026 shift toward credit-based and outcome-based models
- **Sources cited inline** (competitor URLs, research reports)

### Part IV — Product Roadmap (NEW FEATURES)

Three-horizon roadmap with concrete features:

**Qudurat 1.0 (Launch-critical, 0–4 months)**

- Email lifecycle (pluggable provider, see Tenant Self-Service below): invite, reminder, completion, result delivery
- **Tenant self-service configuration suite** (see dedicated section below — this is a first-class Qudurat 1.0 pillar)
- Advanced proctoring (lightweight): tab-switch detection, copy-paste guard, full-screen lock, optional webcam capture
- AI question generation v2 (Arabic-native, fine-tuned prompts, bias filter) — provider-agnostic
- AI narrative reports in Arabic + English (already scaffolded, needs productionizing)
- Assessment templates library (pre-built by role: engineer, sales, customer support, leadership)
- CSV bulk import for participants (exists) + scheduled recurring assessments
- Stripe billing + customer portal
- Server-side limit enforcement

**Qudurat 2.0 (Differentiators, 4–9 months)**

- **Skills Passport** — map assessment results to ESCO/SFIA taxonomy, proficiency levels, longitudinal tracking
- **Adaptive (CAT) cognitive testing** — IRT-based, cut test time 50%
- **Video interview module** — one-way async video, AI transcription + sentiment (Arabic + English)
- **Gamified assessment variants** — for high-volume hiring
- **Team composition analytics** — skills coverage heatmaps, gap analysis
- **Public API + webhooks** — for ATS/HRIS integrations
- **Native integrations**: SAP SuccessFactors MENA, Workday, Oracle HCM, BambooHR, Greenhouse
- **Vision 2030 / HRDF dashboard** — Saudization %, training recommendations
- **White-label / reseller mode** — unlock consultancy partner channel
- **Bias auditing dashboard** — adverse impact analysis, dialect/region fairness

**Qudurat 3.0 (Moat, 9–18 months)**

- **Internal mobility engine** — match employees to open roles via skills + assessment history
- **Continuous assessment** — quarterly re-tests, skill drift tracking
- **Learning path recommendations** — LMS partnerships (Coursera, LinkedIn Learning, local Arabic platforms)
- **LLM HR Copilot** — chat over assessment results, candidate comparisons, hiring recommendations
- **Arabic LLM fine-tuning** — partner with Falcon, AraGPT, or in-house fine-tune for domain language
- **On-prem / sovereign cloud** — for government and conservative enterprise deployments in KSA, UAE

---

### Part IV-A — Tenant Self-Service Configuration (Qudurat 1.0 priority)

This is a dedicated section because it's a core differentiator: **every org admin can fully self-serve their tenant without contacting support**. Five capability pillars:

**1. Email Provider Configuration (per-tenant, swappable)**

- Org admin chooses provider from dropdown: **Resend**, **Mailgun**, **SendGrid**, **Amazon SES**, **Postmark**, or **Direct SMTP** (host/port/user/password/TLS)
- Provider-specific form fields shown dynamically based on selection
- "Send test email" button to verify config before save
- **Abstraction layer**: `EmailProviderAdapter` interface with concrete implementations (`ResendAdapter`, `MailgunAdapter`, `SmtpAdapter`, `SesAdapter`, etc.) — unified `send({ to, from, subject, html, text, replyTo, attachments })` API
- **Fallback chain**: optional secondary provider if primary fails
- **Secrets storage**: API keys encrypted at rest via Supabase Vault (never plaintext in DB — fixes current `resend_api_key` gap) — AES-GCM with org-scoped key derivation
- **Domain verification workflow**: show DKIM/SPF/DMARC records for the chosen `from` domain; verify via DNS lookup before enabling
- **Usage metrics**: per-tenant email send counts, bounce rates, delivery status, surfaced in org settings
- **Send log**: last 30 days of outbound email with status (sent/bounced/complained/failed) and provider response
- **Schema additions**:

```other
tenant_email_providers (
    id, organization_id, provider_type ENUM('resend','mailgun','sendgrid','ses','postmark','smtp'),
    is_primary, is_active, from_email, from_name, reply_to,
    encrypted_credentials JSONB,  -- via Vault
    smtp_host, smtp_port, smtp_secure, smtp_username,  -- for SMTP type
    verified_at, verified_by, last_tested_at, last_test_status,
    created_at, updated_at
  )
  tenant_email_logs (id, organization_id, provider_id, to_email, subject, status, error, sent_at)
```

**2. AI Provider Configuration (per-tenant, for assessment generation & narratives)**

- Org admin chooses provider from dropdown: **OpenAI**, **Anthropic (Claude)**, **Google Gemini**, **Azure OpenAI**, **AWS Bedrock**, **Mistral**, **DeepSeek**, **Groq**, **local/self-hosted (Ollama, vLLM endpoint)**, **Falcon / AraGPT (Arabic-optimized)**
- Per-provider fields: API key, base URL (for Azure/self-hosted), model selection, organization ID (OpenAI)
- **Model picker** per use case: question generation, narrative generation, talent snapshot, group insights — org can route each to a different model if desired (e.g., Claude for narratives, OpenAI for generation)
- **Temperature/max-tokens/top-p** tuning per use case
- **"Test AI" button**: runs a canned prompt and shows response + latency + token count
- **Cost dashboard**: per-tenant token usage, cost estimate (using published provider pricing), monthly cap alerts
- **Abstraction layer**: `AiProviderAdapter` with unified `generateText()`, `generateStructured()`, `generateQuestions()`, `generateNarrative()` methods
- **Prompt library**: org-editable prompt templates per use case (with variables like `{assessmentType}`, `{language}`, `{competency}`)
- **Bring-your-own-key (BYOK) model**: tenant pays the AI provider directly; Qudurat takes no middleman margin on AI costs at Starter/Pro tier. Enterprise tier can use shared Qudurat-managed keys with markup.
- **Schema additions**:

```other
tenant_ai_providers (
    id, organization_id, provider_type ENUM('openai','anthropic','gemini','azure_openai','bedrock','mistral','deepseek','groq','ollama','falcon','custom'),
    is_primary, is_active,
    encrypted_credentials JSONB, base_url, organization_header,
    default_model, question_gen_model, narrative_model, snapshot_model,
    temperature, max_tokens, top_p,
    monthly_token_cap, monthly_cost_cap_usd,
    created_at, updated_at
  )
  tenant_ai_usage (id, organization_id, provider_id, use_case, model, prompt_tokens, completion_tokens, cost_estimate_usd, latency_ms, created_at)
  tenant_prompt_templates (id, organization_id, use_case, language, template_text, variables JSONB, is_active, version, created_at)
```

**3. Domain Management (subdomain + custom domain)**

- **Subdomain creation & validation**: each tenant gets `{slug}.qudurat.com` (or similar) on signup
    - Slug input with real-time validation (length 3–63, DNS-safe, profanity filter, reserved words list: `www`, `api`, `admin`, `app`, `docs`, `blog`, `status`, `cdn`, etc.)
    - Uniqueness check against `organizations.subdomain` column
    - Immediate DNS propagation via wildcard `*.qudurat.com` A/AAAA record pointing to Vercel
    - Can be changed once every 30 days (prevent abuse, keep SEO stable)
- **Custom domain integration** (Professional + Enterprise tiers):
    - Org admin enters `assess.theircompany.com` (or apex `theircompany.com`)
    - **Verification flow**: show required CNAME or A/AAAA record, verify via DNS lookup (with retry + status polling UI)
    - **Auto-SSL**: Let's Encrypt via Vercel Domains API or Cloudflare for SaaS — automatic renewal
    - **Apex domain support**: ALIAS/ANAME or A record via Vercel
    - **Multi-domain**: tenant can attach multiple custom domains (e.g., English + Arabic marketing variants)
    - **Domain routing in Next.js middleware**: extract hostname → lookup tenant → inject `x-tenant-id` header → all server components read tenant from header
    - **Cookie scoping**: auth cookies scoped correctly per domain (not shared across tenants)
    - **Redirect policy**: old subdomain → new custom domain 301
- **Schema additions**:

```other
organizations.subdomain TEXT UNIQUE  -- e.g., "acme" for acme.qudurat.com
  organizations.subdomain_changed_at TIMESTAMPTZ

  tenant_custom_domains (
    id, organization_id, domain TEXT UNIQUE,
    verification_token, verification_record_type, verification_record_value,
    verification_status ENUM('pending','verified','failed','expired'),
    verified_at, ssl_status ENUM('pending','active','failed'), ssl_issued_at,
    is_primary, created_at, updated_at
  )
```

- **Next.js middleware changes** (feeds into Part VI migration plan):

ts

```other
// middleware.ts — hostname-based tenant resolution
  const hostname = request.headers.get('host')!;
  const tenant = await lookupTenantByHostname(hostname);  // edge-cached
  if (!tenant) return NextResponse.rewrite(new URL('/unknown-tenant', request.url));
  const response = NextResponse.next();
  response.headers.set('x-tenant-id', tenant.id);
  response.headers.set('x-tenant-subdomain', tenant.subdomain);
  return response;
```

**4. Organization Branding (org admin self-serve, platform-wide)**

- Extends existing `OrganizationBrandingContext` with full design token editor
- **Brand assets**:
    - Logo upload (light + dark variants, with preview)
    - Favicon upload (auto-generated from logo if not provided)
    - Open Graph / social share image upload
- **Color system**:
    - Primary, secondary, accent, neutral palettes with live swatches
    - Auto-generate full Tailwind-style 50–950 scales from a single seed color (via OKLCH interpolation)
    - Semantic colors (success, warning, danger, info) with override capability
    - Light + dark mode variants
    - Real-time preview panel showing dashboard/buttons/forms with new theme
- **Typography**:
    - Font family picker (Google Fonts subset: Inter, Sora, Cairo, Noto Sans Arabic, IBM Plex Sans Arabic, Tajawal, etc.)
    - Separate Arabic + Latin font assignment
    - Font scale picker (compact/comfortable/spacious)
- **Layout**:
    - Border radius scale (sharp/rounded/pill)
    - Density (compact/comfortable)
- **Email branding**:
    - Header logo, accent color, footer text, social links — applied to all lifecycle emails
    - Per-tenant email template preview
- **Assessment-taker branding**:
    - Custom welcome screen copy (per language)
    - Custom completion screen with optional CTA ("Explore our careers page")
    - Remove/show "Powered by Qudurat" (white-label toggle, Pro+ only)
- **Certificate branding**:
    - Organization can upload a certificate template (PDF or HTML) that auto-fills with participant name, assessment, score, date — issued as a downloadable PDF on completion
- **Distribution**: branding tokens served as CSS variables on the edge, cached per hostname; tenant switches reflect instantly
- **Schema additions**:

```other
tenant_branding (
    id, organization_id,
    logo_light_url, logo_dark_url, favicon_url, og_image_url,
    color_primary, color_secondary, color_accent, color_palettes JSONB,
    font_latin, font_arabic, font_scale, density,
    border_radius_scale,
    email_header_logo_url, email_accent_color, email_footer_text, email_social_links JSONB,
    assess_welcome_copy_en, assess_welcome_copy_ar,
    assess_completion_copy_en, assess_completion_copy_ar,
    assess_completion_cta_url,
    show_powered_by BOOLEAN,  -- white-label toggle
    certificate_template_url, certificate_enabled BOOLEAN,
    updated_at, updated_by
  )
```

**5. HR Admin — Notification Customization (user-level, within org policy)**

- Org admin sets the envelope of what's customizable (policy); HR admin tunes within that
- **Event-level toggles** (per HR admin):
    - Participant invited / reminder / started / completed / abandoned
    - Group assessment launched / 80% complete / closed
    - Low score threshold breached
    - Billing / plan / usage alerts
    - AI generation finished
    - New team member joined org
- **Delivery channels** per event: email, in-app, webhook, Slack (via Slack app), Microsoft Teams (Pro+)
- **Digest options**: real-time, hourly digest, daily digest, weekly summary
- **Quiet hours**: timezone-aware, no notifications during selected hours
- **Custom email template editor**:
    - HR admin can edit subject + body for each event
    - Variable picker (`{participant_name}`, `{assessment_title}`, `{score}`, `{completion_time}`, etc.)
    - Live preview with sample data
    - Bilingual templates (EN + AR, with auto-fall-through)
    - Reset-to-default button
- **Send log per user**: HR admin sees their own notification history + delivery status
- **Schema additions**:

```other
notification_events (id, event_key TEXT UNIQUE, category, default_channels TEXT[], description_en, description_ar)
  user_notification_preferences (
    id, user_id, organization_id, event_key,
    channels TEXT[],  -- ['email','in_app','slack']
    digest_frequency ENUM('realtime','hourly','daily','weekly'),
    quiet_hours_start, quiet_hours_end, timezone,
    is_enabled, updated_at
  )
  user_email_templates (
    id, user_id, organization_id, event_key, language,
    subject, body_html, body_text, is_active, version, updated_at
  )
  notification_log (id, user_id, event_key, channel, status, sent_at, metadata JSONB)
```

**Settings UI hierarchy** (new surface in the app):

```other
Organization Settings  (org admin only)
├── Branding            (Section 4 above)
├── Email Providers     (Section 1)
├── AI Providers        (Section 2)
├── Domains             (Section 3)
├── Members & Roles
├── Billing
└── Security & Audit

My Notifications       (every user, scoped to HR admin+ for most events)
├── Event Preferences   (Section 5)
├── Custom Templates
├── Delivery Channels
└── Send History
```

**Security notes for Part IV-A**

- All secrets (email API keys, AI API keys, SMTP passwords) **must** go through Supabase Vault or a hosted KMS — never plaintext DB columns
- RLS policies restrict `tenant_email_providers`, `tenant_ai_providers`, `tenant_custom_domains` to `org_admin` of that org only
- Audit log entries for: provider added/changed/removed, domain verified/unverified, branding changed, notification template edited
- Rate limiting on "Test email" and "Test AI" buttons to prevent cost abuse
- Domain verification tokens rotate every 7 days if unverified

### Part V — Premium UI/UX Transformation

Complete redesign direction targeting Linear/Stripe/Notion/Vercel-tier polish:

**Brand system**

- Logo refresh direction (Qudurat wordmark in Arabic + Latin)
- Color tokens: primary (deep indigo or emerald for MENA-trust), accent, semantic
- Typography: Inter + Sora (Latin), Cairo + Noto Sans Arabic (Arabic)
- Spacing/radius/elevation scale
- Light + dark mode native

**Component stack upgrade**

- shadcn/ui (Radix) — keep as base
- **Tremor** (Vercel-acquired) for dashboards and charts
- **Aceternity UI / Magic UI** for landing page hero blocks and motion
- **Framer Motion 12** for page transitions, stagger reveals, shared layout animations
- **Vaul** for mobile drawer sheets
- **cmdk** for command palette (⌘K)
- **Sonner** for premium toasts (already present)
- **TanStack Table** for data grids
- **react-aria** for a11y baseline

**Key screen redesigns** (before/after narrative for each)

1. Marketing landing (hero with animated gradient, social proof, live stats, pricing table, testimonials, multilingual)
2. Dashboard (Tremor charts, real-time KPIs, activity feed, skeleton loading, empty states)
3. Assessment Builder (drag-to-reorder via `@dnd-kit`, live preview, inline AI generation, split-pane)
4. Assessment Taker (distraction-free mode, progress orb, smooth transitions, mobile-first thumb-zone buttons, RTL-perfect)
5. Results/Reports (animated narrative reveal, comparison views, branded PDF)
6. **Organization Settings hub** — tabbed layout for Branding / Email Providers / AI Providers / Domains / Members / Billing / Security — dropdown-driven provider config, live test buttons, DNS verification status chips (ties to Part IV-A)
7. **User notification center** — event grid, per-event channel toggles, custom template editor with live preview, send log timeline (ties to Part IV-A Section 5)
8. Super Admin console (dense data tables, global search, audit log timeline, cross-tenant domain registry)

**Motion & micro-interactions**

- Page transitions, shared element, number counters
- Subtle success confirmations
- Skeletons for every async boundary
- Accessibility-respecting `prefers-reduced-motion`

**Accessibility**

- Full WCAG 2.1 AA compliance sweep
- Keyboard + screen-reader QA
- High-contrast theme

### Part VI — Technology Migration: Vite → Next.js 15 (App Router)

Explicit rationale and step-by-step plan:

**Why Next.js 15 for Qudurat**

- SSR/SSG for marketing pages (SEO critical in MENA and English markets)
- Per-route `generateMetadata` with `hreflang` for bilingual SEO
- Server Components = smaller client bundles + secret isolation
- Server Actions replace ad-hoc API routes for mutations
- Middleware for tenant subdomain routing and auth session refresh
- Native Turbopack dev speed in v15
- First-class `next-intl` for locale-prefixed routing (`/en/...`, `/ar/...`)
- First-class `@supabase/ssr` package
- Streaming + Suspense = better perceived performance
- Vercel deployment remains zero-config

**Target architecture**

- Route groups: `(marketing)`, `(auth)`, `(app)`, `(assess)`, `(admin)`
- `app/[locale]/` for i18n
- `middleware.ts` performs **three concerns in order**:
    1. **Hostname-based tenant resolution** (subdomain `acme.qudurat.com` or custom domain `assess.acme.com` → `organization_id`, via edge-cached lookup). This directly powers the Domain Management feature in Part IV-A.
    2. **Supabase session refresh** (via `@supabase/ssr`)
    3. **Locale detection & routing** (via `next-intl`)
- **Edge-cached tenant resolver**: `lib/tenant/resolve.ts` uses Vercel Edge Config or Upstash Redis to avoid DB hits on every request; invalidated on custom-domain add/remove
- `lib/supabase/{client,server,middleware}.ts` split
- `lib/email/providers/{resend,mailgun,smtp,sendgrid,ses,postmark}.ts` — adapters implementing `EmailProviderAdapter` (Part IV-A Section 1)
- `lib/ai/providers/{openai,anthropic,gemini,azure,bedrock,mistral,deepseek,groq,ollama,falcon}.ts` — adapters implementing `AiProviderAdapter` (Part IV-A Section 2)
- `lib/secrets/vault.ts` — Supabase Vault wrapper for encrypted credentials
- Server Actions in `actions.ts` colocated with routes
- API routes reserved for Stripe/Lemon Squeezy webhooks, OAuth callbacks, and tenant domain verification cron
- `instrumentation.ts` for Sentry + PostHog init
- `generateMetadata` on every route; marketing routes pull tenant branding from hostname for white-label OG images

**Migration strategy: incremental (4 phases, ~6 weeks)**

1. **Week 1 — Scaffold**: fresh Next.js 15 project alongside Vite, set up Tailwind, shadcn, next-intl, Supabase SSR, middleware. Keep Vite app running in parallel.
2. **Week 2 — Infra**: Providers tree, auth middleware, RLS-aware server client, test one simple Server Component + one Server Action end-to-end.
3. **Weeks 3–4 — Page migration**: route by route, starting with marketing/landing, then auth, then dashboard, then assessment flows. Each page: convert React Router → file-based, replace Helmet → `generateMetadata`, move data fetching to Server Components where safe, keep interactive parts as `'use client'`.
4. **Week 5 — Specialized migration**: PWA (vite-plugin-pwa → Serwist), PDF generation (keep as client-only dynamic import), i18n (`src/i18n/translations.ts` → `messages/en.json` + `messages/ar.json`), env var rename (`VITE_*` → `NEXT_PUBLIC_*`).
5. **Week 6 — Cutover**: QA, dual-deploy staging, Vercel production cutover, retire Vite build.

**Concrete conversion reference** (full code examples in the document):

- React Router `/assess/:token` → `app/assess/[token]/page.tsx`
- `useNavigate` → `useRouter` from `next/navigation`
- `useParams` → destructure `params` prop (server) or `useParams()` (client)
- `<Helmet>` → `export async function generateMetadata()`
- `src/integrations/supabase/client.ts` → `lib/supabase/client.ts` + `lib/supabase/server.ts`
- Context providers → `'use client'` wrapper in `app/providers.tsx`
- `localStorage` reads → guard with `useEffect` or dynamic `{ ssr: false }`
- `html2canvas` + `jsPDF` → dynamic import in client component only

**Deployment + data residency**

- Vercel primary (Frankfurt region for MENA proximity)
- Supabase Frankfurt region
- Roadmap for sovereign deployment (AWS Bahrain, Azure UAE) for KSA/UAE PDPL requirements
- CDN assets via Vercel; storage via Supabase Storage or Cloudflare R2 for cheaper egress

### Part VII — Production Hardening

- **Security headers** via `next.config.js` headers() + middleware: CSP (report-only then enforced), HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Edge function hardening**: re-enable `verify_jwt` where possible, tighten CORS to known origins, add rate limiting via Upstash Redis, input validation with Zod in every function
- **Secret cleanup**: `git filter-repo` to purge `.env` from history, rotate Supabase keys, move Resend key from DB to Supabase Vault
- **Audit logging table**: `audit_logs(org_id, actor_id, action, target_type, target_id, metadata, created_at)` with RLS and UI
- **Testing stack**: Vitest + React Testing Library (unit) + Playwright (E2E) + MSW (Supabase mock) + Storybook 8 (component isolation)
- **CI/CD** (`.github/workflows/`): `ci.yml` (lint/type/test/build on PR), `deploy-staging.yml` (auto merge to main → staging), `deploy-prod.yml` (manual tag → prod), Supabase migration workflow
- **Observability**: Sentry (errors + performance + session replay), PostHog (product analytics + feature flags + session recording), Vercel Analytics + Speed Insights, OpenTelemetry traces, structured JSON logging in edge functions

### Part VIII — Monetization

- **Stripe vs Lemon Squeezy vs Paddle** comparison matrix — recommend **Lemon Squeezy or Paddle** (Merchant of Record) for MENA VAT complexity (KSA, UAE, Egypt each different), fallback Stripe if enterprise requires direct invoicing
- **Plan structure** (USD):
    - Starter $349/mo: 500 assessments/mo, 1 org, basic reports
    - Professional $999/mo: unlimited, 3 orgs, white-label basic, AI narratives
    - Enterprise custom: unlimited, 10+ orgs, full white-label, API, video interviews, SSO, dedicated success, region-locked deployment
    - Add-ons: AI narratives premium (+$150), video module (+$250), advanced proctoring (+$100), SAP SuccessFactors connector (+$200)
- **14-day free trial** with lifecycle emails at T-7, T-3, T-1
- **Server-side limit enforcement**: DB trigger + edge function guard on assessments/groups/participants/user_roles inserts
- **Webhook handlers** (API routes, not Server Actions): checkout completed, subscription updated/cancelled, payment failed, invoice paid
- **Billing DB schema**: `subscriptions`, `invoices`, `usage_records`, `plans` tables

### Part IX — Legal & Compliance

- Draft templates for ToS, Privacy Policy, DPA, Cookie Policy, Sub-processor list, Acceptable Use Policy
- **GDPR**: data export, right to deletion, consent tracking, breach notification runbook
- **Saudi PDPL + UAE DDLNP**: data residency commitments, cross-border transfer clauses, SDAIA registration guidance
- **Cookie consent banner** gating all non-essential storage
- **Audit logging UI** for org admins (compliance evidence)
- **Certifications roadmap**: SOC 2 Type I → Type II → ISO 27001 (12–18 month horizon)

### Part X — Go-to-Market Enablers

- **Email lifecycle** via Resend (templates exist in DB, need wiring): welcome, invite, reminder, completion, renewal, trial-ending, password reset
- **Marketing site** with Arabic + English locales, blog, pricing, case studies, testimonials
- **SEO**: `hreflang` via next-intl, sitemap per locale, OG images via `@vercel/og`, structured data
- **Docs**: architecture guide, API reference, user knowledge base, in-app onboarding tour
- **Support stack**: Intercom or HelpScout, status page (Instatus), Discord/community

### Part XI — Execution Roadmap

- **16-week phased timeline** with exit criteria per phase
- **Team structure recommendation**: minimum viable team (1 full-stack, 1 designer, 1 PM) vs ideal team (3 FE, 1 BE, 1 designer, 1 PM, 1 DevOps, 1 QA)
- **Budget buckets**: tooling (Sentry/PostHog/Resend/Stripe fees), legal, design, infra, certifications
- **Risk register**: Evalufy competitive response, Arabic LLM quality, MENA sales cycle length, migration regressions

### Part XII — Appendices

- A. File-level issue list (paths + line numbers from Phase 1)
- B. Migration checklist (Vite → Next.js task-by-task)
- C. Competitor feature matrix (wide table)
- D. UI reference gallery (Linear, Stripe, Notion, Vercel, Attio as inspiration)
- E. Glossary (PDPL, DDLNP, HRDF, Vision 2030, CAT, IRT, RLS, SSR, RSC, etc.)
- F. Source references

## Critical File to Create

**Only one file will be written** on the project side:

- `/home/user/screen-image-dupe/docs/SAAS_READINESS_PLAN.md` — the full comprehensive plan described above

No code changes, no config changes, no dependency updates — this is a **pure documentation deliverable** for user review. Implementation of any part of the plan requires explicit user approval afterward.

## Git Actions on Approval

1. `git add docs/SAAS_READINESS_PLAN.md`
2. `git commit -m "docs: add comprehensive SaaS readiness plan for Qudurat"` (with Claude Code signature)
3. `git push -u origin claude/saas-readiness-assessment-p3yw9`
4. Report commit hash and branch URL to user
5. Do **not** open a PR (per user instructions and default policy)

## Verification

1. `ls -la docs/SAAS_READINESS_PLAN.md` confirms file exists
2. `grep -c "Qudurat" docs/SAAS_READINESS_PLAN.md` returns a high count
3. `grep -i "jadarat" docs/SAAS_READINESS_PLAN.md` returns zero matches (rebrand is clean)
4. `git log -1 --oneline` shows the new commit
5. `git push` succeeds on the designated branch
6. User reads the document and provides feedback; no implementation until feedback is incorporated.

main