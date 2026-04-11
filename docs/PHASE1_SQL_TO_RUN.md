# Phase 1 — SQL Migrations to Run

> Run these in **Supabase Dashboard → SQL Editor** in order. Each is safe
> and non-destructive. Existing customer data is preserved.

You will run **3 migrations** (832 lines total). They create the encrypted
Resend key column, the billing system (plans, subscriptions, invoices,
bank transfer requests, payment providers), and the auto-trial trigger.

---

## How to run

1. Open Supabase Dashboard → your project → **SQL Editor**
2. Click **+ New query**
3. Copy-paste the contents of **Migration 1** below → click **Run**
4. Verify success (green checkmark)
5. Repeat for **Migration 2** and **Migration 3**
6. Run the **Verification queries** at the bottom

> ⚠️ Back up first: Dashboard → Database → Backups → **Create manual
> backup** before running anything.

---

## Migration 1 — Encrypt Resend API key (202 lines)

**File**: `supabase/migrations/20260411000001_encrypt_resend_api_key.sql`

**What it does:**
- Enables `pgcrypto` + `supabase_vault` extensions
- Stores a master encryption key in Vault under the name `qudurat_email_key`
- Adds an `encrypted_resend_api_key BYTEA` column to `organization_email_settings`
- Backfills it from existing plaintext `resend_api_key`
- Creates helper functions: `encrypt_email_secret()`, `get_decrypted_resend_api_key()`
- Creates a trigger that auto-encrypts on insert/update
- **Keeps the plaintext column** during rollout (nothing is dropped)

**Copy from the file in the repo**: `supabase/migrations/20260411000001_encrypt_resend_api_key.sql`

---

## Migration 2 — Billing System (518 lines)

**File**: `supabase/migrations/20260411000002_billing_system.sql`

**What it does:**
- Creates 6 tables:
  - `plans` — plan catalog (seeded with free_trial, starter, professional, enterprise)
  - `payment_providers` — Stripe + bank transfer credentials (singleton per type)
  - `subscriptions` — unified for all payment paths
  - `invoices` — unified with auto-numbering `QUD-YYYY-NNNN`
  - `bank_transfer_requests` — customer-initiated queue for offline payment
  - `usage_records` — metered billing events
- Creates the `check_subscription_limit(org_id, resource)` function
- Creates the `generate_invoice_number()` trigger
- Seeds 4 default plans with EN+AR names, pricing, limits, features
- **Backfills trial subscriptions** for every existing organization
- Adds RLS policies (super admin for secrets, org admins for their own rows)
- Seeds 2 inactive payment_providers rows (stripe, bank_transfer)

**Copy from the file in the repo**: `supabase/migrations/20260411000002_billing_system.sql`

---

## Migration 3 — Auto-trial Trigger (112 lines)

**File**: `supabase/migrations/20260411000003_trial_autocreate.sql`

**What it does:**
- Creates the `create_trial_subscription_for_org()` function
- Creates an AFTER INSERT trigger on `organizations` — every new signup
  automatically gets a 14-day trial subscription
- Creates the `expire_trial_subscriptions()` sweeper function to transition
  expired trials to `past_due` (called by a scheduled cron)

**Copy from the file in the repo**: `supabase/migrations/20260411000003_trial_autocreate.sql`

---

## Verification Queries

After running all 3 migrations, paste these into SQL Editor to verify:

```sql
-- 1. Plans seeded (should return 4 rows)
SELECT slug, name, price_monthly_usd, max_assessments, max_users
FROM plans
ORDER BY sort_order;
-- Expected: free_trial, starter, professional, enterprise

-- 2. Every org has a subscription (should return 0)
SELECT COUNT(*)
FROM organizations o
LEFT JOIN subscriptions s ON s.organization_id = o.id
WHERE s.id IS NULL;
-- Expected: 0 (if not 0, some orgs are missing a subscription row)

-- 3. Payment providers scaffold exists (should return 2 rows)
SELECT provider_type, display_name, is_active
FROM payment_providers;
-- Expected: stripe (inactive), bank_transfer (inactive)

-- 4. Auto-trial trigger is attached
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trg_org_trial_subscription';
-- Expected: 1 row, INSERT on organizations

-- 5. Invoice auto-numbering trigger
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'trg_invoice_number';
-- Expected: 1 row

-- 6. Limit enforcement function exists
SELECT proname FROM pg_proc WHERE proname = 'check_subscription_limit';
-- Expected: 1 row

-- 7. Encrypted column added to email settings
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'organization_email_settings'
  AND column_name = 'encrypted_resend_api_key';
-- Expected: 1 row with data_type = 'bytea'

-- 8. Vault has the master key
SELECT name FROM vault.secrets WHERE name = 'qudurat_email_key';
-- Expected: 1 row

-- 9. Your existing customer org has a trial subscription
SELECT o.name, s.status, s.payment_method, s.current_period_end
FROM organizations o
JOIN subscriptions s ON s.organization_id = o.id;
-- Expected: status = 'trialing', current_period_end ~14 days from now
```

All 9 queries should return the expected results. If any fail, DO NOT
proceed to using the feature — investigate first.

---

## Rollback (if anything goes wrong)

Each migration is non-destructive (no DROP statements, no data deletion).
To roll back:

1. **Option A — Point-in-time recovery**: Supabase Dashboard → Database →
   Backups → restore to timestamp before the migration.

2. **Option B — Manual rollback** (experts only):
   ```sql
   -- Drop billing tables in dependency order
   DROP TABLE IF EXISTS public.bank_transfer_requests CASCADE;
   DROP TABLE IF EXISTS public.invoices CASCADE;
   DROP TABLE IF EXISTS public.usage_records CASCADE;
   DROP TABLE IF EXISTS public.subscriptions CASCADE;
   DROP TABLE IF EXISTS public.payment_providers CASCADE;
   DROP TABLE IF EXISTS public.plans CASCADE;

   -- Drop helper functions
   DROP FUNCTION IF EXISTS public.check_subscription_limit(UUID, TEXT);
   DROP FUNCTION IF EXISTS public.generate_invoice_number();
   DROP FUNCTION IF EXISTS public.create_trial_subscription_for_org();
   DROP FUNCTION IF EXISTS public.expire_trial_subscriptions();

   -- Drop the encrypted column (plaintext column stays)
   ALTER TABLE public.organization_email_settings
     DROP COLUMN IF EXISTS encrypted_resend_api_key;
   DROP FUNCTION IF EXISTS public.encrypt_email_secret(TEXT);
   DROP FUNCTION IF EXISTS public.get_decrypted_resend_api_key(UUID);
   DROP TRIGGER IF EXISTS org_email_settings_encrypt_key ON public.organization_email_settings;
   DROP FUNCTION IF EXISTS public.trg_encrypt_resend_api_key();
   ```

The existing customer's data (assessments, groups, participants, etc.)
is not touched by any of these migrations.
