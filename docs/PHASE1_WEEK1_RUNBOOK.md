# Phase 1 — Week 1 Runbook (Live Customer)

> **Context**: There is one active customer using the live product with real data.
> This runbook walks through the Week 1 security hardening steps with zero data loss.
>
> **Total estimated downtime**: 5-15 minutes during deploy window.
>
> **Branch**: `claude/saas-readiness-assessment-p3yw9`
> **Date started**: April 2026

---

## Pre-Flight Checklist (Before ANY Changes)

- [ ] **Take a full database backup** (Supabase Dashboard → Database → Backups → Create manual backup)
- [ ] **Note the current backup timestamp** for rollback reference
- [ ] **Confirm Supabase project has Point-in-Time Recovery enabled** (Pro tier feature — strongly recommended)
- [ ] **Notify the customer** of a ~15 minute maintenance window (template below)
- [ ] **Have the Supabase Dashboard open** in a browser tab
- [ ] **Have the Vercel Dashboard open** in another tab
- [ ] **Have this runbook printed/open on a second screen**

### Customer Notification Template

```
Subject: [Qudurat] Scheduled security maintenance — ~15 min downtime

Hi {customer_name},

We're performing a scheduled security hardening on our platform today.

Maintenance window: {date} from {start} to {start+30min} (GST)
Expected downtime: 5-15 minutes
What's happening:
- Tightening access controls on our edge functions
- Adding security response headers
- Restricting API origins to only authorized domains

Your data is fully backed up and will not be affected.
You may need to log in again after maintenance completes.

Thank you for your patience.

Qudurat Platform Team
```

---

## What the Branch Contains

The `claude/saas-readiness-assessment-p3yw9` branch has these changes ready to review:

| # | Change | File(s) | Impact |
|---|---|---|---|
| 1 | `.gitignore` — add `.env*`, build artifacts, test output | `.gitignore` | Zero — prevents future commits |
| 2 | `.env.example` — template for env vars | `.env.example` (new) | Zero — documentation |
| 3 | Security headers (CSP, HSTS, X-Frame-Options, etc.) | `vercel.json` | Low — may tighten some iframe embeds |
| 4 | Enable `verify_jwt = true` on 4 private edge functions | `supabase/config.toml` | Medium — requires authenticated callers |
| 5 | Shared CORS helper with allowlist | `supabase/functions/_shared/cors.ts` (new) | Medium — blocks unauthorized origins |
| 6 | All 7 edge functions use shared CORS | `supabase/functions/*/index.ts` | Medium — see above |
| 7 | Remove `.env` from git tracking | `.env` | Zero — file stays on disk |

---

## Step-by-Step Deployment

### Step 1 — Review & Merge Branch (You)

1. Review the diff on GitHub: `claude/saas-readiness-assessment-p3yw9` vs `main`
2. Pay attention to these critical sections:
   - `supabase/config.toml` (verify_jwt changes)
   - `supabase/functions/_shared/cors.ts` (new file)
   - `vercel.json` (headers)
3. Merge to `main` when satisfied

### Step 2 — Set Environment Variables (Before Deploy)

**Supabase Edge Functions** — set the `ALLOWED_ORIGINS` secret:

```bash
# In Supabase Dashboard → Project Settings → Edge Functions → Secrets
# Or via CLI:
supabase secrets set ALLOWED_ORIGINS="https://YOUR_PROD_DOMAIN,https://YOUR_PREVIEW_DOMAIN,http://localhost:5173"
```

Replace with the actual origins the customer uses:
- Production domain (e.g., `https://app.yourcustomer.com`)
- Any preview/staging domains
- `http://localhost:5173` for local dev (optional)

**If the customer accesses the app from multiple domains**, list ALL of them. Missing one will block that origin.

### Step 3 — Deploy Frontend to Vercel

Merge to `main` triggers Vercel auto-deploy. Wait for deploy to complete, then verify in browser DevTools:
- Network tab — verify `Content-Security-Policy` header appears on any request
- Console — no CSP violations reported
- App still loads and functions normally

**If CSP breaks something**: add the offending source to the CSP in `vercel.json` and redeploy.

### Step 4 — Deploy Edge Functions

```bash
# Deploy all 7 edge functions at once
supabase functions deploy get-assessment
supabase functions deploy submit-assessment
supabase functions deploy register-participant
supabase functions deploy generate-questions
supabase functions deploy generate-group-narrative
supabase functions deploy generate-talent-snapshot
supabase functions deploy recalculate-sjt-scores
```

