# Phase 1 — Cloud-Only Activation Runbook

> **No localhost required.** Every step is performed in a cloud dashboard
> (Supabase, Vercel, GitHub, Stripe). This is the production activation
> guide for users who develop entirely in the cloud.

---

## Prerequisites

- Access to **Supabase Dashboard** (project owner)
- Access to **Vercel Dashboard** (for deploying the Next.js app)
- Access to **GitHub** (for the repo and CI secrets)
- Access to **Stripe Dashboard** (only if using online payments)

You do **not** need Node.js, npm, or any local dev tools installed.

---

## Step 1 — Database (Supabase Dashboard)

### 1.1 Back up
Dashboard → **Database** → **Backups** → **Create manual backup**

Wait for it to complete (~1 minute). Note the timestamp for rollback.

### 1.2 Run the 3 SQL migrations

Open **SQL Editor** and run these in order. See the companion document
`docs/PHASE1_SQL_TO_RUN.md` for the full text of each migration.

The migration files are in the repo at:
- `supabase/migrations/20260411000001_encrypt_resend_api_key.sql`
- `supabase/migrations/20260411000002_billing_system.sql`
- `supabase/migrations/20260411000003_trial_autocreate.sql`

**To copy-paste from GitHub:**
1. Navigate to the branch on GitHub
2. Open the migration file
3. Click **Raw** (top-right of the file view)
4. `Ctrl+A` / `Cmd+A` to select all
5. `Ctrl+C` / `Cmd+C` to copy
6. Paste into Supabase SQL Editor
7. Click **Run**
8. Repeat for the next migration

### 1.3 Verify
Run the 9 verification queries from `PHASE1_SQL_TO_RUN.md` → "Verification
Queries" section. All 9 should pass.

### 1.4 Set Edge Function Secret
Dashboard → **Project Settings** → **Edge Functions** → **Secrets** → **Add new secret**:

| Name | Value |
|---|---|
| `ALLOWED_ORIGINS` | `https://qudurat.com,https://*.qudurat.com,https://your-vercel-preview.vercel.app` |

Replace the values with the actual domains your customer uses to access
the app. Separate with commas, no spaces. Include wildcard subdomains with
`https://*.qudurat.com` syntax if needed.

### 1.5 Deploy Updated Edge Functions

Go to **Edge Functions** in the sidebar. For each of these 7 functions, click
the function name → **Deploy** button → select **Deploy from GitHub** →
pick the `claude/saas-readiness-assessment-p3yw9` branch:

1. `get-assessment`
2. `submit-assessment`
3. `register-participant`
4. `generate-questions`
5. `generate-group-narrative`
6. `generate-talent-snapshot`
7. `recalculate-sjt-scores`

Alternatively: connect the Supabase project to the GitHub repo once via
**Project Settings → Integrations → GitHub**, then all functions auto-deploy
on push to the branch.

---

## Step 2 — Existing Vite App (Vercel Dashboard)

The existing Vite app at the repo root needs updated security headers.
This picks up `vercel.json` changes from Week 1.

1. Vercel Dashboard → your existing Vite project → **Settings** → **Git**
2. Confirm it's connected to the GitHub repo
3. Merge branch `claude/saas-readiness-assessment-p3yw9` into `main`
   (via GitHub PR — see Step 4 below)
4. Vercel auto-deploys the merge

To verify headers are live:
1. Chrome DevTools → Network tab → click any request to your domain
2. Check **Response Headers** section
3. You should see `Strict-Transport-Security`, `X-Frame-Options: DENY`,
   `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy`

---

## Step 3 — Next.js App (Vercel Dashboard)

The Next.js app in `qudurat-next/` is a **separate** project from the
existing Vite app. Create a new Vercel project for it:

### 3.1 Create new Vercel project

1. Vercel Dashboard → **Add New** → **Project**
2. **Import Git Repository** → select your GitHub repo
3. **Configure Project**:
   - **Framework preset**: Next.js (auto-detected)
   - **Root directory**: Click **Edit** → enter `qudurat-next`
   - **Build command**: leave as default (`next build`)
   - **Output directory**: leave as default
   - **Install command**: leave as default (`npm install` runs on Vercel)
4. Click **Environment Variables** → add these:

   | Name | Value | Environment |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-project>.supabase.co` | All |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (anon key) | All |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service_role — SECRET) | All |
   | `NEXT_PUBLIC_APP_URL` | `https://qudurat-next.vercel.app` (or your custom domain) | All |
   | `CRON_SECRET` | A random 32-byte hex string | All |

   To generate `CRON_SECRET`: visit https://generate-secret.vercel.app/32
   or use any random string generator.

5. Click **Deploy**
6. Wait for first build to complete (~2 minutes)
7. Visit the deployment URL — you should see the Qudurat landing page

### 3.2 (Optional) Add a custom domain

Vercel Dashboard → the new project → **Settings** → **Domains** → add
`app.qudurat.com` (or whatever you chose). Update DNS at your registrar
as Vercel instructs. This will also take effect for the middleware tenant
resolution once you're in Phase 2.

