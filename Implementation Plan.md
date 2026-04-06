# Jadarat Assess — Implementation Plan

This plan is organized into **reviewable parts**. Each part is independently scoped, has clear deliverables, acceptance criteria, and dependencies. Approve part by part; implementation begins only after your written approval of that part.

**Legend:** [P0] must-have · [P1] important · [P2] nice-to-have
**Effort:** S (≤3d) · M (1w) · L (2w) · XL (3w+)

---

## Phase 0 — Foundations (Commercial Unblock)

Goal: make the platform chargeable, communicable, and observable. Nothing after this phase works without these primitives.

### Part 1 — Transactional Email Engine [P0] [M]
**Why:** every workflow (invites, reminders, resets, billing) is blocked without it.
**Scope:**
- Integrate Resend (or SES) via Supabase Edge Function `send-email`
- Branded base template (EN/AR, RTL-aware, org logo + color)
- Wire existing `email_templates` table as the content source
- Template variables engine (handlebars-style)
- Delivery log table (status, provider id, error, retries)
- Admin UI: preview, test-send, resend from log
- Domain setup docs (SPF/DKIM/DMARC) for `jadarat-assess.com`

**Acceptance:**
- Send test email from any template in EN and AR
- Delivery log visible in Super Admin
- Bounce/complaint webhook captured
- P95 send latency < 5s

**Dependencies:** none
**Risks:** domain warm-up, Arabic rendering in email clients

---

### Part 2 — Authentication Hardening [P0] [M]
**Scope:**
- Email verification on signup (block protected routes until verified)
- Proper password reset flow (request → email → set new → confirmation)
- Magic-link invitations for HR Admins (replace manual password sharing)
- Session timeout + "remember me"
- 2FA (TOTP) for `super_admin` and `org_admin` (opt-in in v1, enforced in Phase 2)
- Security event emails (new device login, role change, 2FA enabled)

**Acceptance:**
- New admin invited via email can set their own password
- 2FA can be enabled and enforced at login
- All security events generate an email + audit entry

**Dependencies:** Part 1 (email), Part 4 (audit log)

---

### Part 3 — Scheduled Job Runner [P0] [S]
**Scope:**
- Enable `pg_cron` on Supabase (or external worker if preferred)
- Cron jobs framework + job log table
- Jobs registered:
  - `group-activate` (every 5 min): move Scheduled → Active
  - `group-expire` (every 5 min): move Active → Closing/Closed
  - `send-reminders` (hourly): T-3d / T-1d / T-2h cadence
  - `quota-rollup` (nightly): recompute org usage counters
  - `audit-retention` (nightly): enforce retention policy
- Observability: last run, duration, success/failure, manual re-run

**Acceptance:**
- Jobs run on schedule with logs visible in Super Admin
- Manual re-run works
- Alert on 2 consecutive failures

**Dependencies:** none (used by Part 5, Part 8, Part 10)

---

### Part 4 — Audit Log [P0] [S]
**Scope:**
- `audit_events` table: actor_id, org_id, action, target_type, target_id, metadata jsonb, ip, user_agent, created_at
- Write helper used across edge functions and protected mutations
- Super Admin + Org Admin UI to browse/filter/export
- Coverage: auth events, user/role changes, assessment publish, group lifecycle, billing events, data export/delete, impersonation

**Acceptance:**
- Every sensitive mutation writes an audit row
- Org Admin can export last 90 days as CSV
- Retention policy configurable per org (default 365d)

**Dependencies:** none

---

### Part 5 — Error Tracking & Monitoring [P0] [S]
**Scope:**
- Sentry for React + Edge Functions (release tagging, source maps)
- Global error boundary in React
- Uptime monitoring (Better Stack) on `/`, `/auth`, `/assess/:token`, edge function health
- Public status page
- Slack/email alerts

**Acceptance:**
- Errors surface in Sentry with user/org context (no PII leakage)
- Uptime <99% triggers alert within 5 min
- Status page reachable at `status.jadarat-assess.com`

**Dependencies:** none

---

