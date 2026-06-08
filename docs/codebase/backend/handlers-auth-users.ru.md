# Backend Handlers: Auth & Users (RU)

Документ описывает **HTTP-хендлеры Go-бэкенда**, которые отвечают за аутентификацию и админские операции над пользователями.

## Обхват
- Папка: `backend/internal/handlers`
- Файлы в этом документе:
  - `auth.go`
  - `user.go`
  - `admin_users.go`
  - `admin_root.go`

Маршруты регистрируются в `backend/cmd/api/main.go`.

---

## Файл: `backend/internal/handlers/auth.go`

### Назначение
Публичные эндпоинты аутентификации: регистрация, логин/логаут, верификация email, сброс пароля.

### Основные маршруты
- `POST /api/register` → `Register`
- `POST /api/login` → `Login`
- `POST /api/logout` → `Logout`
- `GET /api/verify-email` → `VerifyEmail`
- `POST /api/resend-verification` → `ResendVerification`
- `POST /api/forgot-password` → `ForgotPassword`
- `POST /api/reset-password` → `ResetPassword`

### Типы
- `RegisterInput`: JSON-тело регистрации (`username`, `email`, `password`, `confirm_password`).
- `LoginInput`: JSON-тело логина. Поддерживает `identifier` (email или username), `password`, `remember_me`.

### Функции

#### `publicWebBaseURL() string`
- Возвращает `FRONTEND_URL` (из конфига) без завершающего `/`.
- Используется для построения ссылок в письмах.

#### `generateToken(length int) string`
- Генерирует криптостойкий токен через `crypto/rand`, возвращает hex-строку.
- Используется для токенов верификации email и сброса пароля.

#### `Register(c *gin.Context)`
- Валидирует вход (`username`, `email`, подтверждение пароля).
- Хэширует пароль через единый модуль паролей (pepper+SHA-256+bcrypt).
- Создаёт запись `users` с ролью `user` и `is_verified=false`.
- Создаёт `verification_codes` (`type='email_verification'`, срок 24 часа).
- Отправляет письмо со ссылкой `FRONTEND_URL/verify-confirm?token=...`.
- Возвращает `201` с общим сообщением.

#### `VerifyEmail(c *gin.Context)`
- Берёт `token` из query.
- Ищет неистёкший `verification_codes` с `type='email_verification'`.
- Ставит `users.is_verified=true` и удаляет использованный код.
- Возвращает `200`.

#### `ResendVerification(c *gin.Context)`
- Принимает `{email}`.
- Если пользователь существует и не верифицирован:
  - Удаляет старые `email_verification` токены.
  - Генерирует новый токен.
  - Отправляет повторное письмо.
- Возвращает `200`.

#### `ForgotPassword(c *gin.Context)`
- Принимает `{email}`.
- Всегда возвращает общее `200` сообщение, чтобы не раскрывать, существует ли email.
- Если пользователь найден:
  - Удаляет старые `password_reset` токены.
  - Создаёт новый токен (срок 1 час).
  - Отправляет письмо со ссылкой `FRONTEND_URL/reset-password?token=...`.

#### `ResetPassword(c *gin.Context)`
- Принимает `{token, password}`.
- Проверяет сложность пароля.
- Проверяет токен по `verification_codes` (`type='password_reset'`, не истёк).
- Хэширует новый пароль (pepper+SHA-256+bcrypt).
- Обновляет `users.password_hash`, удаляет токен, возвращает `200`.

#### `Login(c *gin.Context)`
- Принимает `LoginInput`.
- Определяет идентификатор в порядке: `identifier` → `email` → `username`.
- Загружает пользователя по `email = identifier OR username = identifier`.
- Проверяет пароль через единый верификатор.
  - Если совпало по **legacy** (старый bcrypt без перца), выполняет **авто‑миграцию**:
    - Перехэширует пароль по новой схеме и обновляет `users.password_hash`.
