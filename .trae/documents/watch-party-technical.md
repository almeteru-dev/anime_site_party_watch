# Техническая архитектура функционала Watch Party для LycorisLib

## 1. Архитектура решения
```mermaid
graph TD
    A[Браузер пользователя] --> B[Next.js Frontend (WatchPartyRoom компонент)]
    B --> C[Go Backend WebSocket Handler]
    C --> D[PostgreSQL (хранение данных комнат)]
    
    subgraph "Фронтенд слой"
        B
    end
    
    subgraph "Бэкенд слой (Go)"
        C
    end
    
    subgraph "Слой данных"
        D
    end
```

## 2. Используемые технологии
- Фронтенд: Next.js 14 + React 18 + TypeScript + TailwindCSS 3
- Инициализация: существующий проект Next.js, доработка компонентов
- Бэкенд: Go 1.22 + gorilla/websocket для обработки WebSocket соединений
- База данных: PostgreSQL 15
- Инфраструктура: Docker Compose, Nginx как реверс-прокси

## 3. Определение роутов
| Роут | Назначение |
|------|------------|
| /watch-party/[roomId] | Страница комнаты совместного просмотра, доступ только по уникальной ссылке |
| /api/watchparty/create | API для создания новой комнаты, возвращает roomId |
| /ws/watchparty/[roomId] | WebSocket эндпоинт для обмена сообщениями внутри комнаты |

## 4. Архитектура бэкенда (Go)
### 4.1 Структуры данных
```go
// User - участник комнаты
type User struct {
    ID       string
    Name     string
    IsOwner  bool
    Conn     *websocket.Conn
}

// Room - комната совместного просмотра
type Room struct {
    ID         string
    OwnerID    string
    Users      map[string]*User // key: user ID
    CreatedAt  time.Time
    ExpiresAt  time.Time
    CurrentState PlayerState
}

// PlayerState - текущее состояние плеера
type PlayerState struct {
    IsPlaying bool
    Time      float64
    Season    int
    Episode   int
    TranslationID int
}

// Message - сообщение, передаваемое через WebSocket
type Message struct {
    Type    string      `json:"type"` // play, pause, seek, change_episode, transfer_ownership
    Payload interface{} `json:"payload"`
}
```

### 4.2 Механизм очистки комнат
В бэкенде запускается фоновый горутин, который каждые 15 минут проверяет все существующие комнаты и удаляет те, у которых истек срок действия (ExpiresAt < time.Now()). При удалении комнаты все соединения пользователей закрываются.

### 4.3 WebSocket хендлеры
1. **CreateRoom**: Создает новую комнату, генерирует уникальный ID, устанавливает время истечения через 12 часов, добавляет создателя как Владельца.
2. **JoinRoom**: Обрабатывает подключение нового пользователя, добавляет его в список участников комнаты, отправляет ему текущее состояние плеера.
3. **HandleMessage**: Проверяет права отправителя (только Владелец может отправлять команды управления), валидирует сообщение, вызывает broadcast для отправки состояния всем Зрителям.
4. **Broadcast**: Рассылает сообщение всем пользователям комнаты, кроме отправителя (чтобы избежать эхо и повторной обработки у Владельца).
5. **TransferOwnership**: Изменяет владельца комнаты по запросу текущего Владельца, рассылает всем участникам обновленный список ролей.

### 4.4 Авторизация команд
Сервер перед обработкой каждой команды (play/pause/seek/change_episode) проверяет, что отправитель является текущим Владельцем комнаты. Команды от Зрителей игнорируются и не рассылаются другим участникам.

