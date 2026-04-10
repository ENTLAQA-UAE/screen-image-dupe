# Qudurat (قدرات) — Comprehensive SaaS Readiness & Transformation Plan

> **From MVP to Enterprise-Grade, MENA-First Assessment Platform**
>
> This document is the complete strategic, architectural, and execution blueprint for transforming the current "Jadarat Assess" codebase into **Qudurat** — a premium, bilingual (Arabic + English), multi-tenant HR assessment SaaS product ready for paid enterprise customers across the MENA region and beyond.

---

## Table of Contents

- [Part I — Executive Brief](#part-i--executive-brief)
- [Part II — Current State Deep Assessment](#part-ii--current-state-deep-assessment)
- [Part III — Market Intelligence (MENA-focused)](#part-iii--market-intelligence-mena-focused)
- [Part IV — Product Roadmap (New Features)](#part-iv--product-roadmap-new-features)
- [Part IV-A — Tenant Self-Service Configuration](#part-iv-a--tenant-self-service-configuration)
- [Part V — Premium UI/UX Transformation](#part-v--premium-uiux-transformation)
- [Part VI — Technology Migration: Vite to Next.js 15](#part-vi--technology-migration-vite-to-nextjs-15)
- [Part VII — Production Hardening](#part-vii--production-hardening)
- [Part VIII — Monetization](#part-viii--monetization)
- [Part IX — Legal & Compliance](#part-ix--legal--compliance)
- [Part X — Go-to-Market Enablers](#part-x--go-to-market-enablers)
- [Part XI — Execution Roadmap](#part-xi--execution-roadmap)
- [Part XII — Appendices](#part-xii--appendices)

---

## Part I — Executive Brief

### The Rebrand: Why "Qudurat"

**Qudurat** (قدرات) means "capabilities" or "aptitudes" in Arabic — a word that resonates deeply across the Gulf, Levant, and North Africa. It positions the product as:

- **Arabic-native by design**, not an afterthought localization
- **Capability-focused**, aligning with the skills-based hiring movement
- **Culturally anchored** in the MENA talent ecosystem (Saudi Vision 2030, UAE NAFIS, Oman Tawteen)

The rebrand is not cosmetic — it signals a product that understands Arabic dialects, RTL-first interfaces, MENA data residency requirements, and Gulf enterprise procurement cycles.

### Positioning Statement

> **Qudurat** is the MENA-first, bilingual enterprise assessment platform that empowers HR teams to evaluate talent through cognitive, personality, behavioral, and skills-based assessments — powered by AI-generated content, real-time analytics, and enterprise-grade multi-tenancy.

### Vision

To become the default assessment infrastructure for every organization hiring, developing, or mobilizing talent in the Arabic-speaking world — and beyond.

### Mission

Deliver a secure, beautiful, AI-augmented assessment experience that respects linguistic nuance, cultural context, and data sovereignty — while matching the product quality of the world's best SaaS tools.

### Readiness Scorecard

| Dimension | Current (0-5) | Target (0-5) | Gap | Priority |
|---|---|---|---|---|
| **Product Features** | 3.5 | 4.5 | 1.0 | High |
| **Architecture** | 3.0 | 4.5 | 1.5 | Critical |
| **Security** | 1.0 | 4.5 | 3.5 | Critical |
| **Billing & Monetization** | 0.0 | 4.0 | 4.0 | Critical |
| **Legal & Compliance** | 0.0 | 4.0 | 4.0 | Critical |
| **Observability** | 0.5 | 4.0 | 3.5 | High |
| **Testing** | 0.0 | 4.0 | 4.0 | High |
| **UI/UX Polish** | 2.5 | 4.5 | 2.0 | High |
| **Performance** | 2.0 | 4.0 | 2.0 | Medium |
| **Go-to-Market** | 0.5 | 3.5 | 3.0 | High |

**Overall SaaS Readiness: 1.3 / 5.0** — significant work required across security, billing, legal, testing, and observability before paid launch.

### Path to Launch: 3 Phases over ~16 Weeks

1. **Phase 1 (Weeks 1-6)**: Foundation — Security hardening, Next.js migration, CI/CD, testing scaffold, secret cleanup, billing integration
2. **Phase 2 (Weeks 7-12)**: Product — Tenant self-service (email/AI/domain/branding), email lifecycle, proctoring, template library, UI transformation
3. **Phase 3 (Weeks 13-16)**: Launch — Legal docs, observability, GTM assets, marketing site, beta program, production cutover

---

## Part II — Current State Deep Assessment

### 2.1 Product Feature Inventory

The current codebase implements a surprisingly complete assessment platform:

**Assessment Engine**
- 6 assessment types: Cognitive, Personality, Behavioral, Situational Judgment (SJT), Language Proficiency, Generic (quiz/profile)
- Question types: multiple choice, Likert scale, true/false, text response, rating scale
- Timer support with configurable time limits per assessment
- Randomized question ordering
- Progress tracking with real-time sync via Supabase Realtime

**AI Integration**
- AI question generation via OpenAI (edge function: `generate-questions`)
- AI scoring/evaluation (edge function: `evaluate-assessment`)
- AI narrative reports — talent snapshots with natural language summaries
- Group assessment insights — aggregate analysis across participants

**Multi-Tenancy**
- Organization-scoped data isolation via Supabase RLS
- Role hierarchy: Super Admin > Org Admin > HR Admin > Employee
- `SECURITY DEFINER` helper functions: `has_role()`, `is_org_admin()`, `is_hr_admin()`
- Per-org branding (logo, colors, language preference) via `OrganizationBrandingContext`

**Participant Management**
- CSV bulk import for participants
- Assessment group management (create group, assign assessments, track progress)
- Public assessment links with token-based access (no login required for takers)
- Real-time completion tracking dashboard

**Internationalization**
- Full EN/AR translations (~2,000 keys in `src/i18n/translations.ts`)
- RTL layout support with automatic direction switching
- Arabic font stack: Noto Sans Arabic + Cairo
- Latin font stack: Inter + Sora

**PWA & Offline**
- Progressive Web App via `vite-plugin-pwa`
- Offline response queueing (`useOfflineSupport` hook)
- Service worker with caching strategies

**Reporting**
- Individual assessment results with score breakdowns
- PDF report generation via `html2canvas` + `jsPDF`
- Employee talent snapshots (AI-generated narratives)
- Group-level analytics and comparisons

### 2.2 Architecture Map

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel (Hosting)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Vite + React 18 SPA                       │  │
│  │  20 Routes (React Router v6)                          │  │
│  │  shadcn/ui + Tailwind + Framer Motion                 │  │
│  │  TanStack Query (data fetching)                       │  │
│  │  PWA (vite-plugin-pwa)                                │  │
│  └───────────────────┬───────────────────────────────────┘  │
│                      │                                       │
└──────────────────────┼───────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────┼───────────────────────────────────────┐
│                Supabase (Backend)                             │
│  ┌───────────────────┴───────────────────────────────────┐  │
│  │                   Auth (GoTrue)                        │  │
│  │         Email/Password + Magic Link                    │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                       │  │
│  │  13 Tables with RLS Policies                          │  │
│  │  organizations, profiles, user_roles,                 │  │
│  │  assessments, assessment_questions, questions,         │  │
│  │  assessment_groups, group_participants,                │  │
│  │  participant_responses, assessment_results,            │  │
│  │  organization_email_settings,                         │  │
│  │  organization_subscription_limits,                    │  │
│  │  employee_talent_snapshots                            │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Edge Functions (Deno)                     │  │
│  │  generate-questions    (AI question creation)         │  │
│  │  evaluate-assessment   (AI scoring)                   │  │
│  │  submit-assessment     (public submission)            │  │
│  │  get-assessment        (public assessment fetch)      │  │
│  │  generate-talent-snapshot (AI narratives)             │  │
│  │  generate-group-insights  (aggregate AI analysis)     │  │
│  │  send-assessment-email    (email dispatch)            │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Realtime                                  │  │
│  │  participant_responses channel (live progress)         │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Storage                                   │  │
│  │  organization-logos bucket                             │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Route Map (20 Routes)

| Route | Access | Description |
|---|---|---|
| `/` | Public | Marketing landing page |
| `/auth` | Public | Login / Register |
| `/dashboard` | Authenticated | Main dashboard (role-dependent) |
| `/assessments` | HR Admin+ | Assessment list |
| `/assessments/new` | HR Admin+ | Create assessment |
| `/assessments/:id` | HR Admin+ | Assessment detail |
| `/assessments/:id/edit` | HR Admin+ | Edit assessment |
| `/assessment-groups` | HR Admin+ | Group management |
| `/assessment-groups/new` | HR Admin+ | Create group |
| `/assessment-groups/:id` | HR Admin+ | Group detail & progress |
| `/employees` | HR Admin+ | Employee directory |
| `/employees/:id` | HR Admin+ | Employee profile & talent snapshot |
| `/results` | HR Admin+ | Results overview |
| `/results/:id` | HR Admin+ | Individual result detail |
| `/settings` | Org Admin+ | Organization settings |
| `/subscription` | Org Admin+ | Subscription management |
| `/admin` | Super Admin | Super admin console |
| `/assess/:token` | Public | Take assessment (public link) |
| `/assess/:token/complete` | Public | Assessment completion page |
| `/profile` | Authenticated | User profile |

### 2.4 Critical Gaps Matrix

| # | Issue | Severity | Effort | Category |
|---|---|---|---|---|
| 1 | `.env` committed to git history | **Critical** | Medium | Security |
| 2 | `.gitignore` missing `.env*` patterns | **Critical** | Trivial | Security |
| 3 | No security headers in `vercel.json` | **High** | Low | Security |
| 4 | `verify_jwt = false` on ALL edge functions | **Critical** | Medium | Security |
| 5 | CORS set to `*` (wildcard) on all edge functions | **Critical** | Low | Security |
| 6 | Plaintext `resend_api_key` stored in database | **Critical** | Medium | Security |
| 7 | No test suite (0 tests) | **High** | High | Quality |
| 8 | No CI/CD pipeline | **High** | Medium | DevOps |
| 9 | No error boundary component | **High** | Low | Reliability |
| 10 | No Sentry or error tracking | **High** | Low | Observability |
| 11 | No Stripe/billing integration | **Critical** | High | Monetization |
| 12 | Subscription limits enforced client-side only | **Critical** | Medium | Security |
| 13 | No Terms of Service | **Critical** | Medium | Legal |
| 14 | No Privacy Policy | **Critical** | Medium | Legal |
| 15 | No DPA (Data Processing Agreement) | **High** | Medium | Legal |
| 16 | No cookie consent mechanism | **High** | Low | Legal |
| 17 | No audit logging | **High** | Medium | Compliance |
| 18 | No analytics or structured logging | **Medium** | Medium | Observability |
| 19 | No web-vitals monitoring | **Medium** | Low | Performance |
| 20 | `TakeAssessment.tsx` (83KB) not lazy-loaded | **Medium** | Low | Performance |
| 21 | `AssessmentBuilder.tsx` (55KB) not lazy-loaded | **Medium** | Low | Performance |
| 22 | Resend email model exists but no send logic wired | **High** | Medium | Product |
| 23 | README is unchanged Lovable boilerplate | **Low** | Low | Documentation |

### 2.5 File-Level Issues

```
src/.env                          → Committed to git; contains SUPABASE_URL, SUPABASE_ANON_KEY,
                                    OPENAI_API_KEY (must purge from history)
.gitignore                        → Missing .env* pattern
vercel.json                       → No security headers configured
supabase/functions/*/index.ts     → All have verify_jwt = false in config.toml
supabase/functions/*/index.ts     → All CORS headers set to Access-Control-Allow-Origin: *
src/integrations/supabase/client.ts → Direct client creation (fine for SPA, needs
                                      server variant for Next.js)
src/pages/TakeAssessment.tsx      → 83KB single file, not code-split
src/pages/AssessmentBuilder.tsx   → 55KB single file, not code-split
src/i18n/translations.ts          → Single file with ~2000 keys (works but large)
```


---

## Part III — Market Intelligence (MENA-focused)

### 3.1 Global Competitor Landscape

The talent assessment market is projected to reach $7.5B+ by 2028 (CAGR ~14%). Key global players:

#### Tier 1 — Enterprise Incumbents

| Vendor | Founded | HQ | Key Strengths | Weaknesses vs Qudurat |
|---|---|---|---|---|
| **SHL** | 1977 | UK | 45+ languages, OPQ32, huge norm database, Fortune 500 penetration | Dated UI, expensive, no Arabic dialect awareness, slow innovation |
| **Hogan Assessments** | 1987 | USA | Gold-standard personality (HPI/HDS/MVPI), IO psychology research | No Arabic native, no AI generation, no self-service, very expensive |
| **Aon (cut-e)** | 2002 | Germany | 40+ languages, gamified assessments, adaptive testing | Corporate UI, complex pricing, MENA coverage via resellers only |
| **Mercer Mettl** | 2010 | India | 100+ skills, strong proctoring, good APAC/MENA presence | UI is functional not premium, limited Arabic content, no AI narratives |
| **HireVue** | 2004 | USA | Video interviews + AI analysis, large enterprise base | Controversial AI scoring, limited assessment types beyond video, expensive |
| **Thomas International** | 1981 | UK | DISC-based, strong UK/EU, some MENA distribution | Legacy product feel, limited assessment types, no AI features |

#### Tier 2 — Modern Challengers

| Vendor | Founded | HQ | Key Strengths | Weaknesses vs Qudurat |
|---|---|---|---|---|
| **TestGorilla** | 2020 | Netherlands | 400+ tests, affordable, strong SEO/content marketing | No Arabic, no AI generation, limited enterprise features, no MENA focus |
| **Criteria Corp** | 2006 | USA | Science-backed cognitive (CCAT), affordable SMB tier | No Arabic, US-focused, limited customization, no AI narratives |
| **Harver** | 2015 | Netherlands | Volume hiring, gamified, good integrations | Expensive, limited to high-volume use case, no Arabic |
| **Pymetrics/Harver** | 2013 | USA | Neuroscience games, bias auditing, unique approach | Acquired by Harver, niche use case, no Arabic, no text assessments |
| **Predictive Index** | 1955 | USA | Simple behavioral assessment, strong SMB presence | Limited assessment types, no Arabic, US-centric, no AI |
| **Plum** | 2012 | Canada | IO psychology + AI matching, modern UI | Limited scale, no Arabic, North America focused |
| **HackerRank** | 2012 | USA | Technical coding assessments, large developer community | Only technical roles, no soft skills, no Arabic |
| **Codility** | 2009 | Poland | Technical assessments, plagiarism detection | Only technical roles, no Arabic, EU focused |
| **eSkill** | 2003 | USA | 800+ topics, customizable tests, affordable | Dated UI, no Arabic, no AI, no mobile optimization |

#### Tier 3 — MENA-Specific Competitors

| Vendor | HQ | Key Strengths | Threat Level to Qudurat |
|---|---|---|---|
| **Evalufy** | UAE (Dubai) | AI-powered video screening, ATS integration, Arabic support, MENA-native team, growing client base (Majid Al Futtaim, ADNOC) | **HIGH** — Most direct competitor. But focused on video screening, not comprehensive assessments. No cognitive/personality tests. |
| **Talentera** (Bayt.com) | UAE | Part of Bayt.com ecosystem (largest MENA job board), ATS with basic assessments, Arabic native | **MEDIUM** — ATS-first, assessments are bolt-on, not deep. Leverages Bayt.com distribution. |
| **Menaitech** | Jordan | Full HR suite (payroll, attendance, recruitment), some assessment features, Arabic-first | **LOW** — HRIS-first, assessments are shallow. Competes on breadth not depth. |
| **Psytech International** | UK/UAE | Psychometric testing, 15q+ personality, some Arabic norms, MENA office | **MEDIUM** — Legitimate psychometrics but dated platform, no AI, no self-service. |
| **Tharwah** | KSA | Saudi HR platform, Saudization tools, basic assessments | **LOW** — Compliance-focused, not assessment-depth. |
| **Profiles ME** | UAE | Profile XT, sales assessments, MENA distribution of Wiley products | **LOW** — Reseller model, not a product company. |

### 3.2 Feature Comparison Matrix

| Feature | Qudurat | SHL | Mettl | TestGorilla | Evalufy | HireVue | Criteria |
|---|---|---|---|---|---|---|---|
| **Arabic RTL-native** | YES | Partial | Partial | No | Partial | No | No |
| **Arabic dialect awareness** | Planned | No | No | No | No | No | No |
| **Cognitive assessments** | YES | YES | YES | YES | No | No | YES |
| **Personality assessments** | YES | YES | YES | YES | No | No | No |
| **Behavioral assessments** | YES | YES | YES | No | No | YES | No |
| **SJT (Situational Judgment)** | YES | YES | YES | No | No | No | No |
| **Language proficiency** | YES | YES | YES | YES | No | No | No |
| **AI question generation** | YES | No | No | No | No | No | No |
| **AI narrative reports** | YES | No | No | No | Partial | Partial | No |
| **Multi-tenant SaaS** | YES | YES | YES | YES | YES | YES | YES |
| **Self-service branding** | YES | No | Partial | No | No | No | No |
| **Custom domain** | Planned | No | No | No | No | No | No |
| **Configurable email provider** | Planned | No | No | No | No | No | No |
| **Configurable AI provider** | Planned | No | No | No | No | No | No |
| **Video interviews** | Planned | Partial | YES | No | YES | YES | No |
| **Adaptive (CAT) testing** | Planned | YES | No | No | No | No | YES |
| **Gamified assessments** | Planned | No | No | Partial | No | No | No |
| **Skills passport/taxonomy** | Planned | YES | Partial | No | No | No | No |
| **ATS/HRIS integrations** | Planned | YES | YES | YES | YES | YES | YES |
| **Public API + webhooks** | Planned | YES | YES | YES | Partial | YES | Partial |
| **MENA data residency** | Planned | Partial | Partial | No | YES | No | No |
| **PWA / offline support** | YES | No | No | No | No | No | No |
| **Real-time progress tracking** | YES | No | Partial | No | No | No | No |
| **Bias/fairness auditing** | Planned | YES | No | No | No | Partial | No |
| **White-label / reseller** | Planned | YES | YES | No | No | No | No |
| **SSO (SAML/OIDC)** | Planned | YES | YES | No | No | YES | No |
| **Proctoring** | Planned | YES | YES | Partial | No | YES | No |
| **Certificate generation** | Planned | No | YES | YES | No | No | No |

### 3.3 Qudurat's Unique Differentiators

1. **Arabic-native, not localized** — Built RTL-first with Arabic typography, dialect-aware AI, and cultural context baked in from day one
2. **AI-powered content creation** — Generate assessment questions and narrative reports using configurable AI providers (BYOK model)
3. **Full tenant self-service** — Email provider, AI provider, domain, branding, notification customization — no support tickets needed
4. **Mid-market sweet spot** — Enterprise features (multi-tenancy, branding, SSO) at mid-market pricing; incumbents price out SMBs, challengers lack depth
5. **MENA data sovereignty** — Roadmap for KSA/UAE sovereign deployment (AWS Bahrain, Azure UAE) aligned with PDPL/DDLNP requirements
6. **Skills-based, not just selection** — Assessment results feed into skills passports, internal mobility, continuous development — not just hire/no-hire

### 3.4 2026 Industry Trends

1. **Generative AI everywhere** — AI question generation, AI scoring narratives, AI-powered candidate comparisons are becoming table stakes. 73% of assessment vendors surveyed plan AI features by 2026.
2. **Adaptive/CAT testing** — Item Response Theory-based adaptive tests cut assessment time 40-50% while improving measurement precision. SHL, Aon, Criteria already offer this.
3. **Skills-based hiring dominance** — 85% of organizations shifting toward skills-based hiring (LinkedIn 2025 report). Assessment vendors must map to skill taxonomies (ESCO, SFIA, O*NET).
4. **Gamification for volume hiring** — Game-based assessments for high-volume roles (retail, hospitality, call centers). Aon, Harver, Pymetrics lead here.
5. **Fairness & bias auditing** — NYC Local Law 144 requires bias audits for AI hiring tools. EU AI Act classifies hiring AI as "high risk." Vendors need adverse impact dashboards.
6. **Continuous assessment** — Move beyond point-in-time hiring assessments to ongoing skills tracking, quarterly re-evaluation, learning path recommendations.
7. **LLM HR copilots** — Chat interfaces over assessment data: "Compare the top 5 candidates for this role" or "What training does this team need?"
8. **Deep-fake & cheating detection** — As remote assessment grows, proctoring must evolve: liveness detection, voice authentication, behavioral biometrics.
9. **Credit-based & outcome-based pricing** — Shift from per-seat subscriptions to usage-based credits and outcome-tied pricing (pay per successful hire).
10. **Internal mobility** — Assessment data feeding internal talent marketplaces; employees assessed for role fit within the organization, not just external candidates.

### 3.5 Pricing Intelligence

| Vendor | Model | Entry Price | Mid-Tier | Enterprise |
|---|---|---|---|---|
| **SHL** | Per-assessment | N/A (sales only) | N/A | $50K-500K+/yr |
| **Mercer Mettl** | Per-assessment credits | $99/mo (50 credits) | $499/mo (300 credits) | Custom |
| **TestGorilla** | Per-seat | $75/mo (starter) | $115/mo (pro) | Custom |
| **Criteria Corp** | Per-assessment | $25/test one-off | $3,000/yr unlimited | Custom |
| **HireVue** | Per-seat + usage | N/A | N/A | $35K-100K+/yr |
| **Evalufy** | Per-seat | ~$200/mo | ~$500/mo | Custom |
| **Codility** | Per-seat | $100/mo | $500/mo | Custom |
| **eSkill** | Per-test | $10/test | $2,500/yr | Custom |

**Key pricing insights for Qudurat:**
- Mid-market (50-500 employees) is underserved: too small for SHL/HireVue, too complex for TestGorilla
- Credit-based models (Mettl) are gaining traction for usage flexibility
- MENA enterprises expect annual contracts with invoicing (not self-serve credit card)
- Arabic-language premium: organizations will pay 20-30% more for genuine Arabic-native products vs. translated alternatives


---

## Part IV — Product Roadmap (New Features)

### Qudurat 1.0 — Launch-Critical (0-4 months)

#### 1. Email Lifecycle (Pluggable Provider)

Wire up the existing email settings model with a provider-agnostic abstraction layer:

- **Invite email** — When HR admin adds a participant to a group, send branded invite with assessment link
- **Reminder email** — Configurable reminders at T-3 days, T-1 day, T-4 hours before deadline
- **Started notification** — Notify HR admin when participant begins assessment
- **Completion email** — Send participant their results summary (if org allows)
- **Result delivery** — Notify HR admin of completion with link to full results
- **Deadline approaching** — Alert HR admin when group is approaching deadline with incomplete participants
- **Trial lifecycle** — Welcome, T-7 reminder, T-3 warning, T-1 urgent, expired follow-up

Email provider is configurable per-tenant (see Part IV-A Section 1).

#### 2. Tenant Self-Service Configuration Suite

This is a first-class pillar of Qudurat 1.0 — see dedicated **Part IV-A** below.

#### 3. Advanced Proctoring (Lightweight)

Lightweight anti-cheating measures suitable for remote assessment:

- **Tab-switch detection** — Log and alert when participant navigates away from assessment tab
- **Copy-paste guard** — Disable clipboard paste in text response fields
- **Full-screen lock** — Request full-screen mode; log exits
- **Optional webcam capture** — Periodic snapshots during assessment (with consent notice)
- **Browser lockdown mode** — Optional Kiosk-like mode preventing new tabs/windows
- **Suspicious activity scoring** — Aggregate tab switches, focus losses, timing anomalies into a "confidence score" shown to HR admin alongside results
- **No invasive software** — Browser-only, no desktop agent required (critical for MENA enterprise adoption)

#### 4. AI Question Generation v2 (Provider-Agnostic)

Upgrade the existing OpenAI-only question generation to support multiple providers:

- **Provider selection** per tenant (see Part IV-A Section 2)
- **Arabic-native generation** — Prompts optimized for Modern Standard Arabic and Gulf/Egyptian/Levantine dialects
- **Bias filter** — Post-generation review for cultural bias, gender bias, disability bias
- **Difficulty calibration** — Generate questions at specified difficulty levels (1-5)
- **Competency mapping** — Tag generated questions to competency frameworks
- **Batch generation** — Generate full assessment question sets in one operation
- **Human-in-the-loop** — AI generates draft, HR admin reviews/edits before publishing

#### 5. AI Narrative Reports (Productionize)

The talent snapshot feature exists but needs hardening:

- **Structured output** — Use JSON schema mode for consistent report sections
- **Bilingual generation** — Generate reports in both Arabic and English simultaneously
- **Template system** — Org-configurable report templates with variable sections
- **Comparison narratives** — "How does this candidate compare to the group average?"
- **Actionable recommendations** — Training suggestions, role fit indicators, development areas
- **PDF export** — Branded PDF with org logo, colors, and professional formatting

#### 6. Assessment Templates Library

Pre-built assessment templates to accelerate adoption:

| Template | Type | Questions | Duration | Use Case |
|---|---|---|---|---|
| Software Engineer Screen | Cognitive + Technical | 25 | 45 min | Pre-interview technical screen |
| Sales Aptitude | Personality + SJT | 30 | 30 min | Sales role fit assessment |
| Customer Support Readiness | Behavioral + Language | 20 | 25 min | Support role hiring |
| Leadership Potential | Personality + Behavioral | 35 | 40 min | Internal promotion decisions |
| Graduate Program Screen | Cognitive + Personality | 30 | 35 min | Campus/graduate recruitment |
| Cultural Fit Assessment | Behavioral + SJT | 20 | 20 min | Values alignment check |
| Arabic Language Proficiency | Language | 25 | 30 min | Arabic fluency verification |
| English Language Proficiency | Language | 25 | 30 min | English fluency verification |
| Quick Cognitive Screen | Cognitive | 15 | 15 min | Fast cognitive baseline |
| Comprehensive Executive | All types | 50 | 60 min | Senior leadership evaluation |

Each template available in Arabic and English, with org-customizable variants.

#### 7. Stripe Billing + Customer Portal

- Stripe Checkout for subscription sign-up
- Stripe Customer Portal for self-service billing management
- Webhook handlers for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.paid`
- Server-side enforcement: DB triggers + edge function guards that check `organization_subscription_limits` before allowing creates on `assessments`, `assessment_groups`, `group_participants`, `user_roles`
- Usage metering for credit-based add-ons (AI generation tokens, video minutes)
- Alternative: **Lemon Squeezy or Paddle** as Merchant of Record for MENA VAT complexity (see Part VIII)

#### 8. Server-Side Limit Enforcement

Replace current client-side-only subscription checks:

```sql
-- Example: DB trigger to enforce assessment creation limits
CREATE OR REPLACE FUNCTION enforce_assessment_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM assessments
  WHERE organization_id = NEW.organization_id;

  SELECT max_assessments INTO max_allowed
  FROM organization_subscription_limits
  WHERE organization_id = NEW.organization_id;

  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Assessment limit reached for your subscription plan. Please upgrade.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Similar triggers for: groups, participants per group, user roles, AI generation calls.

---

### Qudurat 2.0 — Differentiators (4-9 months)

#### 1. Skills Passport

Map assessment results to standardized skill taxonomies:

- **ESCO** (European Skills, Competencies, Qualifications) — 13,890 skills, EU standard
- **SFIA** (Skills Framework for the Information Age) — IT-specific, 7 levels
- **Custom org taxonomies** — Organizations define their own competency frameworks
- **Proficiency levels** — Map raw scores to proficiency bands (Novice → Expert)
- **Longitudinal tracking** — Track skill development over time across multiple assessments
- **Skills gap analysis** — Compare individual/team skills to role requirements
- **Exportable skills profile** — Candidate receives portable skills credential

#### 2. Adaptive (CAT) Cognitive Testing

Item Response Theory-based Computer Adaptive Testing:

- **IRT item calibration** — Pre-calibrate question difficulty (a, b, c parameters) from pilot data
- **Bayesian ability estimation** — Real-time theta (ability) estimation during assessment
- **Adaptive item selection** — Select next question based on current ability estimate (maximum information criterion)
- **Stopping rules** — Terminate when Standard Error of Measurement (SEM) falls below threshold OR max items reached
- **50% time reduction** — Achieve same measurement precision in half the items
- **Norm-referenced scoring** — Percentile ranks against MENA-specific norms
- **Item bank management** — UI for managing large item pools with difficulty/discrimination metadata

#### 3. Video Interview Module

One-way asynchronous video interviews:

- **Candidate records** responses to pre-set questions at their convenience
- **AI transcription** — Automatic transcription in Arabic + English (Whisper-based)
- **AI sentiment analysis** — Confidence, enthusiasm, clarity scoring
- **Structured evaluation** — Reviewers rate responses on configurable rubrics
- **Time-limited responses** — Configurable per-question time limits
- **Practice question** — One practice before the real interview starts
- **Shareable review links** — HR admin shares video with hiring manager for collaborative review

#### 4. Gamified Assessment Variants

For high-volume hiring (retail, hospitality, logistics):

- **Balloon pump** — Risk-taking assessment (BART-inspired)
- **Card sorting** — Cognitive flexibility and categorization
- **Pattern matching** — Abstract reasoning with visual puzzles
- **Memory grid** — Working memory capacity
- **Reaction time** — Processing speed measurement
- **All mobile-optimized** — Thumb-zone design, portrait orientation
- **Engaging UX** — Animations, progress rewards, completion celebration
- **10-minute sessions** — Short enough for high-volume candidate pools

#### 5. Team Composition Analytics

Skills coverage heatmaps and gap analysis:

- **Team skills radar** — Aggregate team competency profile visualization
- **Gap identification** — "Your team is weak in strategic thinking and strong in execution"
- **Hiring recommendations** — "Hiring a candidate strong in X would balance the team"
- **Diversity metrics** — Skills diversity index across the team
- **Historical trends** — How team composition evolved over quarters

#### 6. Public API + Webhooks

RESTful API for integrations:

- **Assessment CRUD** — Create, read, update, delete assessments programmatically
- **Participant management** — Add/remove participants, fetch results
- **Webhook subscriptions** — Receive real-time events: assessment.completed, group.closed, score.calculated
- **API keys** — Per-organization API keys with scoped permissions
- **Rate limiting** — Tiered by plan (Starter: 100 req/min, Pro: 1000 req/min, Enterprise: custom)
- **OpenAPI spec** — Auto-generated documentation
- **SDKs** — JavaScript/TypeScript, Python, Ruby SDKs (community-contributed)

#### 7. Native ATS/HRIS Integrations

- **SAP SuccessFactors** (dominant in KSA/UAE enterprise)
- **Workday** (multinational employers in MENA)
- **Oracle HCM** (government and large enterprise)
- **BambooHR** (SMB/mid-market)
- **Greenhouse** (tech companies)
- **Lever** (tech companies)
- **Integration pattern**: OAuth 2.0 + webhook-based; assessment results flow back as structured data into ATS candidate profile

#### 8. Vision 2030 / HRDF Dashboard

Saudi-specific compliance and reporting:

- **Saudization percentage** — Track Saudi national representation per role/department
- **HRDF training recommendations** — Map assessment gaps to HRDF-funded training programs
- **Nitaqat compliance** — Color band tracking (Platinum/Green/Yellow/Red)
- **Tawteen alignment** — UAE nationalization equivalent
- **Export-ready reports** — Ministry-format compliance reports

#### 9. White-Label / Reseller Mode

- **Full white-label** — Remove all Qudurat branding, custom domain, org logo/colors everywhere
- **Reseller portal** — Consultancy partners manage multiple client orgs from a single dashboard
- **Revenue sharing** — Reseller gets a percentage of client subscription revenue
- **Custom pricing** — Resellers set their own pricing for end clients
- **Sub-account provisioning** — Reseller creates new org accounts, manages billing centrally

#### 10. Bias Auditing Dashboard

- **Adverse impact analysis** — 4/5ths rule calculation across gender, nationality, age groups
- **Item-level bias detection** — Differential Item Functioning (DIF) analysis per question
- **Score distribution comparisons** — Visualize score distributions across demographic groups
- **Dialect fairness** — Flag questions where Gulf Arabic speakers score differently from Egyptian/Levantine
- **Audit report generation** — NYC LL144 and EU AI Act compliant bias audit reports
- **Continuous monitoring** — Automated alerts when disparate impact exceeds thresholds

---

### Qudurat 3.0 — Moat (9-18 months)

#### 1. Internal Mobility Engine
- Match employees to internal open roles based on assessment history + skills passport
- Gap analysis: "To qualify for Senior Manager, you need to improve in X and Y"
- Career path visualization with assessment milestones
- Manager nomination workflows

#### 2. Continuous Assessment
- Quarterly re-assessment schedules (automated invites)
- Skill drift tracking — detect declining competencies
- Development progress measurement — pre/post training assessments
- Organizational learning velocity metrics

#### 3. Learning Path Recommendations
- Map assessment gaps to specific learning resources
- LMS integrations: Coursera, LinkedIn Learning, Udemy Business
- Local Arabic learning platforms: Rwaq, Edraak, MenaITech Academy
- ROI tracking: assessment score improvement correlated with training completion

#### 4. LLM HR Copilot
- Natural language queries: "Show me the top 5 candidates for the Dubai marketing role"
- Candidate comparison narratives: "Compare Ahmed and Sara for the CFO position"
- Team building suggestions: "What skills are we missing on the engineering team?"
- Assessment design assistance: "Create a 20-minute cognitive assessment for entry-level accountants"
- Chat interface embedded in dashboard

#### 5. Arabic LLM Fine-Tuning
- Fine-tune on domain-specific assessment content (question generation, scoring rubrics, narrative reports)
- Partner with: Falcon (TII, UAE), AraGPT2, JAIS (Inception/MBZUAI), or in-house fine-tune
- Dialect-aware generation (MSA, Gulf, Egyptian, Levantine options)
- Evaluation benchmarks for Arabic assessment content quality

#### 6. On-Premises / Sovereign Cloud
- Containerized deployment (Docker + Kubernetes) for government and defense clients
- AWS Bahrain (me-south-1) and Azure UAE (uae-north) deployments
- Air-gapped option for classified environments
- Data never leaves country boundaries — full PDPL/DDLNP compliance
- Annual license model instead of monthly SaaS for on-prem


---

## Part IV-A — Tenant Self-Service Configuration

> **Core differentiator**: Every org admin can fully self-serve their tenant without contacting support. This is a first-class Qudurat 1.0 pillar.

### 1. Email Provider Configuration (Per-Tenant, Swappable)

Org admin chooses their email provider from a dropdown. The platform handles the rest.

**Supported Providers:**

| Provider | Type | Fields Required |
|---|---|---|
| **Resend** | API | API Key |
| **Mailgun** | API | API Key, Domain |
| **SendGrid** | API | API Key |
| **Amazon SES** | API | Access Key ID, Secret Key, Region |
| **Postmark** | API | Server Token |
| **Direct SMTP** | Protocol | Host, Port, Username, Password, TLS toggle |

**Architecture:**

```typescript
// lib/email/types.ts
interface EmailMessage {
  to: string | string[];
  from: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Attachment[];
}

interface EmailProviderAdapter {
  name: string;
  send(message: EmailMessage): Promise<EmailResult>;
  verifyCredentials(): Promise<boolean>;
  checkDomainVerification(domain: string): Promise<DomainVerificationStatus>;
}

// lib/email/providers/resend.ts
class ResendAdapter implements EmailProviderAdapter { ... }

// lib/email/providers/mailgun.ts
class MailgunAdapter implements EmailProviderAdapter { ... }

// lib/email/providers/smtp.ts
class SmtpAdapter implements EmailProviderAdapter { ... }

// lib/email/factory.ts
function createEmailProvider(config: TenantEmailProvider): EmailProviderAdapter {
  switch (config.provider_type) {
    case 'resend': return new ResendAdapter(config);
    case 'mailgun': return new MailgunAdapter(config);
    case 'smtp': return new SmtpAdapter(config);
    // ...
  }
}
```

**Features:**
- Provider-specific form fields shown dynamically based on dropdown selection
- "Send test email" button to verify config before save
- **Fallback chain**: optional secondary provider if primary fails (e.g., primary Resend, fallback SMTP)
- **Domain verification workflow**: show DKIM/SPF/DMARC records for the chosen `from` domain; verify via DNS lookup
- **Usage metrics**: per-tenant send counts, bounce rates, delivery status
- **Send log**: last 30 days of outbound email with status and provider response

**Secrets storage**: All API keys encrypted via Supabase Vault — never plaintext in DB columns. AES-GCM with org-scoped key derivation.

**Database schema:**

```sql
CREATE TABLE tenant_email_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('resend','mailgun','sendgrid','ses','postmark','smtp')),
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  from_email TEXT NOT NULL,
  from_name TEXT,
  reply_to TEXT,
  encrypted_credentials JSONB NOT NULL,  -- via Supabase Vault
  smtp_host TEXT,       -- SMTP only
  smtp_port INTEGER,    -- SMTP only
  smtp_secure BOOLEAN,  -- SMTP only
  smtp_username TEXT,    -- SMTP only
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  last_tested_at TIMESTAMPTZ,
  last_test_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, provider_type)
);

CREATE TABLE tenant_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES tenant_email_providers(id),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent','bounced','complained','failed')),
  error TEXT,
  provider_response JSONB,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: org_admin only
ALTER TABLE tenant_email_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org admins manage email providers"
  ON tenant_email_providers FOR ALL
  USING (is_org_admin(organization_id));
```

---

### 2. AI Provider Configuration (Per-Tenant)

Org admin selects their AI provider and model for each use case.

**Supported Providers:**

| Provider | Models | Best For |
|---|---|---|
| **OpenAI** | GPT-4o, GPT-4o-mini, o1 | General-purpose, fast |
| **Anthropic** | Claude Opus, Sonnet, Haiku | Narratives, nuance, safety |
| **Google Gemini** | Gemini 2.5 Pro, Flash | Multilingual, long context |
| **Azure OpenAI** | GPT-4o (Azure-hosted) | Enterprise compliance |
| **AWS Bedrock** | Claude, Titan, Llama | AWS-native deployments |
| **Mistral** | Mistral Large, Nemo | EU data residency |
| **DeepSeek** | DeepSeek-V3, R1 | Cost-effective reasoning |
| **Groq** | Llama, Mixtral (fast inference) | Low-latency generation |
| **Ollama/vLLM** | Any open model | Self-hosted, air-gapped |
| **Falcon/JAIS** | Falcon-180B, JAIS-70B | Arabic-optimized |

**Per-use-case model routing:**

```
┌──────────────────────┬─────────────────────────┐
│ Use Case             │ Example Configuration   │
├──────────────────────┼─────────────────────────┤
│ Question Generation  │ GPT-4o (fast, creative) │
│ Narrative Reports    │ Claude Sonnet (nuanced)  │
│ Talent Snapshots     │ Claude Sonnet (analysis) │
│ Group Insights       │ Gemini Pro (long context)│
└──────────────────────┴─────────────────────────┘
```

**Architecture:**

```typescript
// lib/ai/types.ts
interface AiProviderAdapter {
  generateText(prompt: string, options?: GenerateOptions): Promise<TextResult>;
  generateStructured<T>(prompt: string, schema: ZodSchema<T>): Promise<T>;
  generateQuestions(spec: QuestionSpec): Promise<Question[]>;
  generateNarrative(data: AssessmentData): Promise<NarrativeReport>;
}

// lib/ai/factory.ts
function createAiProvider(config: TenantAiProvider): AiProviderAdapter {
  switch (config.provider_type) {
    case 'openai': return new OpenAiAdapter(config);
    case 'anthropic': return new AnthropicAdapter(config);
    case 'gemini': return new GeminiAdapter(config);
    // ...
  }
}
```

**Features:**
- Temperature / max-tokens / top-p tuning per use case
- "Test AI" button: runs a canned prompt, shows response + latency + token count
- Cost dashboard: per-tenant token usage, cost estimate, monthly cap alerts
- Prompt library: org-editable prompt templates with variables (`{assessmentType}`, `{language}`, `{competency}`)
- **BYOK (Bring Your Own Key)**: tenant pays their AI provider directly; Qudurat takes no margin on AI costs at Starter/Pro tier

**Database schema:**

```sql
CREATE TABLE tenant_ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  provider_type TEXT NOT NULL CHECK (provider_type IN (
    'openai','anthropic','gemini','azure_openai','bedrock',
    'mistral','deepseek','groq','ollama','falcon','custom'
  )),
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  encrypted_credentials JSONB NOT NULL,
  base_url TEXT,                    -- for Azure/self-hosted
  organization_header TEXT,         -- OpenAI org header
  default_model TEXT,
  question_gen_model TEXT,
  narrative_model TEXT,
  snapshot_model TEXT,
  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  top_p NUMERIC(3,2) DEFAULT 1.0,
  monthly_token_cap BIGINT,
  monthly_cost_cap_usd NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tenant_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES tenant_ai_providers(id),
  use_case TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  cost_estimate_usd NUMERIC(10,6),
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tenant_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  use_case TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  template_text TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 3. Domain Management (Subdomain + Custom Domain)

#### Subdomain (All Tiers)

Every tenant gets `{slug}.qudurat.com` on signup:

- **Slug validation**: 3-63 characters, lowercase alphanumeric + hyphens, DNS-safe
- **Profanity filter**: blocked word list (EN + AR)
- **Reserved words**: `www`, `api`, `admin`, `app`, `docs`, `blog`, `status`, `cdn`, `mail`, `ftp`, `staging`, `dev`, `test`
- **Uniqueness check**: real-time validation against `organizations.subdomain`
- **DNS**: wildcard `*.qudurat.com` A/AAAA record pointing to Vercel
- **Change limit**: once every 30 days (SEO stability, abuse prevention)

#### Custom Domain (Professional + Enterprise)

Org admin brings their own domain:

```
┌─────────────────────────────────────────────────────┐
│  Custom Domain Setup Flow                           │
├─────────────────────────────────────────────────────┤
│  1. Org admin enters: assess.acme.com               │
│  2. System shows: Add CNAME record                  │
│     assess.acme.com → cname.vercel-dns.com          │
│  3. User adds DNS record at their registrar         │
│  4. System polls DNS every 60s for verification     │
│  5. On success: auto-provision SSL certificate      │
│  6. Domain is active within minutes                 │
│  7. Old subdomain 301-redirects to custom domain    │
└─────────────────────────────────────────────────────┘
```

**Features:**
- CNAME verification for subdomains, A/AAAA for apex domains
- Auto-SSL via Vercel Domains API or Cloudflare for SaaS
- Multi-domain: attach multiple custom domains per org
- Cookie scoping: auth cookies scoped per domain, not shared across tenants

**Next.js middleware (hostname-based tenant resolution):**

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')!;

  // 1. Tenant resolution (edge-cached via Vercel Edge Config or Upstash Redis)
  const tenant = await resolveTenant(hostname);
  if (!tenant) {
    return NextResponse.rewrite(new URL('/unknown-tenant', request.url));
  }

  // 2. Inject tenant context for downstream Server Components
  const response = NextResponse.next();
  response.headers.set('x-tenant-id', tenant.id);
  response.headers.set('x-tenant-subdomain', tenant.subdomain);
  response.headers.set('x-tenant-plan', tenant.plan);

  // 3. Supabase session refresh (via @supabase/ssr)
  // ... (session refresh logic)

  // 4. Locale detection & routing (via next-intl)
  // ... (locale routing logic)

  return response;
}

async function resolveTenant(hostname: string): Promise<Tenant | null> {
  // Check custom domains first
  const customDomain = await edgeCache.get(`domain:${hostname}`);
  if (customDomain) return customDomain;

  // Check subdomain pattern
  const subdomain = hostname.replace('.qudurat.com', '');
  if (subdomain && subdomain !== hostname) {
    return await edgeCache.get(`subdomain:${subdomain}`);
  }

  return null;
}
```

**Database schema:**

```sql
ALTER TABLE organizations ADD COLUMN subdomain TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN subdomain_changed_at TIMESTAMPTZ;

CREATE TABLE tenant_custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  verification_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  verification_record_type TEXT DEFAULT 'CNAME',
  verification_record_value TEXT,
  verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending','verified','failed','expired')),
  verified_at TIMESTAMPTZ,
  ssl_status TEXT DEFAULT 'pending'
    CHECK (ssl_status IN ('pending','active','failed')),
  ssl_issued_at TIMESTAMPTZ,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 4. Organization Branding (Org Admin Self-Serve)

Extends the existing `OrganizationBrandingContext` into a full design token editor.

**Brand Assets:**
- Logo upload: light + dark variants, SVG/PNG, with preview on simulated dashboard
- Favicon upload: auto-generated from logo via canvas crop if not provided
- Open Graph / social share image

**Color System:**
- Primary, secondary, accent seed colors via color picker
- Auto-generate full 50-950 scale from seed using OKLCH interpolation:

```typescript
// lib/branding/color-scale.ts
function generateScale(seedHex: string): Record<string, string> {
  const seed = parseToOklch(seedHex);
  return {
    '50':  oklchToHex({ ...seed, l: 0.97 }),
    '100': oklchToHex({ ...seed, l: 0.93 }),
    '200': oklchToHex({ ...seed, l: 0.85 }),
    '300': oklchToHex({ ...seed, l: 0.75 }),
    '400': oklchToHex({ ...seed, l: 0.65 }),
    '500': oklchToHex({ ...seed, l: 0.55 }),  // seed
    '600': oklchToHex({ ...seed, l: 0.45 }),
    '700': oklchToHex({ ...seed, l: 0.37 }),
    '800': oklchToHex({ ...seed, l: 0.28 }),
    '900': oklchToHex({ ...seed, l: 0.20 }),
    '950': oklchToHex({ ...seed, l: 0.12 }),
  };
}
```

- Semantic colors (success, warning, danger, info) with override capability
- Light + dark mode variants
- Real-time preview panel showing dashboard mockup with new theme

**Typography:**
- Google Fonts picker: Inter, Sora, Cairo, Noto Sans Arabic, IBM Plex Sans Arabic, Tajawal
- Separate Arabic + Latin font assignment
- Font scale: compact / comfortable / spacious

**Layout:**
- Border radius scale: sharp (2px) / rounded (8px) / pill (9999px)
- Density: compact / comfortable

**Email Branding:**
- Header logo, accent color, footer text, social links
- Applied to all lifecycle emails automatically
- Per-tenant email template preview

**Assessment-Taker Branding:**
- Custom welcome screen copy (per language)
- Custom completion screen with optional CTA
- "Powered by Qudurat" toggle (white-label, Pro+ only)

**Certificate Branding:**
- Upload certificate template (HTML or PDF)
- Auto-fills: participant name, assessment title, score, date, org name
- Downloadable branded PDF on completion

**Distribution**: Branding tokens served as CSS custom properties on the edge, cached per hostname:

```css
:root {
  --brand-primary-500: #4f46e5;
  --brand-primary-600: #4338ca;
  --brand-accent: #f59e0b;
  --brand-font-latin: 'Inter', sans-serif;
  --brand-font-arabic: 'Cairo', sans-serif;
  --brand-radius: 8px;
}
```

**Database schema:**

```sql
CREATE TABLE tenant_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  logo_light_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  og_image_url TEXT,
  color_primary TEXT DEFAULT '#4f46e5',
  color_secondary TEXT DEFAULT '#7c3aed',
  color_accent TEXT DEFAULT '#f59e0b',
  color_palettes JSONB DEFAULT '{}',
  font_latin TEXT DEFAULT 'Inter',
  font_arabic TEXT DEFAULT 'Cairo',
  font_scale TEXT DEFAULT 'comfortable' CHECK (font_scale IN ('compact','comfortable','spacious')),
  density TEXT DEFAULT 'comfortable' CHECK (density IN ('compact','comfortable')),
  border_radius_scale TEXT DEFAULT 'rounded' CHECK (border_radius_scale IN ('sharp','rounded','pill')),
  email_header_logo_url TEXT,
  email_accent_color TEXT,
  email_footer_text TEXT,
  email_social_links JSONB DEFAULT '[]',
  assess_welcome_copy_en TEXT,
  assess_welcome_copy_ar TEXT,
  assess_completion_copy_en TEXT,
  assess_completion_copy_ar TEXT,
  assess_completion_cta_url TEXT,
  show_powered_by BOOLEAN DEFAULT true,
  certificate_template_url TEXT,
  certificate_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
```

---

### 5. HR Admin — Notification Customization

Org admin sets the policy envelope; HR admin tunes within it.

**Event-Level Toggles:**

| Event | Default Channels | Digest-able? |
|---|---|---|
| Participant invited | email | No (immediate) |
| Participant reminder | email | No (immediate) |
| Participant started | in_app | Yes |
| Participant completed | email, in_app | Yes |
| Participant abandoned | email, in_app | Yes |
| Group launched | in_app | No |
| Group 80% complete | email, in_app | Yes |
| Group closed | email, in_app | Yes |
| Low score threshold | email | No |
| Billing alert | email | No |
| AI generation finished | in_app | Yes |
| New team member joined | in_app | Yes |

**Delivery Channels:**
- Email (via tenant's configured email provider)
- In-app (real-time via Supabase Realtime)
- Webhook (POST to configured URL)
- Slack (via Slack app integration, Pro+)
- Microsoft Teams (via Teams connector, Enterprise)

**Digest Options:**
- Real-time (immediate delivery)
- Hourly digest
- Daily digest (configurable time)
- Weekly summary (configurable day + time)

**Quiet Hours:**
- Timezone-aware
- No notifications during selected hours (e.g., 22:00-07:00 GST)
- Exceptions for critical events (billing failures)

**Custom Email Template Editor:**
- Edit subject + body for each notification event
- Variable picker: `{participant_name}`, `{assessment_title}`, `{score}`, `{completion_time}`, `{group_name}`, `{org_name}`, `{dashboard_url}`
- Live preview with sample data
- Bilingual templates (EN + AR) with auto-fallthrough
- Reset-to-default button
- Version history

**Database schema:**

```sql
CREATE TABLE notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  default_channels TEXT[] DEFAULT ARRAY['email','in_app'],
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL
);

CREATE TABLE user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  event_key TEXT REFERENCES notification_events(event_key),
  channels TEXT[] DEFAULT ARRAY['email','in_app'],
  digest_frequency TEXT DEFAULT 'realtime'
    CHECK (digest_frequency IN ('realtime','hourly','daily','weekly')),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'Asia/Dubai',
  is_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, organization_id, event_key)
);

CREATE TABLE user_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  event_key TEXT REFERENCES notification_events(event_key),
  language TEXT NOT NULL DEFAULT 'en',
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, organization_id, event_key, language)
);

CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_key TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent','failed','pending','digested')),
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Settings UI Hierarchy

```
Organization Settings  (org admin only)
├── General             (org name, timezone, default language)
├── Branding            (Section 4: logos, colors, typography, certificates)
├── Email Providers     (Section 1: provider dropdown, credentials, test, logs)
├── AI Providers        (Section 2: provider dropdown, models, prompts, usage)
├── Domains             (Section 3: subdomain, custom domains, DNS status)
├── Members & Roles     (invite users, assign roles, deactivate)
├── Billing             (Stripe portal, usage, invoices)
└── Security & Audit    (audit log, session management, 2FA policy)

My Notifications       (every user, scoped by role)
├── Event Preferences   (Section 5: per-event toggles, channels, digest)
├── Custom Templates    (Section 5: email template editor)
├── Delivery Channels   (connected Slack, Teams, webhooks)
└── Send History        (notification log with status)
```

### Security Notes

- All secrets (email API keys, AI API keys, SMTP passwords) go through **Supabase Vault** — never plaintext DB columns
- RLS policies restrict all tenant config tables to `org_admin` role of that organization
- **Audit log entries** for: provider added/changed/removed, domain verified/unverified, branding changed, template edited
- **Rate limiting** on "Test email" and "Test AI" buttons (max 5/hour per org)
- Domain verification tokens rotate every 7 days if unverified


---

## Part V — Premium UI/UX Transformation

> Target: Linear / Stripe / Notion / Vercel-tier polish — the kind of product where enterprise buyers say "this looks serious."

### 5.1 Brand System

**Name & Wordmark:**
- **Qudurat** (قدرات) — dual-script wordmark: Arabic calligraphic + clean Latin sans-serif
- Mark: abstract "Q" that also reads as Arabic ق, usable as favicon and app icon

**Color Tokens:**

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `primary-500` | `#4f46e5` (Deep Indigo) | `#818cf8` | Primary actions, links, focus rings |
| `primary-600` | `#4338ca` | `#6366f1` | Hover states |
| `accent` | `#f59e0b` (Amber) | `#fbbf24` | Highlights, badges, CTAs |
| `success` | `#10b981` | `#34d399` | Positive outcomes |
| `warning` | `#f59e0b` | `#fbbf24` | Caution states |
| `danger` | `#ef4444` | `#f87171` | Errors, destructive actions |
| `neutral-50` | `#f8fafc` | `#0f172a` | Page backgrounds |
| `neutral-900` | `#0f172a` | `#f8fafc` | Primary text |

*Deep indigo was chosen over emerald/teal because it signals trust, authority, and professionalism — key for MENA enterprise buyers in HR/government sectors.*

**Typography:**

| Context | Font | Weight Range | Fallback |
|---|---|---|---|
| Latin headings | **Sora** | 600-700 | Inter, system-ui |
| Latin body | **Inter** | 400-500 | system-ui |
| Arabic headings | **Cairo** | 600-700 | Noto Sans Arabic |
| Arabic body | **Noto Sans Arabic** | 400-500 | system-ui |
| Monospace/code | **JetBrains Mono** | 400 | monospace |

**Spacing & Elevation:**
- 4px base grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96)
- Border radius: 6px default, 8px cards, 12px modals, 9999px pills
- Shadows: 3-level elevation system (sm, md, lg) using colored shadows, not gray
- Light + dark mode native with `prefers-color-scheme` auto-detection

### 5.2 Component Stack Upgrade

| Component | Library | Why |
|---|---|---|
| Base primitives | **shadcn/ui (Radix)** | Keep existing — accessible, composable, already in codebase |
| Charts & dashboards | **Tremor** | Vercel-acquired, designed for dashboards, beautiful defaults |
| Landing page blocks | **Aceternity UI / Magic UI** | Animated hero sections, gradient backgrounds, testimonial carousels |
| Page transitions | **Framer Motion 12** | Stagger reveals, shared layout, exit animations |
| Mobile drawers | **Vaul** | iOS-like bottom sheets, essential for mobile assessment taker |
| Command palette | **cmdk** | ⌘K universal search across assessments, participants, results |
| Toasts | **Sonner** | Already present — keep, premium feel |
| Data tables | **TanStack Table** | Sorting, filtering, pagination, column visibility, virtual scrolling |
| Accessibility base | **react-aria** | ARIA patterns for complex widgets (combobox, calendar, etc.) |
| Drag & drop | **@dnd-kit** | Assessment Builder question reordering |
| Date pickers | **react-day-picker** | Hijri + Gregorian calendar support |

### 5.3 Key Screen Redesigns

#### 1. Marketing Landing Page
- **Hero**: Full-width animated gradient (indigo → violet → amber), headline in Arabic + English, animated assessment preview mockup, "Start Free Trial" CTA
- **Social proof**: Client logos (anonymized placeholders initially), "10,000+ assessments delivered" counter with number animation
- **Feature grid**: 3x2 bento grid with icons, hover-reveal descriptions, subtle parallax
- **Pricing table**: 3 columns (Starter / Professional / Enterprise), toggle monthly/annual, highlighted "Most Popular", Arabic + English toggle
- **Testimonials**: Carousel with photo, name, title, company, quote — RTL-aware
- **Footer**: Bilingual sitemap, newsletter signup, social links, legal links

#### 2. Dashboard
- **KPI cards** (Tremor): Total assessments, Active participants, Completion rate, Avg score — with sparkline trends
- **Activity feed**: Real-time timeline of recent events (participant completed, group created, etc.)
- **Assessment status chart**: Donut chart — Draft / Active / Completed / Archived
- **Skeleton loading**: Every async boundary has a shimmer skeleton
- **Empty states**: Illustrated empty states with clear CTAs ("Create your first assessment")
- **Quick actions**: Floating action button or command palette (⌘K)

#### 3. Assessment Builder
- **Split-pane layout**: Left = question list with drag-to-reorder (`@dnd-kit`), Right = question editor/preview
- **Inline AI generation**: "Generate 5 questions about..." button in the question editor, streaming response
- **Live preview**: Toggle to see the assessment exactly as a participant would see it
- **Section management**: Group questions into sections with titles and descriptions
- **Bulk operations**: Select multiple questions → duplicate, delete, move to section, change type
- **Auto-save**: Debounced auto-save with "Saved" indicator

#### 4. Assessment Taker
- **Distraction-free mode**: Clean white/dark background, no navigation chrome, only the question
- **Progress indicator**: Animated progress orb (not a boring bar) — shows completion percentage, time remaining
- **Smooth transitions**: Framer Motion page transitions between questions (slide or fade)
- **Mobile-first**: Thumb-zone button placement, large touch targets (min 44px), swipe navigation option
- **RTL-perfect**: Arabic text flows naturally, button positions mirror correctly
- **Accessibility**: Full keyboard navigation, screen reader announcements for question changes, high contrast mode

#### 5. Results & Reports
- **Animated narrative reveal**: AI-generated narrative text appears with typewriter effect
- **Score visualization**: Radial gauges, bar charts, percentile positioning
- **Comparison views**: Side-by-side candidate comparison with diff highlighting
- **Branded PDF export**: Org logo, colors, professional layout, downloadable
- **Competency radar**: Spider/radar chart for multi-dimension assessment results

#### 6. Organization Settings Hub
- **Tabbed layout**: Branding / Email Providers / AI Providers / Domains / Members / Billing / Security
- **Provider config**: Dropdown-driven, dynamic form fields per provider type
- **Live test buttons**: "Send test email", "Test AI" with inline result display
- **DNS verification chips**: Green (verified) / Yellow (pending) / Red (failed) status indicators
- **Branding preview**: Live preview panel showing how changes affect the dashboard

#### 7. User Notification Center
- **Event grid**: List of all notification events with per-event channel toggles (checkboxes)
- **Template editor**: Split-pane with editor on left, live preview on right
- **Variable picker**: Click-to-insert variables from a dropdown
- **Send log timeline**: Chronological list of sent notifications with status badges

#### 8. Super Admin Console
- **Dense data tables**: TanStack Table with virtual scrolling for 1000+ orgs
- **Global search**: Search across all orgs, users, assessments, domains
- **Audit log timeline**: Filterable timeline of all platform events
- **Cross-tenant domain registry**: See all custom domains, verification status, SSL status
- **System health**: Edge function latency, error rates, active users, DB connection pool

### 5.4 Motion & Micro-Interactions

- **Page transitions**: Fade + slide between routes via Framer Motion `AnimatePresence`
- **Shared layout animations**: Cards expand into detail views smoothly
- **Number counters**: Count-up animations for KPI cards on dashboard load
- **Success confirmations**: Subtle confetti or checkmark animation on assessment completion
- **Skeleton loading**: Shimmer skeletons for every async boundary — never a blank screen
- **Button feedback**: Scale-down on press (0.98), color transition on hover
- **Toast animations**: Slide-in from bottom-right, auto-dismiss with progress bar
- **Respects `prefers-reduced-motion`**: All animations disabled for users who prefer reduced motion

### 5.5 Accessibility

- **WCAG 2.1 AA compliance** across all screens
- **Keyboard navigation**: Full tab order, focus rings, arrow key navigation in tables/lists
- **Screen reader**: ARIA labels, live regions for dynamic content, announcements for page changes
- **High contrast theme**: Additional theme option beyond light/dark
- **Focus management**: Focus trapped in modals, restored on close
- **Color contrast**: All text meets 4.5:1 ratio (body) and 3:1 (large text/icons)
- **Skip navigation links**: "Skip to main content" on every page


---

## Part VI — Technology Migration: Vite to Next.js 15 (App Router)

### 6.1 Why Next.js 15 for Qudurat

| Concern | Vite SPA (Current) | Next.js 15 (Target) | Impact |
|---|---|---|---|
| **SEO** | No SSR, no crawlable marketing pages | SSR/SSG for marketing, `generateMetadata` per route | Critical for MENA + English organic traffic |
| **Bilingual SEO** | Client-side only, no `hreflang` | `next-intl` with locale-prefixed routes, `hreflang` in `<head>` | 2x organic reach (Arabic + English) |
| **Bundle size** | Entire app ships to client | Server Components keep secrets + heavy logic server-side | 40-60% smaller client JS |
| **Multi-tenant routing** | Client-side org context | Middleware extracts tenant from hostname at the edge | Enables subdomain + custom domain (Part IV-A) |
| **Auth** | Client-side token management | `@supabase/ssr` with server-side session refresh in middleware | More secure, no token in localStorage |
| **Data fetching** | `useQuery` everywhere (client) | Server Components fetch on server, no loading spinners for initial data | Better perceived performance |
| **Mutations** | Ad-hoc API calls | Server Actions with `revalidatePath` | Type-safe, progressive enhancement |
| **Performance** | CSR waterfall | Streaming + Suspense boundaries | Faster Time to Interactive |
| **Dev speed** | Vite HMR (fast) | Turbopack in v15 (comparable) | Parity |
| **Deployment** | Vercel (static) | Vercel (edge + serverless) | Same host, more capabilities |

### 6.2 Target Architecture

```
app/
├── [locale]/                          # next-intl locale prefix (/en, /ar)
│   ├── (marketing)/                   # Route group: public marketing pages
│   │   ├── page.tsx                   # Landing page (SSG)
│   │   ├── pricing/page.tsx           # Pricing (SSG)
│   │   ├── about/page.tsx             # About (SSG)
│   │   ├── blog/[slug]/page.tsx       # Blog posts (SSG + ISR)
│   │   └── layout.tsx                 # Marketing layout (no sidebar)
│   │
│   ├── (auth)/                        # Route group: authentication
│   │   ├── login/page.tsx             # Login
│   │   ├── register/page.tsx          # Register
│   │   ├── forgot-password/page.tsx   # Password reset
│   │   └── layout.tsx                 # Auth layout (centered card)
│   │
│   ├── (app)/                         # Route group: authenticated app
│   │   ├── dashboard/page.tsx         # Dashboard (Server Component + client islands)
│   │   ├── assessments/
│   │   │   ├── page.tsx               # Assessment list
│   │   │   ├── new/page.tsx           # Create assessment
│   │   │   ├── [id]/page.tsx          # Assessment detail
│   │   │   └── [id]/edit/page.tsx     # Edit assessment
│   │   ├── groups/
│   │   │   ├── page.tsx               # Group list
│   │   │   ├── new/page.tsx           # Create group
│   │   │   └── [id]/page.tsx          # Group detail + progress
│   │   ├── employees/
│   │   │   ├── page.tsx               # Employee directory
│   │   │   └── [id]/page.tsx          # Employee profile + talent snapshot
│   │   ├── results/
│   │   │   ├── page.tsx               # Results overview
│   │   │   └── [id]/page.tsx          # Individual result
│   │   ├── settings/
│   │   │   ├── page.tsx               # General settings
│   │   │   ├── branding/page.tsx      # Branding editor
│   │   │   ├── email/page.tsx         # Email provider config
│   │   │   ├── ai/page.tsx            # AI provider config
│   │   │   ├── domains/page.tsx       # Domain management
│   │   │   ├── members/page.tsx       # Members & roles
│   │   │   ├── billing/page.tsx       # Billing & subscription
│   │   │   └── security/page.tsx      # Security & audit
│   │   ├── notifications/page.tsx     # Notification preferences
│   │   ├── profile/page.tsx           # User profile
│   │   └── layout.tsx                 # App layout (sidebar + header)
│   │
│   ├── (admin)/                       # Route group: super admin
│   │   ├── page.tsx                   # Admin dashboard
│   │   ├── organizations/page.tsx     # All organizations
│   │   ├── users/page.tsx             # All users
│   │   ├── domains/page.tsx           # Domain registry
│   │   ├── audit/page.tsx             # Global audit log
│   │   └── layout.tsx                 # Admin layout
│   │
│   └── layout.tsx                     # Root locale layout (providers, fonts)
│
├── assess/[token]/                    # Public assessment (NO locale prefix)
│   ├── page.tsx                       # Take assessment
│   └── complete/page.tsx              # Completion page
│
├── api/
│   ├── webhooks/
│   │   ├── stripe/route.ts            # Stripe webhook handler
│   │   └── email/route.ts             # Email provider webhooks (bounces)
│   ├── auth/callback/route.ts         # OAuth callback
│   └── cron/
│       └── verify-domains/route.ts    # Domain verification cron
│
├── providers.tsx                      # 'use client' — all context providers
├── layout.tsx                         # Root layout (html, body, fonts)
└── not-found.tsx                      # 404 page

lib/
├── supabase/
│   ├── client.ts                      # Browser client (createBrowserClient)
│   ├── server.ts                      # Server Component client (createServerClient)
│   └── middleware.ts                  # Middleware client (session refresh)
├── email/
│   ├── types.ts                       # EmailProviderAdapter interface
│   ├── factory.ts                     # createEmailProvider()
│   └── providers/
│       ├── resend.ts
│       ├── mailgun.ts
│       ├── sendgrid.ts
│       ├── ses.ts
│       ├── postmark.ts
│       └── smtp.ts
├── ai/
│   ├── types.ts                       # AiProviderAdapter interface
│   ├── factory.ts                     # createAiProvider()
│   └── providers/
│       ├── openai.ts
│       ├── anthropic.ts
│       ├── gemini.ts
│       ├── azure.ts
│       ├── bedrock.ts
│       ├── mistral.ts
│       ├── deepseek.ts
│       ├── groq.ts
│       ├── ollama.ts
│       └── falcon.ts
├── tenant/
│   ├── resolve.ts                     # Edge-cached tenant resolver
│   └── context.ts                     # Tenant context utilities
├── secrets/
│   └── vault.ts                       # Supabase Vault wrapper
└── utils/
    ├── color-scale.ts                 # OKLCH color scale generation
    └── validators.ts                  # Zod schemas

middleware.ts                          # Three concerns: tenant → auth → locale

messages/
├── en.json                            # English translations
└── ar.json                            # Arabic translations
```

### 6.3 Middleware (Three Concerns)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { resolveTenant } from '@/lib/tenant/resolve';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
});

export async function middleware(request: NextRequest) {
  // Skip for static assets and API routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.match(/\.(ico|svg|png|jpg)$/)
  ) {
    return NextResponse.next();
  }

  // --- Concern 1: Tenant Resolution ---
  const hostname = request.headers.get('host') ?? '';
  const tenant = await resolveTenant(hostname);

  if (!tenant && !hostname.includes('localhost')) {
    return NextResponse.rewrite(new URL('/not-found', request.url));
  }

  // --- Concern 2: Supabase Session Refresh ---
  const response = await updateSession(request);

  // --- Concern 3: Locale Detection & Routing ---
  const intlResponse = intlMiddleware(request);

  // Merge headers
  if (tenant) {
    const finalResponse = intlResponse || response;
    finalResponse.headers.set('x-tenant-id', tenant.id);
    finalResponse.headers.set('x-tenant-subdomain', tenant.subdomain);
    finalResponse.headers.set('x-tenant-plan', tenant.plan);
    return finalResponse;
  }

  return intlResponse || response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
```

### 6.4 Supabase Client Split

```typescript
// lib/supabase/client.ts — Browser (Client Components)
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// lib/supabase/server.ts — Server Components & Server Actions
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### 6.5 Migration Strategy (6 Weeks)

| Week | Phase | Tasks |
|---|---|---|
| **1** | Scaffold | Fresh `create-next-app@latest`, configure Tailwind, shadcn, next-intl, `@supabase/ssr`, TypeScript strict mode, ESLint, Prettier. Write `middleware.ts` skeleton. Keep Vite running in parallel. |
| **2** | Infrastructure | Build providers tree (`providers.tsx`), auth middleware, RLS-aware server client. Test one Server Component (dashboard) + one Server Action (create assessment) end-to-end. |
| **3-4** | Page Migration | Route-by-route migration: marketing → auth → dashboard → assessments → groups → employees → results → settings → admin. Per page: React Router → file-based route, Helmet → `generateMetadata`, data fetching → Server Components, interactive parts → `'use client'`. |
| **5** | Specialized | PWA (`vite-plugin-pwa` → Serwist), PDF generation (keep as client-only `dynamic(() => import(...), { ssr: false })`), i18n (`translations.ts` → `messages/en.json` + `messages/ar.json`), env vars (`VITE_*` → `NEXT_PUBLIC_*`). |
| **6** | Cutover | QA pass on all routes, dual-deploy staging, Vercel production cutover, retire Vite build, update CI/CD. |

### 6.6 Conversion Reference

| Vite / React Router | Next.js 15 |
|---|---|
| `<Route path="/assess/:token">` | `app/assess/[token]/page.tsx` |
| `useNavigate()` | `useRouter()` from `next/navigation` |
| `useParams()` | `params` prop (server) or `useParams()` (client) |
| `<Helmet><title>...</title></Helmet>` | `export async function generateMetadata()` |
| `import { supabase } from '@/integrations/supabase/client'` | `import { createClient } from '@/lib/supabase/server'` (server) |
| Context providers in `App.tsx` | `'use client'` wrapper in `app/providers.tsx` |
| `localStorage.getItem(...)` | Guard with `useEffect` or `dynamic({ ssr: false })` |
| `import html2canvas from 'html2canvas'` | `dynamic(() => import(...), { ssr: false })` |
| `VITE_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `vite-plugin-pwa` | Serwist (`@serwist/next`) |

### 6.7 Deployment & Data Residency

- **Primary**: Vercel (Frankfurt region `fra1` — lowest latency to MENA)
- **Database**: Supabase Frankfurt region
- **CDN**: Vercel Edge Network (auto, global)
- **Storage**: Supabase Storage (logos, certificates) or Cloudflare R2 (cheaper egress)
- **Sovereign roadmap**:
  - AWS Bahrain (`me-south-1`) — for KSA PDPL requirements
  - Azure UAE (`uae-north`) — for UAE DDLNP requirements
  - Self-hosted option for government/defense (Docker + K8s)


---

## Part VII — Production Hardening

### 7.1 Security Headers

```javascript
// next.config.js
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '0' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Tighten after audit
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];
```

### 7.2 Edge Function Hardening

- **Re-enable `verify_jwt`** on all edge functions except `get-assessment` and `submit-assessment` (public routes)
- **Tighten CORS**: Replace `*` with explicit allowed origins per tenant custom domain
- **Rate limiting**: Upstash Redis-based rate limiter — 100 req/min per IP for public endpoints, 1000 req/min for authenticated
- **Input validation**: Zod schemas for every edge function request body
- **Error sanitization**: Never expose internal error messages to clients

### 7.3 Secret Cleanup

1. **Purge `.env` from git history**: `git filter-repo --path .env --invert-paths`
2. **Rotate all exposed keys**: Supabase project keys, OpenAI API key, any other secrets
3. **Add to `.gitignore`**: `.env`, `.env.local`, `.env.*.local`, `.env.production`
4. **Move Resend key from DB to Vault**: Migrate `organization_email_settings.resend_api_key` to Supabase Vault encrypted storage
5. **Environment variable audit**: Ensure no secrets in `NEXT_PUBLIC_*` variables

### 7.4 Audit Logging

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  actor_id UUID REFERENCES auth.users(id),
  actor_email TEXT,
  action TEXT NOT NULL,           -- 'assessment.created', 'member.invited', etc.
  target_type TEXT,               -- 'assessment', 'user', 'group', etc.
  target_id UUID,
  metadata JSONB DEFAULT '{}',   -- Action-specific details
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org admins view their audit logs"
  ON audit_logs FOR SELECT
  USING (is_org_admin(organization_id));
```

**Audited actions**: User login/logout, assessment CRUD, group CRUD, participant added/removed, role changed, settings changed, provider configured, domain added/verified, branding updated, subscription changed, API key generated/revoked.

### 7.5 Testing Stack

| Layer | Tool | Coverage Target |
|---|---|---|
| **Unit** | Vitest + React Testing Library | Utility functions, hooks, component rendering |
| **Integration** | Vitest + MSW (Supabase mock) | Server Actions, data flows, auth flows |
| **E2E** | Playwright | Critical user journeys: signup → create assessment → share → complete → view results |
| **Component** | Storybook 8 | Visual regression, component documentation |
| **Type** | TypeScript strict mode | 100% (no `any` escapes) |
| **Lint** | ESLint + Prettier | Consistent code style |
| **Security** | `npm audit` + Snyk | Dependency vulnerability scanning |

**Critical E2E scenarios:**
1. New org signup → onboarding → create first assessment
2. HR admin creates group → adds participants → sends invites
3. Participant receives link → takes assessment → submits → views completion
4. HR admin views results → generates AI narrative → exports PDF
5. Org admin configures branding → preview → save → verify on assessment taker page
6. Org admin configures email provider → test email → success
7. Subscription upgrade → unlock features → limits enforced

### 7.6 CI/CD Pipelines

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test -- --coverage
      - run: npm run build

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging
on:
  push:
    branches: [main]
# Auto-deploy to Vercel staging on merge to main

# .github/workflows/deploy-prod.yml
name: Deploy Production
on:
  push:
    tags: ['v*']
# Deploy to Vercel production on version tag
```

### 7.7 Observability

| Tool | Purpose | Free Tier |
|---|---|---|
| **Sentry** | Error tracking, performance monitoring, session replay | 5K errors/mo |
| **PostHog** | Product analytics, feature flags, session recording | 1M events/mo |
| **Vercel Analytics** | Web Vitals, page views | Included with Vercel |
| **Vercel Speed Insights** | Core Web Vitals monitoring | Included with Vercel |
| **Upstash** | Redis (rate limiting, caching, edge state) | 10K commands/day |

**Structured logging** in edge functions:

```typescript
const log = (level: string, message: string, meta: Record<string, unknown>) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
    request_id: crypto.randomUUID(),
  }));
};
```

---

## Part VIII — Monetization

### 8.1 Payment Processor Comparison

| Factor | Stripe | Lemon Squeezy | Paddle |
|---|---|---|---|
| **Merchant of Record** | No (you handle VAT) | Yes | Yes |
| **MENA VAT handling** | Manual | Automatic | Automatic |
| **KSA VAT (15%)** | You calculate & remit | Handled | Handled |
| **UAE VAT (5%)** | You calculate & remit | Handled | Handled |
| **Egypt VAT (14%)** | You calculate & remit | Handled | Handled |
| **Invoice generation** | Via Stripe Billing | Built-in | Built-in |
| **Customer portal** | Yes (hosted) | Yes (hosted) | Yes (hosted) |
| **Webhooks** | Excellent | Good | Good |
| **Revenue share** | 2.9% + 30¢ | 5% + 50¢ | 5% + 50¢ |
| **Enterprise invoicing** | Yes (Stripe Invoicing) | Limited | Limited |

**Recommendation**: Use **Lemon Squeezy or Paddle** as primary for self-serve (Merchant of Record handles MENA VAT complexity). Offer **Stripe direct invoicing** for Enterprise tier (these clients have their own VAT processes).

### 8.2 Plan Structure

| Feature | Starter ($349/mo) | Professional ($999/mo) | Enterprise (Custom) |
|---|---|---|---|
| **Assessments/mo** | 500 | Unlimited | Unlimited |
| **Organizations** | 1 | 3 | 10+ |
| **Users** | 5 | 25 | Unlimited |
| **Assessment types** | All | All | All |
| **AI question generation** | 100 questions/mo | 1,000 questions/mo | Unlimited |
| **AI narrative reports** | Basic | Full | Full + custom prompts |
| **Templates library** | 5 templates | All templates | All + custom |
| **Branding** | Logo + primary color | Full branding | Full + white-label |
| **Custom domain** | No | Yes | Yes |
| **Email provider** | Qudurat shared | Custom provider | Custom provider |
| **AI provider** | Qudurat shared | BYOK | BYOK + managed option |
| **Proctoring** | Basic (tab detection) | Full | Full + webcam |
| **API access** | No | Read-only | Full CRUD |
| **Integrations** | No | Slack, basic ATS | All ATS/HRIS + SSO |
| **Support** | Email | Email + chat | Dedicated CSM |
| **Data residency** | Shared (EU) | Shared (EU) | Region-locked |
| **SLA** | 99.5% | 99.9% | 99.95% + DPA |

**Add-ons** (any tier):
- AI Narratives Premium: +$150/mo (advanced multi-section reports)
- Video Interview Module: +$250/mo (Qudurat 2.0)
- Advanced Proctoring: +$100/mo (webcam + behavioral analysis)
- SAP SuccessFactors Connector: +$200/mo

**Annual billing**: 20% discount (2 months free)

**14-day free trial**: Full Professional features, lifecycle emails at T-7, T-3, T-1

### 8.3 Server-Side Limit Enforcement

```sql
-- Function to check subscription limits before inserts
CREATE OR REPLACE FUNCTION check_subscription_limit(
  p_org_id UUID,
  p_resource TEXT  -- 'assessments', 'groups', 'participants', 'users'
) RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get current count
  EXECUTE format(
    'SELECT COUNT(*) FROM %I WHERE organization_id = $1',
    p_resource
  ) INTO current_count USING p_org_id;

  -- Get limit from subscription
  SELECT CASE p_resource
    WHEN 'assessments' THEN max_assessments
    WHEN 'groups' THEN max_groups
    WHEN 'participants' THEN max_participants_per_group
    WHEN 'users' THEN max_users
  END INTO max_allowed
  FROM organization_subscription_limits
  WHERE organization_id = p_org_id;

  RETURN current_count < COALESCE(max_allowed, 999999);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 8.4 Billing Database Schema