## Phase 1 — Monetization

Goal: accept payments, enforce plans, run trials end-to-end.

### Part 6 — Billing & Subscriptions (Stripe) [P0] [L]
**Scope:**
- Stripe products: Free, Starter, Professional, Enterprise
- Checkout session from `/subscription` page
- Stripe webhook edge function (`subscription.created/updated/deleted`, `invoice.*`)
- Customer portal link
- Plan change proration, annual/monthly toggle
- Invoice list in Org Admin UI
- VAT handling (KSA/UAE), currency (SAR/AED/USD)
- Trial logic (14 days, card optional)
- Dunning sequence (retry emails, read-only lock on final fail)

**Acceptance:**
- Self-serve upgrade from Free to Starter with a test card
- Webhook updates `organizations.plan` within 10s
- Failed payment triggers dunning sequence
- Invoices downloadable by Org Admin

**Dependencies:** Part 1 (email), Part 3 (cron), Part 4 (audit)

---

### Part 7 — Quota Enforcement & Feature Gating [P0] [M]
**Scope:**
- Central `PLAN_LIMITS` catalog with per-plan feature flags
- Server-side enforcement on mutations (create assessment, add participant, generate AI, invite user)
- 80% / 100% quota emails and in-app banners
- Upgrade CTA on blocked actions
- Monthly reset via cron (Part 3)
- Usage dashboard per org

**Acceptance:**
- Exceeding quota blocks mutation with friendly upgrade prompt
- Alerts fire at 80% and 100%
- Monthly counters reset correctly

**Dependencies:** Part 3, Part 6

---

### Part 8 — Self-Serve Signup & Trial [P0] [M]
**Scope:**
- Public `/signup` page: name, work email, org name, password
- Auto-provisions org on Free trial (14 days Professional features)
- Email verification required before first action
- Welcome email + trial-ending sequence (T-7/T-3/T-1/T-0)
- Sample assessment seeded on signup

**Acceptance:**
- New user can sign up, verify email, and reach dashboard with sample content
- Trial-end sequence converts or downgrades automatically

**Dependencies:** Part 1, Part 2, Part 3, Part 6

---

## Phase 2 — Activation & Retention

Goal: make every new customer reach first value fast and stay.

### Part 9 — Onboarding Wizard & Checklist [P0] [M]
**Scope:**
- First-run wizard: brand (logo/color), language, timezone, invite team
- Persistent activation checklist on dashboard (6 steps: brand set, user invited, assessment created, group launched, participant completed, report exported)
- Per-step nudges via email if stalled
- Dismissible once 100% complete

**Acceptance:**
- New org reaches first published assessment in ≤30 min median
- Activation % visible in Super Admin

**Dependencies:** Part 1, Part 8

---

### Part 10 — Campaign Automation [P0] [L]
**Scope:**
- Group state machine: Draft → Scheduled → Active → Closing → Closed → Archived
- Pre-launch checklist (quota, dates, branding, participants, test link) blocking activation
- Automated invitation send on activation
- Reminder cadence: T-3d, T-1d, T-2h, overdue (configurable per group)
- Grace period (configurable, default 24h) before hard close
- End-of-cycle stakeholder digest email to HR Admin
- Dry-run / test mode (send to HR only)

**Acceptance:**
- Creating a group with future dates auto-activates at startDate
- Non-starters receive reminders per configured cadence
- endDate triggers grace period then close and digest email

**Dependencies:** Part 1, Part 3, Part 4

---

### Part 11 — Participant Experience Upgrades [P0] [M]
**Scope:**
- Explicit consent + privacy notice screen (logged)
- Practice item support for cognitive/language types
- Robust autosave + resume-where-left-off
- Integrity signal capture server-side (tab-switch, paste, timing anomalies)
- Post-completion 1-click NPS
- Thank-you follow-up email

**Acceptance:**
- Participant can close browser and resume same session
- Integrity signals visible on HR report
- Consent timestamped and auditable

**Dependencies:** Part 1, Part 4

---

