# Phase 1 Completion Runbook

> Actions required to fully activate Phase 1 in production. These are
> the manual steps that could not be automated from Claude's environment
> because they require access to Vercel, GitHub, Supabase, and Stripe
> dashboards.

---

## ✅ Code Complete (Already on Branch)

The following items are **fully implemented** on branch
`claude/saas-readiness-assessment-p3yw9` and need no code changes:

| # | Item | Status |
|---|---|---|
| 1 | `.env` untracked, `.gitignore` blocks future commits | ✅ |
| 2 | Edge functions JWT verification (3 public, 3 private) | ✅ |
| 3 | Shared CORS helper reading `ALLOWED_ORIGINS` env | ✅ |
| 4 | Security headers in both Vite and Next.js configs | ✅ |
| 5 | Next.js 15 app fully scaffolded with 30+ pages | ✅ |
| 6 | All 20 Vite routes have Next.js equivalents | ✅ |
| 7 | Middleware resolves tenant from hostname | ✅ |
| 8 | CI pipeline workflows (lint/test/build/e2e/security) | ✅ |
| 9 | E2E tests for critical journeys | ✅ |
| 10 | Billing: Stripe SDK wired, webhook implemented, limits enforced | ✅ |
| 11 | Trial auto-create trigger + expiration sweeper | ✅ |

---

## 🔧 Manual Steps You Must Complete

These steps cannot be run from the code repo — they require you to be
logged into third-party services. Follow in order.

### Step 1 — Install Dependencies

```bash
cd qudurat-next
npm install
```

This will fetch the `stripe` package that was added in the billing
completion commit. Also run once in the repo root for the Vite app:

```bash
cd ..
npm install
```

### Step 2 — Run Supabase Migrations

Three new migrations were added during Phase 1 completion:

```bash
supabase db push
```

Or via Dashboard → SQL Editor, run them in order:

1. `supabase/migrations/20260411000001_encrypt_resend_api_key.sql`
2. `supabase/migrations/20260411000002_billing_system.sql`
3. `supabase/migrations/20260411000003_trial_autocreate.sql`

Verify:
- `plans` table has 4 rows (free_trial, starter, professional, enterprise)
- `payment_providers` has 2 rows (stripe, bank_transfer) both inactive
- Every existing org has a row in `subscriptions` with `status = trialing`
- The trigger `trg_org_trial_subscription` exists on `organizations`

### Step 3 — Rotate Exposed Supabase Keys (Optional but Recommended)

The publishable anon key was committed to git history in Week 1. It's
protected by RLS so the risk is low, but best practice:

1. Supabase Dashboard → Project Settings → API → Reset anon key
2. Update Vercel env `VITE_SUPABASE_PUBLISHABLE_KEY` with the new value
3. Redeploy the Vite app
4. Update Next.js env `NEXT_PUBLIC_SUPABASE_ANON_KEY` when deploying

### Step 4 — Purge `.env` From Git History (Optional)

Full history rewrite. Only do this if you want to remove the exposed
values from git history completely:

```bash
# Install git-filter-repo
pip install git-filter-repo

# Backup first
git clone --mirror . /tmp/qudurat-backup.git

# Run the purge
git filter-repo --path .env --invert-paths --force

# Force push to main (destructive — coordinate with team)
git push --force --all
git push --force --tags
```

**Warning**: Every collaborator must re-clone after this.

### Step 5 — Set Required Environment Variables

#### In Vercel (Project Settings → Environment Variables)

For the Vite app (existing):
```
VITE_SUPABASE_URL                    = https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY        = eyJ...
VITE_SUPABASE_PROJECT_ID             = <project>
```

For the Next.js app (new — set when creating Vercel project for it):
```
NEXT_PUBLIC_SUPABASE_URL             = https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY        = eyJ...
SUPABASE_SERVICE_ROLE_KEY            = eyJ...  (keep secret — server only)
NEXT_PUBLIC_APP_URL                  = https://qudurat.com
CRON_SECRET                          = <generate a random 32-byte hex>
```

#### In Supabase (Project Settings → Edge Functions → Secrets)

```
ALLOWED_ORIGINS                      = https://qudurat.com,https://*.qudurat.com,https://<your-vite-domain>.vercel.app
```

Include every domain your customer uses to reach the app.

### Step 6 — Deploy Edge Functions With New CORS

After setting `ALLOWED_ORIGINS`:

```bash
supabase functions deploy get-assessment
supabase functions deploy submit-assessment
supabase functions deploy register-participant
supabase functions deploy generate-questions
supabase functions deploy generate-group-narrative
supabase functions deploy generate-talent-snapshot
supabase functions deploy recalculate-sjt-scores
```

Quick smoke test:
```bash
curl -X OPTIONS https://<project>.supabase.co/functions/v1/get-assessment \
  -H "Origin: https://qudurat.com" -v
# Should return Access-Control-Allow-Origin: https://qudurat.com
```

### Step 7 — Configure Payment Providers (Super Admin)

Log in as a super admin and navigate to `/admin/billing/providers`.

#### Bank transfer
1. Fill in bank details (name, account name, number, IBAN, SWIFT, currency)
2. Add payment instructions in English and Arabic
3. Toggle **Active**
4. Save

#### Stripe (Optional — only if using online payments)
1. Create products + prices in Stripe Dashboard for each plan tier and
   billing cycle (8 prices total: monthly + annual × starter/pro/enterprise
   where applicable)