### 3.3 Configure Vercel Cron (for trial expiration)

Still in the Next.js project → **Settings** → **Cron Jobs** → **Add Cron Job**:

| Field | Value |
|---|---|
| Path | `/api/cron/expire-trials` |
| Schedule | `0 * * * *` (every hour) |

Alternatively, add this to `qudurat-next/vercel.json` via a commit:
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

The cron will be authenticated via the `CRON_SECRET` you set in 3.1.

---

## Step 4 — GitHub (merge branch + secrets)

### 4.1 Create a PR for the work branch

1. GitHub → your repo → **Pull requests** → **New pull request**
2. **Base**: `main` ← **Compare**: `claude/saas-readiness-assessment-p3yw9`
3. Title: "Phase 1 — Security, billing, migration to Next.js 15"
4. Body: paste the commit log highlights
5. Click **Create pull request**
6. Review the diff carefully — especially the 3 SQL migrations (already
   run in Step 1, so the files just need to exist on main)
7. Click **Merge pull request** → **Confirm merge**

### 4.2 Set GitHub Actions secrets

Repo → **Settings** → **Secrets and variables** → **Actions** →
**New repository secret**:

| Name | Value | Used by |
|---|---|---|
| `VERCEL_TOKEN` | Generate at vercel.com/account/tokens | deploy-staging, deploy-prod |
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase API settings | ci.yml build |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase API settings | ci.yml build |
| `NEXT_PUBLIC_APP_URL` | Your prod URL | ci.yml build |
| `VITE_SUPABASE_URL` | Same as above | ci.yml legacy Vite build |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same as anon key | ci.yml legacy Vite build |

### 4.3 Enable branch protection

Repo → **Settings** → **Branches** → **Add branch protection rule**:

- **Branch name pattern**: `main`
- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
- ✅ Require status checks to pass:
  - `next-lint-typecheck-unit`
  - `next-build`
  - `vite-lint-build`
- ✅ Require branches to be up to date before merging
- ✅ Do not allow force pushes
- ✅ Do not allow deletions

### 4.4 Enable security features

Repo → **Settings** → **Code security and analysis**:
- ✅ Dependency graph
- ✅ Dependabot alerts
- ✅ Dependabot security updates
- ✅ Secret scanning alerts
- ✅ Push protection

---

## Step 5 — Configure Payment Providers (Super Admin)

This is done **inside the deployed Next.js app**, not via any terminal.

### 5.1 Log in as super admin
Visit `https://<your-nextjs-domain>/en/login` and sign in with a super
admin account.

### 5.2 Configure bank transfer (required for offline payments)

Navigate to `/en/admin/billing/providers`.

Scroll to **Bank Transfer** card → fill in:
- Bank name (e.g., "Emirates NBD")
- Account holder name (your company legal name)
- Account number
- IBAN
- SWIFT / BIC code
- Primary currency (3-letter code, e.g., `USD`, `AED`, `SAR`)
- Payment instructions (English) — tell customers how to reference their transfer
- Payment instructions (Arabic) — Arabic version
- ✅ Toggle **Active**
- Click **Save bank details**

Bank transfer is now available to customers on their billing page.

### 5.3 Configure Stripe (only if using online payments)

**In Stripe Dashboard first:**

1. Stripe Dashboard → **Products** → create 3 products:
   - "Qudurat Starter"
   - "Qudurat Professional"
   - "Qudurat Enterprise" (skip this one if not offering online)
2. For each product, create 2 prices:
   - $349/month (Starter), $999/month (Professional)
   - $3490/year (Starter), $9990/year (Professional)
3. Copy each **Price ID** (starts with `price_`)

**Then in Supabase SQL Editor, update the plans:**

```sql
UPDATE plans SET
  stripe_price_monthly_id = 'price_YOUR_STARTER_MONTHLY',
  stripe_price_annual_id = 'price_YOUR_STARTER_ANNUAL'
WHERE slug = 'starter';

UPDATE plans SET
  stripe_price_monthly_id = 'price_YOUR_PRO_MONTHLY',
  stripe_price_annual_id = 'price_YOUR_PRO_ANNUAL'
WHERE slug = 'professional';
```

**Then in Stripe Dashboard, configure the webhook:**

1. **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL**: `https://<your-nextjs-domain>/api/webhooks/stripe`
3. **Events to send** — select these 5:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Click **Add endpoint**
5. On the endpoint detail page, click **Reveal signing secret** — copy
   the `whsec_...` value

**Finally, back in the Qudurat admin UI:**

Navigate to `/en/admin/billing/providers` → **Stripe** card:
- **Secret API key**: paste your `sk_live_...` or `sk_test_...` from
  Stripe Dashboard → Developers → API keys
- **Webhook signing secret**: paste the `whsec_...` you just copied
- **Publishable key**: paste your `pk_live_...` or `pk_test_...`
- **Account ID**: optional (leave blank unless using Connect)
- ✅ Test mode (keep checked until ready for real payments)
- ✅ Active
- Click **Save Stripe configuration**

