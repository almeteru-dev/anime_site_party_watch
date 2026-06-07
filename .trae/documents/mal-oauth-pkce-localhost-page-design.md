# Page Design — MyAnimeList OAuth PKCE + MAL Search

## Global Styles (Desktop-first)
- Layout system: CSS Grid для каркаса страниц + Flexbox внутри компонентов.
- Background: `#0B0F19` (темный), Surface: `#111827`, Border: `#1F2937`.
- Typography: Inter/System UI, base 16px; H1 28px/700, H2 22px/700, body 16px/400, small 13px.
- Accent: `#22C55E` (primary), Hover: `#16A34A`, Danger: `#EF4444`.
- Buttons: primary (solid), secondary (outline), disabled (40% opacity).
- Links: underline on hover, color `#60A5FA`.
- Spacing: 8px grid (8/16/24/32).
- Responsive: до 768px — 1 колонка, фильтры/панели уходят под контент.

---

## Page 1 — Публичный поиск аниме
### Meta Information
- Title: "Поиск аниме — MyAnimeList"
- Description: "Поиск аниме через MAL API v2."
- Open Graph: title/description + `og:type=website`.

### Page Structure
- Верхняя навигация (sticky)
- Контентный контейнер (max-width 1120px)
- Основной блок: поиск + результаты

### Sections & Components
1) Header / Navbar
- Слева: название сайта/раздела.
- Справа: ссылка “Админ” (видна только если пользователь имеет доступ к админке).

2) Search Bar
- Input (placeholder: “Введите название аниме…”) + кнопка “Найти”.
- Поведение: Enter запускает поиск; debounce опционально (не обязателен).

3) Results Area
- Состояния:
  - Loading: skeleton карточек.
  - Empty: текст “Ничего не найдено”.
  - Error: алерт с текстом ошибки; отдельный кейс “MAL не подключён (нужна настройка в админке)”.
- Сетка карточек: 4 колонки на desktop, 2 на tablet, 1 на mobile.
- Карточка результата:
  - Постер (если есть), title (1–2 строки), кнопка/линк “Открыть”.
  - Клик ведёт на `/anime/:id`.

---

## Page 2 — Карточка аниме (/anime/:id)
### Meta Information
- Title: "{Название} — аниме"
- Description: "Детали аниме из MAL."
- Open Graph: `og:title`, `og:image` (если есть постер).

### Page Structure
- Верхняя навигация
- Двухколоночный layout (desktop): слева постер, справа детали

### Sections & Components
1) Breadcrumb / Back
- Кнопка “← Назад к поиску”.

2) Media Column
- Постер large/medium.

3) Details Column
- Заголовок (title)
- Короткие поля (в 2 колонки): тип, год/сезон, эпизоды (если доступно).
- External link: “Открыть на MyAnimeList”.

4) Error/Loading
- Loading skeleton.
- Error banner (например, “Токен истёк, требуется переподключение в админке”).

---

## Page 3 — Админ: Интеграция MyAnimeList (/admin/mal)
### Meta Information
- Title: "Админ — Интеграция MyAnimeList"
- Description: "Подключение MAL через OAuth PKCE и управление токенами."

### Page Structure
- Dashboard layout: слева (опционально) админ-меню проекта, справа контент.
- Контент: карточки статуса + действия.

### Sections & Components
1) Integration Status Card
- Badge: “Подключено / Не подключено”.
- Поля:
  - `expires_at` (читаемо)
  - “Последняя ошибка” (если есть)
- Кнопка “Проверить запрос” (дергает тестовый endpoint и показывает результат).

2) OAuth Connect Card
- Primary button: “Подключить MAL”.
- Secondary: “Переподключить” (если уже подключено).
- Текст подсказки: редирект на MAL и возврат на localhost callback.

3) Token Actions
- Кнопка “Обновить токен (refresh)”.
- Danger button “Отозвать/сбросить токены”.
- Диалог подтверждения для revoke.

4) Callback Handling (/admin/mal/callback)
- Мини-страница/экран состояния:
  - “Подключаем…” (loading)
  - “Успешно подключено” + кнопка “Вернуться в интеграцию”
  - Ошибка: показать причину (state mismatch / code invalid) и кнопку “Назад”.

### Interaction & Transitions
- Все админские действия показывают toast (success/error) + disable кнопок во время запроса.
- Анимации минимальные: fade-in для алертов/тостов (150–200ms).
