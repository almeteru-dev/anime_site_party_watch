# Backend Handlers: Auth & Users

This document describes the **Go backend HTTP handlers** responsible for authentication and user administration.

## Scope
- Documented folder: `backend/internal/handlers`
- Covered files in this document:
  - `auth.go`
  - `user.go`
  - `admin_users.go`
  - `admin_root.go`

Routes are registered in `backend/cmd/api/main.go`.

---

## File: `backend/internal/handlers/auth.go`

### Purpose
Implements public authentication endpoints: registration, login/logout, email verification, password reset.

### Main routes
- `POST /api/register` → `Register`
- `POST /api/login` → `Login`
- `POST /api/logout` → `Logout`
- `GET /api/verify-email` → `VerifyEmail`
- `POST /api/resend-verification` → `ResendVerification`
- `POST /api/forgot-password` → `ForgotPassword`
- `POST /api/reset-password` → `ResetPassword`

### Types
- `RegisterInput`: JSON body for registration (`username`, `email`, `password`, `confirm_password`).
- `LoginInput`: JSON body for login. Supports `identifier` (email or username), `password`, and `remember_me`.

### Functions

#### `publicWebBaseURL() string`
- Returns `FRONTEND_URL` (from config) without a trailing `/`.
- Used to build absolute links in emails.

#### `generateToken(length int) string`
- Generates a cryptographically secure random token using `crypto/rand` and returns it hex-encoded.
- Used for email verification and password reset tokens.

#### `Register(c *gin.Context)`
- Validates input (`username`, `email`, password confirmation).
- Hashes password using the centralized password hasher (pepper+SHA-256+bcrypt).
- Creates a `users` record with role `user` and `is_verified=false`.
- Creates a `verification_codes` record (`type='email_verification'`, expires in 24h).
- Sends a verification email containing `FRONTEND_URL/verify-confirm?token=...`.
- Returns `201` with a generic message.

#### `VerifyEmail(c *gin.Context)`
- Reads `token` from query string.
- Validates token by finding a non-expired `verification_codes` row with `type='email_verification'`.
- Sets `users.is_verified=true` and deletes the used verification code.
- Returns `200`.

#### `ResendVerification(c *gin.Context)`
- Accepts `{email}`.
- If user exists and is not verified:
  - Deletes previous `email_verification` tokens.
  - Creates a new verification token.
  - Sends a new verification email.
- Returns `200`.

#### `ForgotPassword(c *gin.Context)`
- Accepts `{email}`.
- Always returns a generic `200` response message to avoid revealing whether the email exists.
- If the user exists:
  - Deletes previous `password_reset` tokens.
  - Creates a new token (expires in 1h).
  - Sends a reset email containing `FRONTEND_URL/reset-password?token=...`.

#### `ResetPassword(c *gin.Context)`
- Accepts `{token, password}`.
- Validates password strength.
- Validates token by finding a non-expired `verification_codes` row with `type='password_reset'`.
- Hashes new password using pepper+SHA-256+bcrypt.
- Updates `users.password_hash`, deletes the used token, returns `200`.

#### `Login(c *gin.Context)`
- Accepts `LoginInput`.
- Determines identifier in priority order: `identifier` → `email` → `username`.
- Loads user by `email = identifier OR username = identifier`.
- Verifies password using the centralized verifier.
  - If verification matched a **legacy** hash (old bcrypt without pepper), it performs **seamless migration**:
    - Re-hashes the password using the new scheme and updates `users.password_hash`.
- Rejects banned users with `403` and `error_code='BANNED'`.
- Rejects non-verified users with `403`.
- Issues JWT and stores it in an `HttpOnly` cookie `auth_token`.
  - Expiration is 72h by default, 30 days if `remember_me=true`.
- Returns `200` with `{"user": user}`.

#### `Logout(c *gin.Context)`
- Clears the `auth_token` cookie (MaxAge=-1) and returns `200`.

---

## File: `backend/internal/handlers/user.go`

### Purpose
Implements authenticated user endpoints for profile retrieval and account changes.

### Main routes
- `GET /api/me` → `GetMe`
- `PUT /api/me/age` → `UpdateAge`
- `PUT /api/me/password` → `UpdatePassword`
- `POST /api/me/email/request-old` → `RequestOldEmailCode`
- `POST /api/me/email/verify-old` → `VerifyOldEmailCode`
- `POST /api/me/email/request-new` → `RequestNewEmailCode`
- `POST /api/me/email/verify-new` → `VerifyNewEmailCode`

### Notes about unused handler
- `GetProfile` exists but is not registered in `backend/cmd/api/main.go` (currently unused).

### Functions

#### `GetProfile(c *gin.Context)`
- Loads a user by `:userId` path param and returns the `models.User` JSON.
- Not currently routed.

#### `GetMe(c *gin.Context)`
- Requires auth middleware to set `user_id` in context.
- Loads current user from DB.
- Loads `achievements` and `titles` via service layer and attaches them to the user response.
- Returns `200` with full `models.User` JSON.

#### `UpdateAge(c *gin.Context)`
- Accepts JSON `{age}` with validation `min=1,max=120`.
- Updates `users.age` for the current user.
- Returns `200` with a message.

#### `UpdatePassword(c *gin.Context)`
- Accepts `{current_password, new_password}`.
- Verifies current password using centralized verifier.
- Validates new password strength.
- Hashes new password (pepper+SHA-256+bcrypt) and updates `users.password_hash`.
- Increments `users.token_version` to invalidate existing JWT sessions.
- Returns `200`.