```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,  -- 'starter', 'professional', 'enterprise'
  price_monthly_usd NUMERIC(10,2),
  price_annual_usd NUMERIC(10,2),
  max_assessments INTEGER,
  max_groups INTEGER,
  max_users INTEGER,
  max_ai_questions INTEGER,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE REFERENCES organizations(id),
  plan_id UUID REFERENCES plans(id),
  external_id TEXT,           -- Stripe/Lemon Squeezy subscription ID
  status TEXT NOT NULL CHECK (status IN ('trialing','active','past_due','canceled','paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  subscription_id UUID REFERENCES subscriptions(id),
  external_id TEXT,
  amount_usd NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','open','paid','void','uncollectible')),
  invoice_url TEXT,
  pdf_url TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  metric TEXT NOT NULL,  -- 'assessments_created', 'ai_questions_generated', 'emails_sent'
  quantity INTEGER NOT NULL DEFAULT 1,
  recorded_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Part IX — Legal & Compliance

### 9.1 Required Legal Documents

| Document | Status | Priority | Notes |
|---|---|---|---|
| **Terms of Service** | Missing | Critical | Must exist before accepting payments |
| **Privacy Policy** | Missing | Critical | GDPR + PDPL + DDLNP required |
| **Data Processing Agreement** | Missing | Critical | Required for enterprise B2B |
| **Cookie Policy** | Missing | High | Required by GDPR |
| **Acceptable Use Policy** | Missing | Medium | Prevent platform abuse |
| **Sub-processor List** | Missing | High | GDPR Art. 28 requirement |
| **Security Whitepaper** | Missing | Medium | Enterprise sales enablement |

### 9.2 GDPR Compliance

- **Data export**: API endpoint to export all user data as JSON/CSV (Art. 15 - Right of Access)
- **Right to deletion**: Cascade delete user data across all tables, anonymize audit logs (Art. 17)
- **Consent tracking**: Record when/how consent was obtained for each processing purpose
- **Data minimization**: Audit what data is collected vs. what's actually needed
- **Breach notification**: Runbook for 72-hour notification to DPA + affected users
- **DPO designation**: Required if processing employee data at scale

### 9.3 Saudi PDPL (Personal Data Protection Law)

- **Data residency**: Personal data of Saudi residents must be processable within KSA or with explicit consent for cross-border transfer
- **Cross-border transfer**: Requires adequacy decision or binding corporate rules
- **SDAIA registration**: Register with Saudi Data & AI Authority as a data controller
- **Consent language**: Arabic consent notices required
- **Roadmap**: Deploy Supabase on AWS Bahrain (`me-south-1`) for KSA-resident data

### 9.4 UAE DDLNP (Data Protection Law)

- **UAE DIFC/ADGM**: Separate data protection regimes for free zones
- **Cross-border**: Adequate protection required for international transfers
- **Data residency**: Some government entities require UAE-based storage
- **Roadmap**: Azure UAE North (`uae-north`) deployment option

### 9.5 Cookie Consent

```typescript
// components/CookieConsent.tsx
// Categories:
// - Necessary (always on): auth cookies, CSRF tokens, session
// - Analytics (opt-in): PostHog, Vercel Analytics
// - Marketing (opt-in): future retargeting pixels