Or deploy from the Supabase Dashboard one by one.

### Step 5 — Smoke Test

Run through the critical paths immediately after deploy:

- [ ] **Log in** as HR admin → verify dashboard loads
- [ ] **Create a new assessment** (tests `generate-questions` with JWT)
- [ ] **View an existing assessment** → verify it loads
- [ ] **Copy a group participant link** → open in **incognito window**
- [ ] **Take the assessment as a participant** → verify it submits successfully (tests `get-assessment`, `register-participant`, `submit-assessment`)
- [ ] **Generate a group narrative** on an existing group (tests `generate-group-narrative` with JWT)
- [ ] **Generate a talent snapshot** on an employee (tests `generate-talent-snapshot` with JWT)

### Step 6 — Monitor for Issues

For the next 30 minutes after deploy:

- Supabase Dashboard → Logs → Edge Functions → watch for `401 Unauthorized` errors
- Vercel Dashboard → Deployments → check runtime logs
- Browser DevTools → Console → watch for CORS errors

---

## Rollback Procedure

If anything breaks:

### Fast rollback (CORS / headers issue)

Revert the commit on `main` and push — Vercel will auto-redeploy the previous version within 1-2 minutes.

```bash
git revert HEAD
git push origin main
```

### Edge function rollback

Redeploy the previous version from a backup branch:

```bash
git checkout main~1 -- supabase/functions/
supabase functions deploy get-assessment  # and the others
git checkout HEAD -- supabase/functions/
```

### Database rollback (only if something went very wrong)

Use Supabase Point-in-Time Recovery — restore to timestamp before deploy.

---

## Manual Actions Required from You

These cannot be automated — you must do them in the respective dashboards:

### In Supabase Dashboard

- [ ] **Create manual backup** before deploy
- [ ] **Set `ALLOWED_ORIGINS` secret** for edge functions
- [ ] **Deploy the 7 edge functions** after branch merge
- [ ] **(Optional but recommended)** Regenerate the Supabase anon key as hygiene — note: this will require updating the env var in Vercel and redeploying. The current key was exposed in git history, but since it's a publishable key protected by RLS, the risk is low.
- [ ] **(Optional)** Enable Point-in-Time Recovery if not already on (Pro tier)

### In Vercel Dashboard

- [ ] **Verify the security headers** show up in the Network tab after deploy
- [ ] **Configure preview deployments** to inherit env vars (so future PRs can be tested)

### In GitHub

- [ ] **Enable secret scanning** (Settings → Code security → Secret scanning alerts)
- [ ] **Enable Dependabot** (Settings → Code security → Dependabot alerts)
- [ ] **Enable branch protection** on `main` (Settings → Branches) — require PR review before merge

---

## What's Next (Week 2)

After Week 1 is verified stable:

1. **Week 2**: Start Next.js 15 scaffold in a NEW folder alongside Vite app (no production impact)
2. **Rotate Resend API key** via encrypted migration (see `supabase/migrations/20260411000001_encrypt_resend_api_key.sql`)
3. **Add audit logging table** to capture all security-sensitive actions
4. **Add rate limiting** to edge functions via Upstash Redis

---

## Security Validation Checklist

After deploy, confirm:

- [ ] `curl -I https://YOUR_DOMAIN/` returns `Strict-Transport-Security` header
- [ ] `curl -I https://YOUR_DOMAIN/` returns `X-Frame-Options: DENY`
- [ ] `curl -I https://YOUR_DOMAIN/` returns `Content-Security-Policy` header
- [ ] Edge function called without JWT to `generate-questions` returns 401
- [ ] Edge function called with valid JWT to `generate-questions` works
- [ ] Public `get-assessment` still works without JWT (as expected)
- [ ] CORS request from `https://evil.example.com` is blocked by browser
- [ ] CORS request from `https://YOUR_DOMAIN` succeeds
- [ ] `.env` is no longer in `git ls-files` output

---

## Contact / Escalation

- **If rollback is needed**: revert the commit on `main` — Vercel auto-redeploys
- **If data is at risk**: STOP — restore from the backup taken in Step 1
- **If customer reports an issue**: check Supabase edge function logs FIRST (most likely CORS or JWT)
