-- RPC function لإنشاء مستخدم Auth من غير ما تسجل خروج المدير
CREATE OR REPLACE FUNCTION create_auth_user(p_email TEXT, p_password TEXT)
RETURNS UUID
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at, confirmation_sent_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;