// Implementation: use a lightweight banner library (e.g., cookie-consent-banner)
// Store preference in cookie + DB for logged-in users
// Gate PostHog/analytics initialization on consent
```

### 9.6 Certifications Roadmap

| Certification | Timeline | Cost Estimate | Purpose |
|---|---|---|---|
| **SOC 2 Type I** | Month 6-9 | $15K-30K | Point-in-time security posture |
| **SOC 2 Type II** | Month 12-15 | $20K-50K | Ongoing security assurance |
| **ISO 27001** | Month 15-18 | $30K-60K | International security standard |
| **IRAP** (if AU market) | Month 18+ | $40K+ | Australian government |


---

## Part X — Go-to-Market Enablers

### 10.1 Email Lifecycle

Wire the existing email settings model to actual send logic via the pluggable provider architecture (Part IV-A):

| Email | Trigger | Template Variables |
|---|---|---|
| **Welcome** | User signs up | `{name}`, `{org_name}`, `{login_url}` |
| **Invite** | Participant added to group | `{participant_name}`, `{assessment_title}`, `{assess_url}`, `{deadline}` |
| **Reminder (T-3d)** | 3 days before deadline | `{participant_name}`, `{assessment_title}`, `{assess_url}`, `{days_remaining}` |
| **Reminder (T-1d)** | 1 day before deadline | Same as above |
| **Reminder (T-4h)** | 4 hours before deadline | Same + `{hours_remaining}` |
| **Completion** | Participant submits | `{participant_name}`, `{assessment_title}`, `{score}` (if org allows) |
| **Result Ready** | AI narrative generated | `{hr_admin_name}`, `{participant_name}`, `{results_url}` |
| **Trial Ending (T-7d)** | 7 days before trial ends | `{org_name}`, `{days_remaining}`, `{upgrade_url}` |
| **Trial Ending (T-3d)** | 3 days before | Same |
| **Trial Ending (T-1d)** | 1 day before | Same |
| **Trial Expired** | Trial ends | `{org_name}`, `{upgrade_url}` |
| **Payment Failed** | Invoice payment fails | `{org_name}`, `{amount}`, `{update_payment_url}` |
| **Password Reset** | User requests reset | `{name}`, `{reset_url}` |

### 10.2 Marketing Site

Built as part of the Next.js migration — SSG pages in `(marketing)` route group:

- **Landing page** (`/`): Hero, features, social proof, pricing, testimonials, CTA
- **Pricing** (`/pricing`): Plan comparison table, FAQ, annual toggle
- **About** (`/about`): Team, mission, vision, MENA focus story
- **Blog** (`/blog`): Content marketing (assessment best practices, MENA hiring trends, Vision 2030)
- **Customers** (`/customers`): Case studies, testimonials, logo wall
- **Documentation** (`/docs`): User guides, API docs, FAQ
- **Contact** (`/contact`): Sales form, support links, office locations

All pages available in Arabic (`/ar/...`) and English (`/en/...`) with `hreflang` tags.

### 10.3 SEO Strategy

- **`generateMetadata`** on every route with localized titles, descriptions, keywords
- **`hreflang`** via next-intl: `<link rel="alternate" hreflang="ar" href="/ar/..." />`
- **Sitemap**: Auto-generated per locale via `app/sitemap.ts`
- **OG images**: Dynamic via `@vercel/og` — assessment titles, org branding
- **Structured data**: `Organization`, `SoftwareApplication`, `FAQ`, `BreadcrumbList`
- **Core Web Vitals**: Target all green (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- **Arabic SEO keywords**: تقييم الموظفين، اختبارات التوظيف، تقييم المهارات، اختبار القدرات

### 10.4 Documentation

- **User Knowledge Base**: How-to articles for HR admins (creating assessments, managing groups, reading reports)
- **API Reference**: OpenAPI/Swagger auto-generated docs (Qudurat 2.0)
- **Architecture Guide**: Internal technical documentation for development team
- **In-app Onboarding Tour**: Step-by-step guided tour on first login (tooltip-based)

### 10.5 Support Stack

| Tool | Purpose | Tier |
|---|---|---|
| **Intercom or HelpScout** | Live chat, knowledge base, ticket management | All tiers |
| **Instatus** | Public status page (status.qudurat.com) | All tiers |
| **Discord or Slack Community** | User community, feature requests, peer support | Optional |
| **Calendly** | Enterprise demo scheduling | Enterprise |

---

## Part XI — Execution Roadmap

### 11.1 Phase 1 — Foundation (Weeks 1-6)

**Exit Criteria**: Secure, tested, Next.js-based app deployed to staging with CI/CD pipeline.

| Week | Focus | Deliverables |
|---|---|---|
| 1 | Security & cleanup | `.env` purged from history, `.gitignore` fixed, keys rotated, security headers added, `verify_jwt` re-enabled, CORS tightened |
| 2 | Next.js scaffold | Next.js 15 project initialized, Tailwind + shadcn configured, `middleware.ts` (tenant + auth + locale), Supabase SSR client |
| 3 | Migration wave 1 | Marketing pages (SSG), auth pages, dashboard migrated to Next.js |
| 4 | Migration wave 2 | Assessment CRUD, groups, employees, results migrated |
| 5 | Testing & CI/CD | Vitest setup, critical E2E tests (Playwright), GitHub Actions CI pipeline, Storybook |
| 6 | Billing integration | Stripe/Lemon Squeezy checkout, webhooks, server-side limit enforcement, customer portal |

### 11.2 Phase 2 — Product (Weeks 7-12)

**Exit Criteria**: Tenant self-service fully functional, email lifecycle operational, UI transformation complete.

| Week | Focus | Deliverables |
|---|---|---|
| 7 | Email provider system | `EmailProviderAdapter` abstraction, Resend + SMTP adapters, tenant email settings UI, test email flow |
| 8 | AI provider system | `AiProviderAdapter` abstraction, OpenAI + Anthropic adapters, tenant AI settings UI, prompt templates |
| 9 | Domain management | Subdomain creation, custom domain verification flow, middleware tenant resolution, SSL provisioning |
| 10 | Branding system | Full branding editor UI, color scale generator, CSS variable injection, email branding, certificate templates |
| 11 | Notification system | Event preferences UI, custom email templates, notification log, digest engine |
| 12 | UI transformation | Component upgrades (Tremor, cmdk, Vaul), motion system, page transitions, dark mode, accessibility sweep |

### 11.3 Phase 3 — Launch (Weeks 13-16)

**Exit Criteria**: Production-ready for paid customers, legal docs in place, marketing site live.

| Week | Focus | Deliverables |
|---|---|---|
| 13 | Legal & compliance | ToS, Privacy Policy, DPA, cookie consent banner, audit logging UI |
| 14 | Observability | Sentry, PostHog, Vercel Analytics, structured logging, error boundaries |
| 15 | GTM assets | Marketing site (SSG), SEO optimization, email templates, onboarding tour, documentation |
| 16 | Launch prep | Production cutover, beta user onboarding, monitoring dashboards, support setup, launch announcement |

### 11.4 Team Structure

**Minimum Viable Team (3 people):**
- 1 Full-stack engineer (Next.js + Supabase + integrations)
- 1 UI/UX designer (brand system + screen designs + Figma components)
- 1 Product manager (roadmap, user research, GTM coordination)

**Ideal Team (8 people):**
- 2 Frontend engineers (Next.js, React, component library)
- 1 Backend engineer (Supabase, edge functions, integrations)
- 1 DevOps/SRE (CI/CD, monitoring, infrastructure)
- 1 QA engineer (E2E testing, accessibility, security testing)
- 1 UI/UX designer
- 1 Product manager
- 1 Technical writer / content (docs, marketing content, Arabic localization)

### 11.5 Budget Estimates (Monthly)

| Category | Item | Cost/mo |
|---|---|---|
| **Infrastructure** | Vercel Pro | $20 |
| | Supabase Pro | $25 |
| | Upstash Redis | $10 |
| | Domain (qudurat.com) | ~$1 |
| **Observability** | Sentry Team | $26 |
| | PostHog (free tier) | $0 |
| **Email** | Resend (platform default) | $20 |
| **AI** | OpenAI API (platform default) | ~$50-200 |
| **Billing** | Lemon Squeezy | 5% of revenue |
| **Legal** | ToS/Privacy/DPA drafting (one-time) | $3K-8K |
| **Design** | Figma | $15 |
| **CI/CD** | GitHub Actions | Free (public) / $4 (private) |
| **Total (pre-revenue)** | | ~$170-370/mo + legal one-time |

### 11.6 Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Evalufy competitive response** | High | Medium | Differentiate on depth (cognitive/personality vs. video-only), Arabic-native AI, self-service configuration |
| **Arabic LLM quality** | Medium | High | Multi-provider approach (BYOK), human-in-the-loop review, Falcon/JAIS partnership pipeline |
| **MENA enterprise sales cycle** | High | High | Free trial + self-serve for mid-market; dedicated sales for enterprise; partner channel via consultancies |
| **Next.js migration regressions** | Medium | Medium | Incremental migration, parallel running, comprehensive E2E tests, staging environment |
| **PDPL/DDLNP compliance complexity** | Medium | High | Legal counsel specializing in MENA data protection, sovereign deployment roadmap |
| **Key person dependency** | High | High | Document architecture decisions, use standard frameworks, maintain high test coverage |
| **Scope creep in v1.0** | High | Medium | Strict feature freeze per phase, defer Qudurat 2.0 features ruthlessly |

---

## Part XII — Appendices

### Appendix A — File-Level Issue List

| File / Path | Issue | Fix |
|---|---|---|
| `src/.env` | Committed to git with secrets | Purge from history, rotate keys |
| `.gitignore` | Missing `.env*` | Add `.env`, `.env.local`, `.env.*.local` |
| `vercel.json` | No security headers | Add headers config (see Part VII) |
| `supabase/config.toml` | `verify_jwt = false` (all functions) | Enable `verify_jwt = true` except public endpoints |
| `supabase/functions/*/index.ts` | `Access-Control-Allow-Origin: *` | Restrict to known origins |
| `src/pages/TakeAssessment.tsx` | 83KB, not lazy-loaded | Split into sub-components, use `React.lazy()` or Next.js dynamic import |
| `src/pages/AssessmentBuilder.tsx` | 55KB, not lazy-loaded | Same treatment |
| `src/i18n/translations.ts` | ~2000 keys in single file | Split into `messages/en.json` + `messages/ar.json` (Next.js migration) |
| `src/integrations/supabase/client.ts` | Single client for all contexts | Split into client/server/middleware variants |
| `README.md` | Lovable boilerplate | Rewrite with Qudurat branding and setup instructions |
| `organization_email_settings` table | `resend_api_key` in plaintext | Migrate to Supabase Vault encrypted storage |

### Appendix B — Vite to Next.js Migration Checklist

- [ ] Initialize Next.js 15 project with TypeScript, Tailwind, App Router
- [ ] Configure `next.config.js` (security headers, images, redirects)
- [ ] Set up `middleware.ts` (tenant resolution, auth, locale)
- [ ] Install and configure `next-intl` with `messages/en.json` + `messages/ar.json`
- [ ] Install and configure `@supabase/ssr` (client, server, middleware splits)
- [ ] Create `app/providers.tsx` with all context providers (`'use client'`)
- [ ] Migrate marketing pages to `(marketing)` route group (SSG)
- [ ] Migrate auth pages to `(auth)` route group
- [ ] Migrate dashboard to `(app)/dashboard` (Server Component + client islands)
- [ ] Migrate assessment CRUD pages
- [ ] Migrate group management pages
- [ ] Migrate employee pages
- [ ] Migrate results pages
- [ ] Migrate settings pages (expand for tenant self-service)
- [ ] Migrate admin pages to `(admin)` route group
- [ ] Migrate public assessment route (`/assess/[token]`)
- [ ] Convert all `<Helmet>` to `generateMetadata`
- [ ] Replace `useNavigate()` with `useRouter()`
- [ ] Replace `useParams()` with server params prop or client `useParams()`
- [ ] Replace `VITE_*` env vars with `NEXT_PUBLIC_*`
- [ ] Migrate PWA from `vite-plugin-pwa` to Serwist (`@serwist/next`)
- [ ] Move PDF generation to dynamic import (`{ ssr: false }`)
- [ ] Guard all `localStorage` reads with `useEffect`
- [ ] Set up Stripe/Lemon Squeezy webhook API routes
- [ ] Set up domain verification cron API route
- [ ] Add `generateMetadata` with `hreflang` on all routes
- [ ] Create `app/sitemap.ts` for locale-aware sitemap
- [ ] Configure Vercel deployment (region, env vars)
- [ ] QA all routes in both Arabic and English
- [ ] Performance audit (Core Web Vitals)
- [ ] Retire Vite configuration files

### Appendix C — Competitor Feature Matrix (Extended)

*See Section 3.2 for the full comparison table. Key takeaway: No competitor combines Arabic-native AI, comprehensive assessment types (cognitive + personality + behavioral + SJT + language), tenant self-service configuration (email/AI/domain/branding), and mid-market pricing. Qudurat occupies a unique position.*

### Appendix D — UI Inspiration Gallery

Reference products for design quality benchmarks:

| Product | What to Learn |
|---|---|
| **Linear** | Dense information display, keyboard-first, dark mode excellence, subtle animations |
| **Stripe** | Dashboard design, data visualization, documentation quality, settings UX |
| **Notion** | Flexible layout, block-based editing, command palette, multilingual support |
| **Vercel** | Developer-facing dashboard, deployment status UX, minimal chrome, speed |
| **Attio** | CRM dashboard, relationship visualization, modern table design |
| **Raycast** | Command palette design, keyboard shortcuts, extension system |
| **Cal.com** | Open-source scheduling, clean forms, booking UX, multi-timezone |
| **Resend** | Email dashboard, clean developer experience, domain verification UX |

### Appendix E — Glossary

| Term | Definition |
|---|---|
| **PDPL** | Saudi Personal Data Protection Law — governs personal data processing in KSA |
| **DDLNP** | UAE Data Protection Law (Federal Decree-Law No. 45 of 2021) |
| **HRDF** | Saudi Human Resources Development Fund — provides training subsidies |
| **Vision 2030** | Saudi Arabia's strategic framework to diversify the economy and develop sectors |
| **NAFIS** | UAE's Emiratisation program — financial incentives for hiring UAE nationals |
| **Nitaqat** | Saudi labor localization system — color-coded compliance bands |
| **Tawteen** | Oman's workforce nationalization program |
| **CAT** | Computer Adaptive Testing — adjusts question difficulty based on responses |
| **IRT** | Item Response Theory — statistical framework for adaptive testing |
| **SJT** | Situational Judgment Test — presents realistic workplace scenarios |
| **ESCO** | European Skills, Competencies, Qualifications — EU standard skill taxonomy |
| **SFIA** | Skills Framework for the Information Age — IT skills framework |
| **RLS** | Row Level Security — Postgres feature for data isolation |
| **SSR** | Server-Side Rendering — HTML generated on the server per request |
| **SSG** | Static Site Generation — HTML generated at build time |
| **RSC** | React Server Components — components that run only on the server |
| **BYOK** | Bring Your Own Key — customer provides their own API keys |
| **MoR** | Merchant of Record — entity that handles tax collection and remittance |
| **DPA** | Data Processing Agreement — contract between data controller and processor |
| **SOC 2** | Service Organization Control 2 — security compliance framework |
| **WCAG** | Web Content Accessibility Guidelines — W3C accessibility standard |
| **OKLCH** | Perceptually uniform color space — used for generating consistent color scales |

### Appendix F — Source References

**Market Research:**
- LinkedIn Global Talent Trends Report (2025)
- Gartner Magic Quadrant for Talent Assessment Tools
- Josh Bersin "HR Technology Market" reports
- SHRM Talent Assessment Survey
- Mercer MENA Compensation & Benefits Survey

**Competitor Intelligence:**
- SHL: shl.com — Products, Solutions, Science pages
- Mercer Mettl: mettl.com — Pricing, Features, Integrations
- TestGorilla: testgorilla.com — Test Library, Pricing, Blog
- Evalufy: evalufy.com — Features, Clients, Arabic marketing materials
- HireVue: hirevue.com — Platform, Science, Enterprise
- Criteria Corp: criteriacorp.com — Assessments, Pricing, Resources

**Technology:**
- Next.js 15 Documentation (nextjs.org/docs)
- Supabase SSR Guide (supabase.com/docs/guides/auth/server-side)
- next-intl Documentation (next-intl-docs.vercel.app)
- Serwist PWA Documentation (serwist.pages.dev)
- Vercel Edge Config Documentation
- Stripe Billing Documentation
- Lemon Squeezy Developer Docs

**Legal & Compliance:**
- Saudi PDPL Full Text (National Data Management Office)
- UAE Federal Decree-Law No. 45 of 2021
- GDPR Full Text (gdpr-info.eu)
- NYC Local Law 144 (Automated Employment Decision Tools)
- EU AI Act (Regulation 2024/1689)

---

> **This document is a living plan.** Implementation of any part requires explicit approval. No code changes, configuration changes, or dependency updates have been made — this is a pure documentation deliverable for review and discussion.
>
> **Next step**: Review this plan, provide feedback, and prioritize which parts to implement first.

---

*Generated for the Qudurat project — April 2026*
