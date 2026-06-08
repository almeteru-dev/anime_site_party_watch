# Password Hashing System (Standard bcrypt)

## English

### Overview
The backend stores user password hashes in `users.password_hash` (bcrypt modular crypt string). The current scheme is:

1) Hash: `bcrypt(password, cost=12)`

This is a standard implementation that uses a per-user salt (automatically managed by bcrypt). It also supports **seamless migration** from old hashes that were created with the "Pepper + SHA-256 + Bcrypt" scheme.

### Configuration

#### `backend/.env.docker.example`
- `PEPPER_PASS=` is no longer required but can be kept for transition purposes.

#### `backend/internal/config/config.go`
File purpose: loads environment-based configuration into `config.AppConfig`.

Functions:
- `LoadConfig()`: reads env vars into `AppConfig`. `PEPPER_PASS` is now optional.
- `splitCSV(value string) []string`: splits a CSV string into trimmed items.
- `uniqueNonEmpty(values []string) []string`: removes empty values and de-duplicates.
- `getEnv(key, fallback string) string`: reads an env var with a fallback.
- `getEnvAsBool(key string, fallback bool) bool`: reads a boolean env var.

### Password hashing helper

#### `backend/internal/security/password.go`
File purpose: centralizes password hashing and verification.

Constants:
- `PasswordHashCost = 12`: explicit bcrypt cost for new hashes.

Functions:
- `HashPassword(password string) (string, error)`: `bcrypt(password, cost=12)`.
- `VerifyPassword(hash string, password string) (ok bool, legacy bool)`:
  - First tries standard scheme: compare `hash` vs raw `password`.
  - If it fails, tries old peppered scheme (if `PEPPER_PASS` is set): compare `hash` vs `SHA256(password + PEPPER_PASS)`.
  - Returns `legacy=true` when old peppered scheme matched.

### Call sites (where hashing / verification happens)

#### `backend/internal/handlers/auth.go`
File purpose: registration, email verification, password reset, login/logout.

Functions:
- `Register(c)`: validates user input and stores `PasswordHash = HashPassword(input.Password)`.
- `ForgotPassword(c)`: issues a reset token.
- `ResetPassword(c)`: updates `password_hash` using `HashPassword(newPassword)`.
- `Login(c)`: verifies password via `VerifyPassword(user.PasswordHash, input.Password)`.
  - If `legacy=true`, performs **auto-migration**: re-hashes with the standard scheme and updates `users.password_hash`.

#### `backend/internal/handlers/user.go`
File purpose: profile + account management.

Functions (password-related):
- `UpdatePassword(c)`: verifies current password via `VerifyPassword(...)` and updates `password_hash` using `HashPassword(newPassword)`.

#### `backend/internal/handlers/admin_users.go`
File purpose: admin operations on users.

Functions (password-related):
- `AdminCreateUser(c)`: creates a user and hashes password via `HashPassword(input.Password)`.
- `AdminResetUserPasswordDefault(c)`: resets a user password to the configured default, and hashes it via `HashPassword(defaultPassword)`.

#### `backend/internal/handlers/admin_root.go`
File purpose: privileged root-only actions.

Functions (password-related):
- `AdminTransferRoot(c)`: verifies the current root password via `VerifyPassword(...)`. If legacy matched, it also upgrades hash in DB.

#### `backend/internal/app/seed.go`
File purpose: initial seeding.

Functions:
- `Seed(db)`: seeds an admin user and hashes the default password using `HashPassword("admin")`.

---

## Русский

### Обзор
Бэкенд хранит хэш пароля пользователя в `users.password_hash` (строка bcrypt в modular crypt формате). Текущая схема:

1) Хэш: `bcrypt(пароль, cost=12)`

Это стандартная реализация, использующая соль для каждого пользователя (автоматически управляется bcrypt). Также реализована **плавная миграция** со старых хэшей, которые были сделаны по схеме "Перец + SHA-256 + Bcrypt".

### Конфигурация

#### `backend/.env.docker.example`
- Переменная `PEPPER_PASS=` больше не обязательна, но может быть оставлена для переходного периода.

#### `backend/internal/config/config.go`
Назначение файла: загрузка конфигурации из env в `config.AppConfig`.

Функции:
- `LoadConfig()`: читает env vars в `AppConfig`. Проверка `PEPPER_PASS` на обязательность удалена.
- `splitCSV(value string) []string`: разбивает CSV в массив значений.
- `uniqueNonEmpty(values []string) []string`: удаляет пустые значения и дубликаты.
- `getEnv(key, fallback string) string`: читает переменную окружения с fallback.
- `getEnvAsBool(key string, fallback bool) bool`: читает bool переменную окружения.

### Хелпер для паролей

#### `backend/internal/security/password.go`
Назначение файла: единое место для хэширования и проверки паролей.

Константы:
- `PasswordHashCost = 12`: явный cost для новых bcrypt-хэшей.

Функции:
- `HashPassword(password string) (string, error)`: `bcrypt(пароль, cost=12)`.
- `VerifyPassword(hash string, password string) (ok bool, legacy bool)`:
  - Сначала пробует стандартную схему: сравнение `hash` с сырым `password`.
  - Если не совпало — пробует старую схему с перцем (если `PEPPER_PASS` задан): сравнение `hash` с `SHA256(пароль + PEPPER_PASS)`.
  - Возвращает `legacy=true`, если совпало через старую схему с перцем.

### Точки использования (где хэшируем/проверяем)

#### `backend/internal/handlers/auth.go`
Назначение файла: регистрация, верификация email, сброс пароля, логин/логаут.

Функции:
- `Register(c)`: валидирует данные и сохраняет `PasswordHash = HashPassword(input.Password)`.
- `ForgotPassword(c)`: выдаёт reset-токен.
- `ResetPassword(c)`: обновляет `password_hash` через `HashPassword(newPassword)`.
- `Login(c)`: проверяет пароль через `VerifyPassword(user.PasswordHash, input.Password)`.
  - Если `legacy=true`, выполняет **авто-миграцию**: перехэширует по стандартной схеме и обновляет `users.password_hash`.

#### `backend/internal/handlers/user.go`
Назначение файла: профиль и управление аккаунтом.

Функции (по паролям):
- `UpdatePassword(c)`: проверяет текущий пароль через `VerifyPassword(...)` и обновляет `password_hash` через `HashPassword(newPassword)`.

#### `backend/internal/handlers/admin_users.go`
Назначение файла: админские операции над пользователями.

Функции (по паролям):
- `AdminCreateUser(c)`: создаёт пользователя и хэширует пароль через `HashPassword(input.Password)`.
- `AdminResetUserPasswordDefault(c)`: сбрасывает пароль на дефолтный и хэширует через `HashPassword(defaultPassword)`.

#### `backend/internal/handlers/admin_root.go`
Назначение файла: root-only операции.

Функции (по паролям):
- `AdminTransferRoot(c)`: проверяет пароль текущего root через `VerifyPassword(...)`. Если совпало legacy — тоже обновляет хэш в БД.

#### `backend/internal/app/seed.go`
Назначение файла: первичное заполнение.

Функции:
- `Seed(db)`: создаёт admin пользователя и хэширует пароль через `HashPassword("admin")`.
