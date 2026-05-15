# Дизайн страниц (desktop-first): Админское управление пользователями

## Global Styles (общие для админки)
- Layout: 12-колоночная сетка (CSS Grid) + Flex для тулбаров/форм. Контейнер 1200–1280px, центрирование.
- Цвета/токены: background `#0B1220`; surface `#111A2E`; text `#E6EEF9`; muted `#9BB0CC`; primary `#5B8CFF`; danger `#FF4D4F`; border `rgba(255,255,255,0.08)`.
- Типографика: Inter/System; base 14–16px; заголовки 18/24/32.
- Кнопки: primary/secondary/ghost + danger; hover — увеличение яркости и лёгкая тень; disabled — 40% opacity.
- Поля: высота 36–40px; состояния error (danger), focus ring (primary 2px).
- Таблицы: зебра-строки, sticky header, горизонтальный скролл при узких окнах.
- Responsive: desktop-first; при <1024px — контейнер 100%, фильтры уходят в 2 строки; при <768px — таблица в карточки строк.

---

## Страница: /admin/login — Вход администратора
### Meta Information
- Title: "Админка — Вход"
- Description: "Вход в панель администратора"
- OG: title/description совпадают, `og:type=website`

### Page Structure
- Центрированный card-layout (Flex), ширина 420–480px.

### Sections & Components
1) Header
- Логотип/название продукта, подпись «Только для администраторов».
2) Login Card
- Поле Email
- Поле Пароль (иконка показать/скрыть)
- Кнопка «Войти»
- Сообщение ошибки (над кнопкой): «Неверные данные» / «Нет прав администратора» (без раскрытия деталей)
3) Поведение
- После успешного входа: редирект на `/admin/users`.
- При попытке зайти на `/admin/users` без прав: редирект сюда.

---

## Страница: /admin/users — Управление пользователями
### Meta Information
- Title: "Админка — Пользователи"
- Description: "Поиск, фильтры и действия над пользователями"
- OG: title/description, `og:type=website`

### Page Structure
- Верхняя панель + основной контент.
- Основной контент: фильтры (toolbar) + таблица + пагинация.

### Sections & Components
1) Top Bar
- Заголовок «Пользователи»
- Справа: кнопка «Создать пользователя», меню профиля админа (минимум: «Выйти»)

2) Filters Toolbar (в одну строку на desktop)
- Search input: placeholder «Поиск по email/имени/ID» + debounce
- Select «Статус»: Active / Banned / Deleted / All
- Select «Роль»: User / Admin / All
- Кнопка «Сбросить» (возвращает дефолтные фильтры)

3) Users Table
- Колонки: ID (короткий), Email, Имя, Роль, Статус, Дата регистрации, Действия
- Статус бейджами: Active (primary outline), Banned (danger), Deleted (muted)
- Действия (inline menu):
  - «Забанить…» (если не забанен) → модалка причины
  - «Разбанить» (если забанен)
  - «Удалить…» → confirm modal (мягкое удаление)
- Empty state: текст + подсказка «Измени фильтры или создай пользователя»
- Loading state: skeleton rows

4) Create User Modal
- Поля: Email (обяз.), Имя/ник (опц.)
- Кнопки: «Создать» / «Отмена»
- Валидация: email format; обработка конфликтов (email уже занят)

5) Ban Modal
- Поле: Причина (обяз., textarea 3–5 строк)
- Кнопки: «Забанить» (danger) / «Отмена»
- После бана: строка обновляется, причина доступна в popover/tooltip у бейджа Banned

6) Delete Confirm Modal
- Текст предупреждения: «Пользователь будет помечен как удалённый»
- Кнопки: «Удалить» (danger) / «Отмена»

7) Pagination
- Показ «1–50 из N», контролы страниц, выбор размера (50/100)

### Interaction & Access Control
- UI-guard: если роль не admin — показывать «Нет доступа» и редирект на `/admin/login`.
- Все опасные операции требуют подтверждения (бан/удаление).
- Ошибки сервера показывать как toast + строковое сообщение под тулбаром (одно место для ошибок).