### Part 12 — Reporting & Insights v2 [P1] [L]
**Scope:**
- Drop-off funnel per group
- Segment filters (department, job title, location)
- Cohort comparison view
- Stakeholder digest template (EN/AR, branded)
- Decision capture on individual reports (promote/develop/park + notes)
- Scheduled/recurring report delivery

**Acceptance:**
- HR can compare two cohorts side-by-side
- Digest emails deliver on cycle close with PDF attached
- Decisions visible on employee profile

**Dependencies:** Part 1, Part 10

---

### Part 13 — Help Center & Support Widget [P1] [M]
**Scope:**
- In-app help widget (Crisp or Intercom)
- Knowledge base site (Mintlify/Docusaurus) EN/AR
- Contextual tooltips on key pages
- Release notes in-app popup
- Ticket integration with email fallback

**Acceptance:**
- Users can open chat from any page
- Top-10 KB articles published in EN and AR
- Release notes delivered on login after new version

**Dependencies:** none

---

## Phase 3 — Quality & Compliance

Goal: unblock enterprise procurement and ensure reliability.

### Part 14 — Test Suite & CI/CD [P0] [L]
**Scope:**
- Vitest for hooks/utils, React Testing Library for components
- Playwright E2E for: signup, create assessment, launch group, take assessment, submit, view report
- GitHub Actions pipeline: lint → typecheck → test → build → Supabase migration check → Vercel preview
- Branch protection rules

**Acceptance:**
- ≥60% coverage on business-critical modules
- All PRs run full pipeline
- E2E runs on preview deploys

**Dependencies:** none

---

### Part 15 — GDPR / PDPL Compliance [P0] [M]
**Scope:**
- Privacy policy + Terms + DPA published
- Cookie consent banner
- Data export flow (per user, per org) — ZIP with signed URL, expires in 24h
- Right to erasure: request → approval → anonymization job
- Retention policy config per org
- Consent log

**Acceptance:**
- User can request and receive data export within 24h
- Erasure request anonymizes all PII, preserves aggregate data
- Policies linked from footer and signup

**Dependencies:** Part 1, Part 3, Part 4

---

### Part 16 — Security Hardening [P0] [M]
**Scope:**
- CORS lockdown per environment (replace wildcards)
- Rate limiting on public endpoints (`register-participant`, `submit-assessment`, `generate-questions`)
- Bot protection (Turnstile/hCaptcha) on public forms
- Secrets management review
- Security headers (CSP, HSTS, X-Frame-Options)
- Enforce 2FA for all admin roles (from Part 2)
- Pen test (third-party) + remediation

**Acceptance:**
- Pen test report with no criticals
- Rate limits verified (429 after threshold)
- CSP passes securityheaders.com A+

**Dependencies:** Part 2, Part 5

---

