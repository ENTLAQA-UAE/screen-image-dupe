-- Atomic onboarding function: creates org, links profile, assigns role.
-- Uses SECURITY DEFINER to bypass RLS for internal operations.
-- The handle_new_organization() trigger still fires to create the trial subscription.

CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_org_name text,
  p_org_slug text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_existing_org_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user already has an org — return it instead of failing
  SELECT organization_id INTO v_existing_org_id
  FROM profiles WHERE id = v_user_id;

  IF v_existing_org_id IS NOT NULL THEN
    RETURN v_existing_org_id;
  END IF;

  -- Create the organization
  v_org_id := gen_random_uuid();
  INSERT INTO organizations (id, name, slug, plan, is_active)
  VALUES (v_org_id, p_org_name, NULLIF(p_org_slug, ''), 'free', true);

  -- Link user profile to org
  UPDATE profiles SET organization_id = v_org_id WHERE id = v_user_id;

  -- Assign org_admin role (ignore if already exists)
  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, 'org_admin')
  ON CONFLICT DO NOTHING;

  RETURN v_org_id;
END;
$$;