#### `generateCode() string`
- Generates a 6-digit numeric code as a string.
- Used for email change flows.

#### `RequestOldEmailCode(c *gin.Context)`
- Accepts `{email}` and checks that it matches the current account email.
- Creates a verification code row with `type='old_email'` expiring in 15 minutes.
- Sends a code to the current email address.

#### `VerifyOldEmailCode(c *gin.Context)`
- Accepts `{code}`.
- Validates non-expired code with `type='old_email'` for current user.
- Deletes the code and returns `200`.

#### `RequestNewEmailCode(c *gin.Context)`
- Accepts `{email}` (new email).
- Validates format and checks it is not already taken.
- Creates a verification code row with `type='new_email'` expiring in 15 minutes.
- Sends a code to the new email address.

#### `VerifyNewEmailCode(c *gin.Context)`
- Accepts `{code}`.
- Validates non-expired code with `type='new_email'`.
- Updates `users.email` to the verified new email and deletes the code.

#### `UpdateUsername(c *gin.Context)`
- Accepts `{username}`.
- Normalizes and validates username using `validation` helpers.
- Rejects duplicates (case-insensitive).
- Updates `users.username` and returns the updated `models.User`.

---

## File: `backend/internal/handlers/admin_users.go`

### Purpose
Admin CRUD and moderation operations over users.

### Main routes
- `GET /api/admin/users` → `AdminListUsers`
- `GET /api/admin/users/:id` → `AdminGetUser`
- `GET /api/admin/users/by-username/:username` (root only) → `AdminGetUserProfileByUsername`
- `POST /api/admin/users` → `AdminCreateUser`
- `PUT /api/admin/users/:id` → `AdminUpdateUser`
- `PUT /api/admin/users/:id/ban` → `AdminBanUser`
- `PUT /api/admin/users/:id/unban` → `AdminUnbanUser`
- `POST /api/admin/users/:id/reset-password-default` → `AdminResetUserPasswordDefault`
- `DELETE /api/admin/users/:id` → `AdminDeleteUser`

### Types
- `AdminListUsersResponse`: `{ users: User[], total: number }`.
- `AdminUpdateUserInput`: patch-like user update payload.
- `AdminCreateUserInput`: payload to create user.
- `AdminBanUserInput`: `{reason}`.

### Functions

#### `adminRoleLevel(role string) int`
- Maps roles to numeric levels for comparisons: root=4, admin=3, moderator=2, user=1.

#### `canAssignRole(requesterRole, desiredRole string) bool`
- Enforces role assignment rules:
  - No one can assign `root`.
  - `root` can assign `user|moderator|admin`.
  - `admin` can assign `user|moderator`.

#### `canActOnTarget(requesterRole string, requesterID, targetID int64, targetRole string) bool`
- Enforces action rules on a target user:
  - Cannot act on `root`.
  - Cannot act on self.
  - `admin` cannot act on other admins.

#### `AdminListUsers(c *gin.Context)`
- Supports filters:
  - `q`: substring match on username/email (case-insensitive).
  - `role`: `user|moderator|admin|root|all`.
  - `status`: `active|not_verified|banned|all`.
  - `page` (default 1), `limit` (default 50, max 200).
- Returns `200` with `AdminListUsersResponse`.

#### `AdminGetUser(c *gin.Context)`
- Loads a user by id and returns selected fields.

#### `AdminGetUserProfileByUsername(c *gin.Context)`
- Loads a user by exact username (case-insensitive).
- Loads achievements and titles via service layer.
- Returns `{ user, achievements, titles }`.

#### `AdminUpdateUser(c *gin.Context)`
- Patch-updates user fields: role, username, email, is_verified.
- When security-sensitive fields change (role, verification), increments `token_version` to invalidate sessions.
- Applies permission rules using `canAssignRole` and `canActOnTarget`.

#### `AdminCreateUser(c *gin.Context)`
- Creates a user (admin/root only).
- Validates username/email/password.
- Hashes password via centralized password hasher.
- Creates user with `is_verified=true`.

#### `AdminBanUser(c *gin.Context)`
- Sets `is_banned=true` and stores `ban_reason`.
- Protected by permission checks (cannot ban self; cannot ban root; admins cannot ban admins).

#### `AdminUnbanUser(c *gin.Context)`
- Clears `is_banned` and `ban_reason`.

#### `AdminResetUserPasswordDefault(c *gin.Context)`
- Resets user password to the configured default password (see admin settings module).
- Hashes it via centralized password hasher and increments `token_version`.

#### `AdminDeleteUser(c *gin.Context)`
- Deletes a user record.
- Protected by the same permission checks.

---

## File: `backend/internal/handlers/admin_root.go`

### Purpose
Root-only actions.

### Main routes
- `POST /api/admin/root/transfer` → `AdminTransferRoot`

### Types
- `AdminTransferRootInput`: `{ target_user_id, password }`.

### Functions

#### `AdminTransferRoot(c *gin.Context)`
- Requires current caller role to be `root`.
- Verifies the current root password using centralized verifier.
  - If legacy matched, upgrades password hash.
- Validates that target user exists and has role `admin`.
- Executes a DB transaction:
  - Locks current root row and target admin row.
  - Demotes current root to `admin` and increments `token_version`.
  - Promotes target admin to `root` and increments `token_version`.
- Returns `200` with `{ force_logout: true }` to signal clients to re-authenticate.

