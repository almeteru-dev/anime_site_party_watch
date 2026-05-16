## 1. Product Overview
Платформа для совместного просмотра аниме в реальном времени с поддержкой Kodik плеера. Позволяет пользователям создавать комнаты, приглашать друзей и смотреть видео одновременно с полной синхронизацией всех действий в плеере.
- Основная проблема: отсутствие возможности совместного просмотра с синхронизацией через внешний iframe-плеер Kodik
- Целевая аудитория: все зарегистрированные пользователи платформы
- Рыночная ценность: увеличение вовлеченности и удержания пользователей за счет социального взаимодействия с поддержкой основного видеоплеера сайта

## 2. Core Features

### 2.1 User Roles
| Role | Registration Method | Core Permissions |
|------|---------------------|------------------|
| Authenticated User (Participant) | Sign in with existing site authentication | Join room via invite link; watch synced playback; chat; view participants; leave room |
| Room Owner (Creator) | Authenticated user creates a room | All Participant permissions; select content for the room; control playback (play/pause/seek/rate); generate/copy invite link; manually dissolve room |

### 2.2 Feature Module
Our Watch Party requirements consist of the following main pages:
1. **Create Watch Party**: content selection, room settings summary, create room.
2. **Watch Party Room**: synchronized player, synchronized content selection display, real-time chat, participant list/roles, invite link sharing, room lifecycle (leave/dissolve/expired).
3. **Sign in / Register (existing)**: authenticate before creating a room (and to fully participate).

### 2.3 Page Details
| Страница | Модуль | Описание |
|---------|--------|----------|
| Страница комнаты (watch-party/[roomId]) | Видео плеер Kodik | Интегрированный iframe плеер с поддержкой postMessage API для синхронизации всех действий |
| Страница комнаты | Панель участников | Список всех пользователей в комнате с указанием их ролей (владелец, модератор, зритель) |
| Страница комнаты | Чат комнаты | Текстовый чат для общения участников во время просмотра |
| Страница создания комнаты | Форма создания | Выбор аниме, настроек приватности, генерация пригласительной ссылки |
| Страница входа по инвайту | Форма подключения | Ввод пароля (для приватных комнат) и подключение к существующей комнате |

## 3. Core Process
**Authenticated User (Participant) Flow**
1. Open an invite link.
2. If not signed in, sign in and return to the room.
3. Join the room and see the selected content, synchronized playback, participants list, and chat.
4. Watch while playback and content selection stay synchronized.
5. Send/receive chat messages.
6. Leave the room at any time.

**Room Owner Flow**
1. Sign in.
2. Go to “Create Watch Party”, select content, and create the room.
3. Share the invite link.
4. In the room, control playback (play/pause/seek/rate) and optionally switch the selected content.
5. End the room by manually dissolving it, or by leaving (which dissolves it automatically).
6. If the room reaches its maximum lifetime (12h), it expires/dissolves.

```mermaid
graph TD
  A[Главная страница] --> B[Создать комнату /watch-party/new]
  A --> C[Присоединиться /watch-party/join/[inviteCode]]
  B --> D[Страница комнаты /watch-party/[roomId]]
  C --> D
  D --> E[Синхронизация Kodik плеера]
  D --> F[Чат участников]
  D --> G[Панель управления комнатой]
```

## 4. UI/UX

### 4.1 Design Style
- Primary color: #8b5cf6 (фиолетовый), secondary: #06b6d4 (циановый)
- Кнопки: скругленные 12px, современный hover-эффект
- Шрифты: Inter, основной текст 14px, заголовки 18px
- Лейаут: карточный дизайн, верхняя навигация, сетка 3 колонки (участники | плеер | чат)
- Иконки: линейные из Lucide, минималистичный стиль
- Ключевой элемент: кнопка «Войти в трансляцию» для обхода политики автоплея браузеров

### 4.2 UI Elements
| Страница | Элемент | Описание |
|----------|---------|----------|
| Страница комнаты | Kodik плеер | iframe занимает всю центральную ячейку сетки, имеет оверлей с кнопкой «Войти в трансляцию» до первого клика пользователя |
| Страница комнаты | Панель участников | Фиксированная боковая панель с аватарами пользователей, роль подсвечивается цветом (владелец — золото, модератор — синий) |
| Страница комнаты | Чат | Скролл-контейнер с сообщениями, поле ввода внизу, собственные сообщения выровнены вправо |
| Страница создания | Форма создания | Карточка с полями: выбор аниме, чекбокс приватности, ввод пароля, кнопка генерации инвайта |

### 4.3 Responsiveness
Десктоп-first, мобильная адаптация с перестроением лейаута в одну колонку, сенсорные взаимодействия оптимизированы. Кнопка входа в трансляцию адаптируется под размер экрана.

### 4.4 Дополнительные требования к реализации
- Защита от зацикливания (infinite loop): локальный флаг подавления событий после выполнения синхронной команды
- Алгоритм Heartbeat: проверка рассинхрона >2.5 секунд с принудительной перемоткой только при превышении порога
- Обработка политики автоплея: обязательный клик пользователя перед первым запуском плеера
