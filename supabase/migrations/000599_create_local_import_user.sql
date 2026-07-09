do $$
begin
  if current_setting('app.settings.jwt_secret', true) <> 'super-secret-jwt-token-with-at-least-32-characters-long' then
    raise notice 'Skipping local import user creation outside Supabase local.';
    return;
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    email_change,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    'd9e2f9c2-2c6c-4f6d-9d4a-5d7d7d9f0001',
    'authenticated',
    'authenticated',
    'logins@arcsyn.io',
    crypt('finance-local-dev', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    confirmation_token = excluded.confirmation_token,
    recovery_token = excluded.recovery_token,
    email_change_token_new = excluded.email_change_token_new,
    email_change_token_current = excluded.email_change_token_current,
    email_change = excluded.email_change,
    reauthentication_token = excluded.reauthentication_token,
    raw_app_meta_data = excluded.raw_app_meta_data,
    updated_at = now();

  insert into auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    '145fe83f-31c1-4d96-8927-b4917215e001',
    'd9e2f9c2-2c6c-4f6d-9d4a-5d7d7d9f0001',
    'd9e2f9c2-2c6c-4f6d-9d4a-5d7d7d9f0001',
    jsonb_build_object(
      'sub', 'd9e2f9c2-2c6c-4f6d-9d4a-5d7d7d9f0001',
      'email', 'logins@arcsyn.io',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  )
  on conflict (provider_id, provider) do update
  set
    user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    updated_at = now();
end $$;
