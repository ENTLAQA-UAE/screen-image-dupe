-- Assign org_admin role to Ahmed Ashoor for ENTLAQA organization
INSERT INTO public.user_roles (user_id, role)
VALUES ('51db28d1-46d9-4b1a-a244-22f706d486d4', 'org_admin')
ON CONFLICT (user_id, role) DO NOTHING;