### Part 17 — TypeScript Strict & Refactor [P1] [M]
**Scope:**
- Enable `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- Eliminate `any` in business-critical paths
- Split oversized pages (`TakeAssessment.tsx`, `AssessmentBuilder.tsx`, `GroupReport.tsx`, `EmployeeDetail.tsx`) into smaller components + hooks
- Centralize data fetching with React Query

**Acceptance:**
- Build passes in strict mode
- No page component >500 LOC
- Single pattern for data fetching across app

**Dependencies:** Part 14

---

## Phase 4 — Enterprise Readiness

### Part 18 — SSO / SAML / SCIM [P0 for Enterprise] [L]
**Scope:**
- WorkOS integration for SAML (Azure AD, Okta, Google Workspace)
- SCIM user provisioning
- Per-org SSO configuration UI
- Fallback password login toggle
- Domain verification

**Acceptance:**
- Test org can log in via Okta SAML
- SCIM creates/updates/deletes users in real time

**Dependencies:** Part 2, Part 4

---

### Part 19 — Custom Roles & Delegated Admin [P1] [M]
**Scope:**
- Roles beyond fixed 3 tiers: custom role builder with permission matrix
- Line Manager role (read-only on assigned teams)
- L&D Reviewer role
- Delegated admin scopes (department-level)

**Acceptance:**
- Org Admin can create a role with selected permissions
- Users see only what their role allows

**Dependencies:** Part 4

---

### Part 20 — Public API & Webhooks [P1] [L]
**Scope:**
- REST API with OAuth2 / API keys, scoped per resource
- Endpoints: assessments, groups, participants, reports, employees
- Webhooks: `group.activated`, `group.closed`, `participant.completed`, `report.ready`, `subscription.updated`
- API docs (OpenAPI + Redoc)
- Rate limits per key
- Developer portal for key management

**Acceptance:**
- Third party can create a group and add participants via API
- Webhook deliveries retried with exponential backoff
- Docs published at `developers.jadarat-assess.com`

**Dependencies:** Part 16

---

### Part 21 — Data Residency & Compliance Program [P1] [XL]
**Scope:**
- KSA region hosting option (Supabase region or self-host)
- Trust Center page (sub-processors, certifications, security posture)
- SOC 2 Type I scoping + evidence collection
- ZATCA e-invoicing for KSA billing
- Access reviews quarterly

**Acceptance:**
- Enterprise customer can contractually require KSA residency
- Trust Center live
- SOC 2 readiness assessment passed

**Dependencies:** Part 15, Part 16

---

## Phase 5 — Platform & Intelligence

### Part 22 — Psychometric QA & AI Guardrails [P1] [M]
**Scope:**
- Automated checks on AI output: duplicate detection, answer-key sanity, reading level, bias/sensitivity, PII, Arabic linguistic quality
- Approval gate for high-stakes assessments
- Item statistics after runs (difficulty, discrimination) fed back to bank
- AI cost & quality telemetry per generation

**Acceptance:**
- Generated items failing checks are flagged pre-save
- Item stats visible on each question in the bank

**Dependencies:** Part 5

---

### Part 23 — Talent Intelligence [P2] [L]
**Scope:**
- Competency/role framework library
- Benchmarks (internal norms first)
- "Ready for next role" indicator
- Talent review packet export (PPTX)
- Manager share links (read-only, expiring)

**Acceptance:**
- HR can export a talent review packet for a cohort
- Manager link works without login and expires

**Dependencies:** Part 12

---

### Part 24 — Integrations [P2] [XL]
**Scope:**
- HRIS connectors (BambooHR, Workday, SuccessFactors)
- Slack/Teams notifications
- Calendar sync for group schedules
- Zapier app

**Dependencies:** Part 20

---

## Cross-Cutting Workstreams

Run continuously alongside phases:

- **Analytics (PostHog):** event tracking per the requirements spec, funnels, session replay (consent-gated)
- **Documentation:** architecture docs, runbooks, API docs, KB articles
- **Design system:** consolidate tokens, a11y audit (WCAG 2.1 AA)
- **Release management:** semver, changelog, release notes in-app
- **Incident response:** on-call rotation, runbooks, postmortems

---

## Proposed Delivery Order & Gate Reviews

1. **Phase 0** (Parts 1–5) — foundations
2. **Gate review** → approve Phase 1
3. **Phase 1** (Parts 6–8) — monetization
4. **Gate review** → approve Phase 2
5. **Phase 2** (Parts 9–13) — activation & retention
6. **Gate review** → approve Phase 3
7. **Phase 3** (Parts 14–17) — quality & compliance
8. **Gate review** → approve Phase 4
9. **Phase 4** (Parts 18–21) — enterprise
10. **Phase 5** (Parts 22–24) — platform & intelligence

Each part ends with: demo, acceptance test walkthrough, rollback plan, updated docs, and written sign-off before moving to the next.

---

## How to Use This Plan

1. Review parts in order.
2. For each part you approve, reply with **"Approved: Part N"** and any scope adjustments.
3. I will then:
   - Open a tracking issue for the part
   - Break it into commits on this branch
   - Post progress updates
   - Request review at the acceptance-criteria stage
4. No work starts on a part without your explicit approval.

**Recommended first approval:** Part 1 (Transactional Email) — it unblocks the largest number of downstream workflows.
