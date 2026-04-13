-- Seed the 4 default subscription plans.
-- The 'free' plan is REQUIRED by the handle_new_organization() trigger
-- to auto-create 14-day trial subscriptions on org signup.

-- Only insert if no plans exist yet (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'free') THEN
    INSERT INTO public.plans (name, name_ar, slug, description, description_ar, currency, price_monthly_usd, price_annual_usd, max_assessments, max_groups, max_users, max_ai_questions_monthly, sort_order, is_active, is_public, features)
    VALUES (
      'Free', 'مجاني', 'free',
      'Get started with basic assessment tools',
      'ابدأ باستخدام أدوات التقييم الأساسية',
      'USD', 0, 0,
      5, 3, 1, 10,
      0, true, true,
      '["Up to 5 assessments", "1 HR admin", "3 assessment groups", "10 AI questions/month", "Basic analytics", "Email support"]'::jsonb
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'starter') THEN
    INSERT INTO public.plans (name, name_ar, slug, description, description_ar, currency, price_monthly_usd, price_annual_usd, max_assessments, max_groups, max_users, max_ai_questions_monthly, sort_order, is_active, is_public, features)
    VALUES (
      'Starter', 'المبتدئ', 'starter',
      'For growing teams that need more capacity',
      'للفرق المتنامية التي تحتاج المزيد من السعة',
      'USD', 29, 290,
      25, 10, 3, 50,
      1, true, true,
      '["Up to 25 assessments", "3 HR admins", "10 assessment groups", "50 AI questions/month", "Advanced analytics", "Priority email support"]'::jsonb
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'professional') THEN
    INSERT INTO public.plans (name, name_ar, slug, description, description_ar, currency, price_monthly_usd, price_annual_usd, max_assessments, max_groups, max_users, max_ai_questions_monthly, sort_order, is_active, is_public, features)
    VALUES (
      'Professional', 'الاحترافي', 'professional',
      'Full-featured plan for professional HR teams',
      'خطة كاملة الميزات لفرق الموارد البشرية المحترفة',
      'USD', 79, 790,
      -1, -1, 10, 200,
      2, true, true,
      '["Unlimited assessments", "10 HR admins", "Unlimited groups", "200 AI questions/month", "Full analytics & reports", "Priority support", "Custom branding"]'::jsonb
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'enterprise') THEN
    INSERT INTO public.plans (name, name_ar, slug, description, description_ar, currency, price_monthly_usd, price_annual_usd, max_assessments, max_groups, max_users, max_ai_questions_monthly, sort_order, is_active, is_public, features)
    VALUES (
      'Enterprise', 'المؤسسات', 'enterprise',
      'Custom solutions for large organizations',
      'حلول مخصصة للمؤسسات الكبيرة',
      'USD', 199, 1990,
      -1, -1, -1, -1,
      3, true, true,
      '["Everything in Professional", "Unlimited users", "Unlimited AI questions", "Dedicated account manager", "Custom integrations", "SLA guarantee", "On-premise option"]'::jsonb
    );
  END IF;
END $$;