- Для забаненного пользователя возвращает `403` и `error_code='BANNED'`.
- Для не верифицированного пользователя возвращает `403`.
- Выдаёт JWT и кладёт его в `HttpOnly` cookie `auth_token`.
  - Время жизни: 72 часа, или 30 дней при `remember_me=true`.
- Возвращает `200` с `{"user": user}`.

#### `Logout(c *gin.Context)`
- Сбрасывает cookie `auth_token` (MaxAge=-1) и возвращает `200`.

---

## Файл: `backend/internal/handlers/user.go`

### Назначение
Эндпоинты для авторизованного пользователя: получение профиля и изменение аккаунта.

### Основные маршруты
- `GET /api/me` → `GetMe`
- `PUT /api/me/age` → `UpdateAge`
- `PUT /api/me/password` → `UpdatePassword`
- `POST /api/me/email/request-old` → `RequestOldEmailCode`
- `POST /api/me/email/verify-old` → `VerifyOldEmailCode`
- `POST /api/me/email/request-new` → `RequestNewEmailCode`
- `POST /api/me/email/verify-new` → `VerifyNewEmailCode`

### Примечание про неиспользуемый хендлер
- `GetProfile` определён, но не зарегистрирован в `backend/cmd/api/main.go` (сейчас не используется).

### Функции

#### `GetProfile(c *gin.Context)`
- Загружает пользователя по `:userId` и возвращает `models.User`.
- Сейчас не привязан к роуту.

#### `GetMe(c *gin.Context)`
- Требует, чтобы middleware положил `user_id` в контекст.
- Загружает текущего пользователя.
- Подтягивает `achievements` и `titles` через сервисный слой и добавляет их в ответ.
- Возвращает `200`.

#### `UpdateAge(c *gin.Context)`
- Принимает `{age}` с валидацией `min=1,max=120`.
- Обновляет `users.age`.
- Возвращает `200` с сообщением.

#### `UpdatePassword(c *gin.Context)`
- Принимает `{current_password, new_password}`.
- Проверяет текущий пароль через единый верификатор.
- Проверяет сложность нового пароля.
- Хэширует новый пароль и обновляет `users.password_hash`.
- Инкрементит `users.token_version`, чтобы инвалидировать текущие сессии.
- Возвращает `200`.

#### `generateCode() string`
- Генерирует 6‑значный код.
- Используется в сценарии смены email.

#### `RequestOldEmailCode(c *gin.Context)`
- Принимает `{email}` и проверяет совпадение с текущим email аккаунта.
- Создаёт код `verification_codes` с `type='old_email'` на 15 минут.
- Отправляет код на текущий email.

#### `VerifyOldEmailCode(c *gin.Context)`
- Принимает `{code}`.
- Проверяет неистёкший код `type='old_email'`.
- Удаляет код и возвращает `200`.

#### `RequestNewEmailCode(c *gin.Context)`
- Принимает `{email}` (новый email).
- Проверяет формат и что email не занят.
- Создаёт код `type='new_email'` на 15 минут.
- Отправляет код на новый email.

#### `VerifyNewEmailCode(c *gin.Context)`
- Принимает `{code}`.
- Проверяет неистёкший код `type='new_email'`.
- Обновляет `users.email` и удаляет код.

#### `UpdateUsername(c *gin.Context)`
- Принимает `{username}`.
- Нормализует и валидирует username через `validation`.
- Проверяет уникальность (без учёта регистра).
- Обновляет `users.username` и возвращает обновлённого пользователя.

---

## Файл: `backend/internal/handlers/admin_users.go`

### Назначение
Админские операции над пользователями: список/просмотр, обновление, создание, бан/разбан, сброс пароля, удаление.

### Основные маршруты
- `GET /api/admin/users` → `AdminListUsers`
- `GET /api/admin/users/:id` → `AdminGetUser`
- `GET /api/admin/users/by-username/:username` (root only) → `AdminGetUserProfileByUsername`
- `POST /api/admin/users` → `AdminCreateUser`
- `PUT /api/admin/users/:id` → `AdminUpdateUser`
- `PUT /api/admin/users/:id/ban` → `AdminBanUser`
- `PUT /api/admin/users/:id/unban` → `AdminUnbanUser`
- `POST /api/admin/users/:id/reset-password-default` → `AdminResetUserPasswordDefault`
- `DELETE /api/admin/users/:id` → `AdminDeleteUser`