2. Copy the price IDs and update the `plans` table:
   ```sql
   UPDATE plans SET
     stripe_price_monthly_id = 'price_...',
     stripe_price_annual_id = 'price_...'
   WHERE slug = 'starter';
   -- Repeat for professional, enterprise
   ```
3. Back in the admin UI, fill in:
   - Secret API key (`sk_live_...` or `sk_test_...`)
   - Publishable key (`pk_live_...` or `pk_test_...`)
   - Webhook signing secret (get this after configuring the webhook endpoint below)
4. Toggle **Active**
5. Save

#### Configure Stripe webhook endpoint
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://<your-nextjs-domain>/api/webhooks/stripe`
3. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the **Signing secret** (`whsec_...`) and paste into the admin UI from step 3 above
5. Save

### Step 8 — Configure GitHub Secrets for CI/CD

GitHub Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|---|---|
| `VERCEL_TOKEN` | From vercel.com/account/tokens |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as Vercel |
| `NEXT_PUBLIC_APP_URL` | Production URL |
| `VITE_SUPABASE_URL` | For legacy CI build |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | For legacy CI build |

### Step 9 — Enable Branch Protection on `main`

GitHub Settings → Branches → Add branch protection rule for `main`:

- ✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Require status checks to pass:
  - `next-lint-typecheck-unit`
  - `next-build`
  - `vite-lint-build`
  - `supabase-functions-check`
- ✅ Require branches to be up to date before merging
- ✅ Do not allow force pushes
- ✅ Do not allow deletions

### Step 10 — Enable Security Features

GitHub Settings → Code security and analysis:
- ✅ Dependency graph
- ✅ Dependabot alerts
- ✅ Dependabot security updates
- ✅ Secret scanning
- ✅ Push protection

### Step 11 — Set Up Vercel Cron for Trial Expiration

Create `qudurat-next/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-trials",
      "schedule": "0 * * * *"
    }
  ]
}
```

Or use Supabase's `pg_cron` extension:
```sql
SELECT cron.schedule(
  'expire-trials',
  '0 * * * *',
  'SELECT public.expire_trial_subscriptions();'
);
```

### Step 12 — Deploy Next.js App for the First Time

```bash
cd qudurat-next

# Option A: First-time deploy via Vercel CLI
npx vercel

# Option B: Push to main and let deploy-staging workflow handle it
git checkout main
git merge claude/saas-readiness-assessment-p3yw9
git push origin main
```

After deploy, visit:
- `/en` — marketing landing
- `/en/login` — auth flow
- `/en/dashboard` — should redirect to login (good, auth working)
- `/api/webhooks/stripe` — returns 400 for GET (good, POST only)

---

## ✅ Verification Checklist

Run through this checklist after all manual steps are complete:

- [ ] `curl -I https://qudurat.com/` returns `Strict-Transport-Security`, `X-Frame-Options: DENY`, `Content-Security-Policy`
- [ ] `supabase/config.toml` has `verify_jwt = true` on generate-*, generate-group-narrative, generate-talent-snapshot
- [ ] Calling `https://<project>.supabase.co/functions/v1/generate-questions` without JWT returns 401
- [ ] Cross-origin request from `https://evil.example.com` is blocked by browser CORS
- [ ] `git ls-files | grep .env` returns only `.env.example` (not `.env`)
- [ ] GitHub Actions show passing runs on PRs
- [ ] Next.js app live at staging URL
- [ ] `/en` renders landing page
- [ ] `/ar` renders with `dir=rtl`
- [ ] Registering a new org auto-creates a trialing subscription
- [ ] `/settings/billing` shows current plan
- [ ] Super admin can see bank transfer requests at `/admin/billing/requests`
- [ ] Super admin can manually activate a subscription
- [ ] Stripe test card (`4242 4242 4242 4242`) completes checkout (if Stripe configured)
- [ ] Webhook receives `checkout.session.completed` and creates subscription row
- [ ] Creating a 101st assessment on the starter plan returns "limit reached" error
- [ ] Expiring a trial via `SELECT expire_trial_subscriptions();` transitions it to `past_due`

---

## 🚨 Rollback

If anything breaks after deploy:

### Vercel rollback
Vercel Dashboard → Deployments → Click the previous working deploy →
"Promote to production" button.

### Edge function rollback
```bash
git checkout <previous-commit> -- supabase/functions/
supabase functions deploy <affected-function>
git checkout HEAD -- supabase/functions/
```

### Database rollback
Supabase Dashboard → Database → Backups → Restore to timestamp before
migration. All three billing migrations are non-destructive, but a
rollback may leave orphaned columns. Contact support if unsure.

---

## 📝 Notes for Phase 2

After Phase 1 is fully live, Phase 2 (tenant self-service configuration)
builds on this foundation:

- Week 7: Tenant email provider system (Resend, Mailgun, SMTP adapters)
- Week 8: Tenant AI provider system (OpenAI, Anthropic, Gemini, etc.)
- Week 9: Custom domain management (subdomain + custom domain + auto-SSL)
- Week 10: Full branding editor (colors, fonts, logos, certificates)
- Week 11: Notification preferences and custom email templates
- Week 12: Premium UI transformation (Tremor charts, cmdk, dark mode)

Every Phase 2 feature is orthogonal to Phase 1 — it extends rather than
replaces the work done here.
