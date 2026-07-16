CREATE OR REPLACE FUNCTION cleanup_unverified_users()
RETURNS void
LANGUAGE sql
AS $$
DELETE FROM users
WHERE email IS NULL
    AND registration_date < NOW() - INTERVAL '24 hours';
$$;