Stripe is now configured. Secrets are encrypted via Supabase Vault.

---

## Step 6 — Verification Checklist

Test each of these in the deployed app (no localhost):

### Security
- [ ] Chrome DevTools Network → response headers include `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options: DENY`
- [ ] Try `curl -X OPTIONS https://<project>.supabase.co/functions/v1/get-assessment -H "Origin: https://evil.example.com"` — should NOT return `Access-Control-Allow-Origin: *`
- [ ] Try `curl https://<project>.supabase.co/functions/v1/generate-questions` without auth header — should return 401
- [ ] `git ls-files | grep .env` on main should only show `.env.example`

### App functionality
- [ ] `/en` shows the landing page
- [ ] `/ar` shows the Arabic landing with `dir=rtl` (inspect HTML)
- [ ] `/en/login` renders the form
- [ ] `/en/pricing` shows the 3 plan tiers
- [ ] `/en/dashboard` redirects to `/en/login` when not authenticated
- [ ] Signing in as an existing user shows the dashboard
- [ ] Clicking **New assessment** and filling the form creates a draft
- [ ] Clicking **Open question builder** on the new assessment opens the editor
- [ ] Adding a question + publishing works
- [ ] Clicking a group shows the group detail with participants
- [ ] Clicking **View report** shows analytics

### Billing
- [ ] `/en/settings/billing` shows the current plan (should be free_trial)
- [ ] The upgrade section shows 3 plan cards
- [ ] The **Bank transfer** tab shows your configured bank details
- [ ] Clicking **Submit bank transfer request** as an org admin creates a row
- [ ] As super admin, `/en/admin/billing/requests` shows the pending request
- [ ] Clicking **Activate** goes to `/en/admin/billing/activate?btr=...` with
      pre-filled fields
- [ ] Submitting the activation form updates the subscription
- [ ] The customer's `/en/settings/billing` now shows active status

### Stripe (if configured)
- [ ] On `/en/settings/billing`, click **Credit / Debit card** tab
- [ ] Click **Continue to Stripe** — should redirect to Stripe Checkout
- [ ] Use test card `4242 4242 4242 4242`, any CVC, any future date
- [ ] Complete checkout — should redirect back to `/en/settings/billing?success=true`
- [ ] Supabase SQL Editor: `SELECT * FROM subscriptions WHERE stripe_subscription_id IS NOT NULL;`
      should show the new row
- [ ] Stripe Dashboard → **Webhooks** → your endpoint should show 200 response

### Trial lifecycle
- [ ] Sign up a new organization — verify it auto-gets a trialing subscription
      (`SELECT * FROM subscriptions WHERE status = 'trialing' ORDER BY created_at DESC LIMIT 1;`)
- [ ] Manually expire a trial via SQL:
      `UPDATE subscriptions SET trial_end = now() - interval '1 day' WHERE organization_id = '<test-org>';`
- [ ] Wait for the hourly cron (or trigger manually: `SELECT expire_trial_subscriptions();`)
- [ ] Status should be `past_due`

### Limit enforcement
- [ ] Try creating a 101st assessment on a starter plan (max_assessments = 500)
- [ ] No, better test: `UPDATE plans SET max_assessments = 1 WHERE slug = 'free_trial';`
      then try to create 2 assessments — the second should fail with
      "You've reached your plan's assessments limit"
- [ ] Revert: `UPDATE plans SET max_assessments = 100 WHERE slug = 'free_trial';`

---

## Rollback

### If a deploy breaks production
Vercel Dashboard → **Deployments** → find the last working deploy →
**⋯ menu** → **Promote to Production**.

### If SQL migrations cause issues
Supabase Dashboard → **Database** → **Backups** → restore to the
backup you took in Step 1.1.

### If edge functions break
Supabase Dashboard → **Edge Functions** → click the function → **Logs**
to see errors. Redeploy from an earlier commit if needed.

---

## Phase 1 is fully operational when:

- [ ] All 3 migrations ran successfully (9/9 verification queries pass)
- [ ] `ALLOWED_ORIGINS` secret is set in Supabase
- [ ] All 7 edge functions are deployed with the new CORS
- [ ] Vite app deploys to Vercel with security headers
- [ ] Next.js app deploys to its own Vercel project
- [ ] PR is merged to `main` with branch protection on
- [ ] GitHub Actions secrets are set
- [ ] Bank transfer provider is configured and active
- [ ] (Optional) Stripe is configured with products and webhook
- [ ] Vercel Cron is scheduled for `/api/cron/expire-trials`
- [ ] All verification checklist items pass

---

## Notes

**No npm, no localhost, no CLI tools needed.** Everything in this runbook
can be done from a web browser.

The only commands shown in this doc are:
- **SQL** → paste into Supabase SQL Editor
- **curl** → optional, runs from any terminal (or from a tool like
  Postman / Hoppscotch in your browser)

If you use Lovable or another cloud IDE, push to the branch from there
and let Vercel auto-deploy. No other setup required.