### Типы
- `AdminListUsersResponse`: `{ users: User[], total: number }`.
- `AdminUpdateUserInput`: частичное обновление пользователя.
- `AdminCreateUserInput`: payload создания пользователя.
- `AdminBanUserInput`: `{reason}`.

### Функции

#### `adminRoleLevel(role string) int`
- Приводит роль к числу: root=4, admin=3, moderator=2, user=1.

#### `canAssignRole(requesterRole, desiredRole string) bool`
- Правила выдачи ролей:
  - Никто не может назначать `root`.
  - `root` может назначать `user|moderator|admin`.
  - `admin` может назначать `user|moderator`.

#### `canActOnTarget(requesterRole string, requesterID, targetID int64, targetRole string) bool`
- Правила действий над целью:
  - Нельзя действовать на `root`.
  - Нельзя действовать на себя.
  - `admin` не может действовать на других `admin`.

#### `AdminListUsers(c *gin.Context)`
- Фильтры:
  - `q`: поиск по username/email (подстрока, без учёта регистра).
  - `role`: `user|moderator|admin|root|all`.
  - `status`: `active|not_verified|banned|all`.
  - `page` (по умолчанию 1), `limit` (по умолчанию 50, максимум 200).
- Возвращает `200` с `AdminListUsersResponse`.

#### `AdminGetUser(c *gin.Context)`
- Возвращает пользователя по id (выбираются основные поля).

#### `AdminGetUserProfileByUsername(c *gin.Context)`
- Ищет пользователя по точному username (case-insensitive).
- Подтягивает достижения и звания через `service`.
- Возвращает `{ user, achievements, titles }`.

#### `AdminUpdateUser(c *gin.Context)`
- Частично обновляет: `role`, `username`, `email`, `is_verified`.
- Если меняется безопасность (роль/верификация), увеличивает `token_version`.
- Применяет ограничения через `canAssignRole`/`canActOnTarget`.

#### `AdminCreateUser(c *gin.Context)`
- Создаёт пользователя (доступно admin/root).
- Валидирует username/email/password.
- Хэширует пароль через единый модуль.
- Создаёт пользователя с `is_verified=true`.

#### `AdminBanUser(c *gin.Context)`
- Ставит `is_banned=true` и сохраняет `ban_reason`.
- Запрещает банить себя/`root`; `admin` не может банить `admin`.

#### `AdminUnbanUser(c *gin.Context)`
- Снимает бан: `is_banned=false`, `ban_reason=NULL`.

#### `AdminResetUserPasswordDefault(c *gin.Context)`
- Сбрасывает пароль на дефолтный (см. модуль настроек админки).
- Хэширует через единый модуль и увеличивает `token_version`.

#### `AdminDeleteUser(c *gin.Context)`
- Удаляет пользователя.
- Применяет те же проверки прав.

---

## Файл: `backend/internal/handlers/admin_root.go`

### Назначение
Root-only операции.

### Основные маршруты
- `POST /api/admin/root/transfer` → `AdminTransferRoot`

### Типы
- `AdminTransferRootInput`: `{ target_user_id, password }`.

### Функции

#### `AdminTransferRoot(c *gin.Context)`
- Требует роль `root` у вызывающего.
- Проверяет пароль текущего root через единый верификатор.
  - Если совпало через legacy — обновляет хэш.
- Проверяет, что target пользователь существует и имеет роль `admin`.
- Делает транзакцию:
  - Лочит текущего root и target admin.
  - Понижает root до `admin` (+ `token_version`).
  - Повышает target до `root` (+ `token_version`).
- Возвращает `200` и `{ force_logout: true }`.

