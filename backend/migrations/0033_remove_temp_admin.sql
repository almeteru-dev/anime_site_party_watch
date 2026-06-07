DO $$
BEGIN
	UPDATE users SET role = 'user' WHERE role = 'temp-admin';

	DELETE FROM app_settings WHERE key = 'temp_admin_permissions';

	IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_allowed') THEN
		ALTER TABLE users DROP CONSTRAINT users_role_allowed;
	END IF;

	ALTER TABLE users
		ADD CONSTRAINT users_role_allowed
		CHECK (role IN ('user','moderator','admin','root'));
END $$;

