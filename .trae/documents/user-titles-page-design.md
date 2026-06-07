# Page Design — Звания пользователей (desktop-first)

## Global Styles
- Layout: desktop-first, max-width 1200px, центрирование, 24px gutter; внутри секций — CSS Grid + Flex.
- Typography: base 16px; H1 28/32, H2 20/28, body 16/24, caption 12/16.
- Colors: фон #0B0F14; surface #111827; border #243042; text #E5E7EB; muted #9CA3AF.
- Accent: primary #3B82F6; danger #EF4444.
- Buttons: высота 40px; primary/secondary/ghost; hover — +8% яркости; disabled 50% opacity.
- Tags (звания): pill 24–28px height, padding 6–10px; background — `title.color`; текст — авто (white/black по контрасту).

## Page: Вход (/login)
- Meta: title «Вход», description «Авторизация пользователя».
- Structure: одна колонка; card по центру (420–480px).
- Sections & Components:
  - LoginCard: заголовок, поля (email/пароль или провайдеры — по текущей реализации Auth), кнопка «Войти».
  - InlineError: текст ошибки под кнопкой.
  - PostLoginRedirect: после успеха — в профиль пользователя.

## Page: Профиль пользователя (/profile/:userId)
- Meta: title «Профиль», description «Публичная информация профиля и звания».
- Layout: двухколоночный на desktop (основной контент 8/12 + сайдбар 4/12); на узких — в одну колонку.
- Sections & Components:
  - ProfileHeader: имя/аватар (если есть в проекте), базовые данные.
  - TitlesSection:
    - SectionTitle «Звания».
    - TagsRow/Grid: список тегов званий пользователя.
      - Локализация: показывать название по текущему языку интерфейса (en/ru/uk); если ru/uk пусто — показывать en.
    - EmptyState: «Пока нет званий».
  - Placement guideline: размещать «Звания» рядом с «Достижениями» (если они есть) и визуально отличать заголовком/иконкой.

## Page: Админ-панель званий (/admin/titles) — root only
- Meta: title «Админ: Звания», description «Управление званиями и назначениями».
- Access:
  - При загрузке — проверка root (через чтение роли); при отказе — экран «Нет доступа».
- Page Structure: dashboard layout.
  - TopBar: название раздела, индикатор текущего пользователя.
  - Tabs (или segmented control): «Звания» / «Назначение пользователям».

### Tab: Звания (CRUD)
- Components:
  - TitlesTable:
    - Колонки: Code, Name (RU/EN/UK), Color, Actions.
    - Actions: Edit, Delete (с confirm).
  - TitleForm (drawer/modal или правая панель): поля code, name_en (обяз.), name_ru (опц.), name_uk (опц.), color (color input + preview tag).
  - Save/Cancel.

### Tab: Назначение пользователям
- Components:
  - UserPicker: поиск/выбор пользователя (минимально: ввод userId).
  - AssignedTitles:
    - Список назначенных званий (теги) + действие «Снять».
  - AvailableTitles:
    - Список всех званий + действие «Назначить».
  - Feedback: toast/inline status «Назначено/Снято/Ошибка».