## 5. Архитектура фронтенда (Next.js)
### 5.1 Компонент WatchPartyRoom
```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

type PlayerState = {
  isPlaying: boolean;
  time: number;
  season: number;
  episode: number;
  translationId: number;
};

export default function WatchPartyRoom({ roomId }: { roomId: string }) {
  const socketRef = useRef<WebSocket | null>(null);
  const playerIframeRef = useRef<HTMLIFrameElement | null>(null);
  const currentStateRef = useRef<PlayerState>({
    isPlaying: false,
    time: 0,
    season: 0,
    episode: 0,
    translationId: 0
  });
  const [isOwner, setIsOwner] = useState(false);
  const [users, setUsers] = useState<Array<{id: string, name: string, isOwner: boolean}>>([]);

  // Подключение к WebSocket и обработка сообщений от Kodik
  useEffect(() => {
    // Инициализация сокета
    socketRef.current = new WebSocket(`ws://${window.location.host}/ws/watchparty/${roomId}`);
    
    // Обработчик сообщений от Kodik плеера
    const kodikMessageHandler = (event: MessageEvent) => {
      if (!isOwner || !socketRef.current) return;
      
      // Обработка событий плеера и отправка команд на сервер
      if (event.data?.key === 'kodik_player_play') {
        socketRef.current.send(JSON.stringify({ type: 'play' }));
      } else if (event.data?.key === 'kodik_player_pause') {
        socketRef.current.send(JSON.stringify({ type: 'pause' }));
      } else if (event.data?.key === 'kodik_player_seek') {
        socketRef.current.send(JSON.stringify({ 
          type: 'seek', 
          payload: { time: event.data.value.time } 
        }));
      } else if (event.data?.key === 'kodik_player_current_episode') {
        socketRef.current.send(JSON.stringify({
          type: 'change_episode',
          payload: {
            season: event.data.value.season,
            episode: event.data.value.episode,
            translationId: event.data.value.translation.id
          }
        }));
      }
    };

    window.addEventListener('message', kodikMessageHandler);

    // Обработка сообщений от WebSocket сервера
    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const iframe = playerIframeRef.current?.contentWindow;
      if (!iframe) return;

      // Предохранитель от лишних обновлений состояния
      if (data.type === 'change_episode') {
        if (
          data.payload.episode === currentStateRef.current.episode &&
          data.payload.season === currentStateRef.current.season &&
          data.payload.translationId === currentStateRef.current.translationId
        ) return;
        
        // Обновляем текущее состояние
        currentStateRef.current = {
          ...currentStateRef.current,
          season: data.payload.season,
          episode: data.payload.episode,
          translationId: data.payload.translationId
        };

        // Отправляем команду плееру
        iframe.postMessage({
          key: 'kodik_player_api',
          value: {
            method: 'change_episode',
            season: data.payload.season,
            episode: data.payload.episode
          }
        }, '*');
      } else if (data.type === 'play') {
        iframe.postMessage({ key: 'kodik_player_api', value: { method: 'play' } }, '*');
      } else if (data.type === 'pause') {
        iframe.postMessage({ key: 'kodik_player_api', value: { method: 'pause' } }, '*');
      } else if (data.type === 'seek') {
        iframe.postMessage({ 
          key: 'kodik_player_api', 
          value: { method: 'seek', seconds: data.payload.time } 
        }, '*');
      }
    };

    // Функция очистки при размонтировании компонента
    return () => {
      window.removeEventListener('message', kodikMessageHandler);
      socketRef.current?.close();
    };
  }, []);

  // Функция передачи прав владения
  const transferOwnership = (userId: string) => {
    if (!isOwner || !socketRef.current) return;
    socketRef.current.send(JSON.stringify({
      type: 'transfer_ownership',
      payload: { newOwnerId: userId }
    }));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4">
      <div className="flex-1">
        <iframe 
          ref={playerIframeRef}
          src={`https://kodik.info/...`} // код для инициализации Kodik плеера
          width="100%" 
          height="auto"
          allowFullScreen
          className="aspect-video w-full rounded-lg"
        />
        
        {/* Интерфейс выбора серий/озвучек - только для Владельца */}
        {isOwner && (
          <div className="mt-4 flex gap-4">
            <select className="px-4 py-2 rounded-lg bg-gray-800 text-white">
              {/* Список серий из существующего каталога */}
            </select>
            <select className="px-4 py-2 rounded-lg bg-gray-800 text-white">
              {/* Список озвучек из существующего каталога */}
            </select>
          </div>
        )}
      </div>
      
      {/* Панель участников */}
      <div className="w-full lg:w-80 bg-gray-900 rounded-lg p-4">
        <h3 className="text-xl font-bold text-white mb-4">Участники</h3>
        <div className="space-y-3">
          {users.map(user => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white">{user.name}</span>
                {user.isOwner && <span className="text-yellow-400">👑</span>}
              </div>
              {isOwner && !user.isOwner && (
                <button 
                  onClick={() => transferOwnership(user.id)}
                  className="text-sm px-3 py-1 bg-purple-600 rounded-md text-white"
                >
                  Передать права
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## 6. Конфигурация Nginx
Добавить в конфигурацию Nginx следующий блок для проксирования WebSocket соединений:
```nginx
server {
    listen 8081;
    server_name localhost;

    location /ws/ {
        proxy_pass http://go-backend:8080; # адрес бэкенда в Docker сети
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Остальные location директивы для проксирования фронтенда и API
    location / {
        proxy_pass http://nextjs:3000;
    }
}
```

## 7. Модель данных PostgreSQL
### 7.1 Определение таблиц
```sql
-- Таблица комнат
CREATE TABLE watchparty_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    current_is_playing BOOLEAN DEFAULT false,
    current_time FLOAT DEFAULT 0,
    current_season INTEGER DEFAULT 1,
    current_episode INTEGER DEFAULT 1,
    current_translation_id INTEGER DEFAULT 0
);

-- Таблица участников комнат
CREATE TABLE watchparty_room_users (
    room_id UUID REFERENCES watchparty_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    username VARCHAR(255) NOT NULL,
    is_owner BOOLEAN DEFAULT false,
    PRIMARY KEY (room_id, user_id)
);

-- Индексы для оптимизации очистки старых комнат
CREATE INDEX idx_watchparty_rooms_expires_at ON watchparty_rooms(expires_at);
```

### 7.2 Политики доступа (если используется Supabase, можно адаптировать)
```sql
-- Предоставление прав доступа
GRANT SELECT, INSERT, UPDATE, DELETE ON watchparty_rooms TO authenticated;
GRANT SELECT, INSERT, DELETE ON watchparty_room_users TO authenticated;
```