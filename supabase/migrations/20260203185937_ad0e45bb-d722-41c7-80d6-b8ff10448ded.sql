-- Create a test user for migration purposes
-- Note: We use auth.users table with a generated UUID
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '00000000-0000-0000-0000-000000000000',
  'migration-user@example.com',
  crypt('temp-password-123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
);