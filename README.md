# LycorisLib (Docker Edition)

Полный стек проекта в Docker: **PostgreSQL**, **Go API**, **Next.js Frontend** и **Nginx** (внутри контейнера).

## 🛠 1. Подготовка (Prerequisites)

На сервере должны быть установлены **Docker** и **Docker Compose**.
Для Ubuntu можно использовать готовую команду:

```bash
make docker-ubuntu

```

---

## 🚀 2. Быстрый запуск

### Шаг 1: Инициализация

Создает необходимые `.env` файлы из шаблонов.

```bash
make install

```

### Шаг 2: Настройка окружения

Отредактируй файл `backend/.env.docker`. Основные параметры:

| Переменная | Значение для Локалки | Значение для VPS |
| --- | --- | --- |
| **JWT_SECRET** | любая строка | длинная случайная строка |
| **FRONTEND_URL** | `http://localhost:8081` | `https://your-domain` |
| **BACKEND_URL** | `http://localhost:8081` | `https://your-domain` |
| **ALLOWED_ORIGINS** | `http://localhost:8081` | `https://your-domain` |
| **IS_PRODUCTION** | `false` | `true` |

### Шаг 3: Переменная для Frontend (SSR)

Создай файл `.env` в корне репозитория (рядом с `docker-compose.yml`):

```env
NEXT_PUBLIC_SITE_URL=https://your-domain

```

### Шаг 4: Запуск

```bash
make up  # Запуск на порту 8081 (рекомендуется)
```

Важно:

- Для VPS + домена + HTTPS (Cloudflare / host nginx/caddy) используй `make up` и проксируй на `http://127.0.0.1:8081`.
- `make up80` публикует Docker-nginx прямо на `80:80` и конфликтует с host nginx/caddy на `80/443`.

Если тебе нужен вариант без host proxy (обычно для локалки/простого HTTP), и порт 80 свободен:

```bash
make up80
```

---

## 🔒 3. Настройка HTTPS (Production)

Самый стабильный вариант: **Host Proxy**. Docker слушает порт `8081`, а системный Nginx/Caddy на хосте принимает трафик на `80/443` и проксирует его внутрь.

### Вариант А: Cloudflare Origin (Рекомендуется)

Если домен за Cloudflare, это самый простой путь.

1. Создай **Origin Certificate** в панели Cloudflare.
2. Сохрани их на VPS: `/etc/ssl/cloudflare/origin.pem` и `origin.key`.
3. Настрой системный Nginx на хосте:

#### Создание конфига

Создай файл конфигурации (замени `lycoris` на имя своего проекта):

```bash
sudo nano /etc/nginx/sites-available/lycoris

```

#### Шаг 2: Настройка проксирования

Вставь следующий блок (для работы с **Cloudflare Origin Certificate**):

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain;

    ssl_certificate     /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/origin.key;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name lycorislib.moe;
    return 301 https://$host$request_uri;
}

```

#### Шаг 3: Активация сайта

Выполни эти команды, чтобы Nginx увидел новый файл:

```bash
# 1. Создаем ссылку для активации
sudo ln -s /etc/nginx/sites-available/lycoris /etc/nginx/sites-enabled/

# 2. Проверяем на ошибки
sudo nginx -t

# 3. Перезапускаем сервис
sudo systemctl reload nginx

```


### Вариант Б: Certbot (Let's Encrypt)

Если Cloudflare не используется:

1. Установи Certbot: `sudo apt install certbot python3-certbot-nginx`.
2. Создай простой конфиг Nginx на порту 80 с `proxy_pass [http://127.0.0.1:8081](http://127.0.0.1:8081)`.
3. Запусти `sudo certbot --nginx -d your-domain`.

---

## 💻 4. Локальная разработка (без Docker)

Если нужно вносить правки в код с горячей перезагрузкой:

1. **Бэкенд**: Настрой `backend/.env` (база должна быть запущена).
2. **Фронтенд**: Настрой `frontend/.env.local`.
3. **Запуск**:
```bash
make dev

```


*Frontend: localhost:3000, API: localhost:8080*

---

## 💾 5. Обслуживание и Бэкапы

### Юридические страницы (Privacy/Terms/Cookies/DMCA)

Эти страницы берут текст из `.docx` файлов в папке `docs/` в корне репозитория.

Что редактировать:

- [docs/COOKIE POLICY.docx](file:///home/seva/Program/anime_site/docs/COOKIE%20POLICY.docx)
- [docs/DMCA _ COPYRIGHT POLICY.docx](file:///home/seva/Program/anime_site/docs/DMCA%20_%20COPYRIGHT%20POLICY.docx)
- [docs/PRIVACY POLICY.docx](file:///home/seva/Program/anime_site/docs/PRIVACY%20POLICY.docx)
- [docs/TERMS OF SERVICE.docx](file:///home/seva/Program/anime_site/docs/TERMS%20OF%20SERVICE.docx)

Важно:

- Имена файлов должны совпадать 1:1 с тем, что указано в [legal-documents.ts](file:///home/seva/Program/anime_site/frontend/lib/legal-documents.ts).
- На проде эти файлы должны быть на сервере. По умолчанию compose монтирует `./docs` (папка рядом с `docker-compose.yml`) в контейнер как `/docs`.
- Если у тебя `docker-compose.yml` лежит не рядом с папкой `docs/` (например ты запускаешь compose из другой директории), задай абсолютный путь:

```bash
export DOCS_DIR=/var/www/lycorislib/docs
docker compose up -d
```

Если видишь "Unable to load the document content":

- проверь, что папка `docs/` есть на сервере и в ней лежат `.docx` файлы;
- перезапусти фронт: `docker compose restart frontend`.

### Команды Docker (чтобы не перепутать)

Запуск:

- `make up` — поднять проект в фоне (порт `8081`).
- `make up80` — поднять проект на порту `80` (только если не используешь host nginx/caddy и порт свободен).

Остановка:

- `make down` — остановить и удалить контейнеры/сеть (данные Postgres сохраняются в volume).
- `docker compose stop` — просто остановить контейнеры (можно потом `docker compose start`).

Остановка + удаление данных (осторожно):

- `make clean` — остановить и удалить всё, включая volume Postgres (данные БД пропадут).

### Автоперезапуск после перезагрузки VPS

В проекте уже включено `restart: unless-stopped` для сервисов в `docker-compose.yml`, поэтому после рестарта Docker контейнеры поднимутся автоматически.

Чтобы Docker сам стартовал после ребута:

```bash
sudo systemctl enable --now docker
```

Если контейнеры не должны подниматься автоматически, останови их вручную:

- `docker compose stop` (не поднимутся, пока не сделаешь `docker compose start`)
- `make down` (контейнеры будут удалены)

### Полезные команды

* `make ps` — статус контейнеров.
* `make logs` — просмотр логов в реальном времени.
* `make restart` — быстрый перезапуск сервисов.

### Работа с базой (PostgreSQL)

Бэкапы сохраняются в папку `backup/` в корне проекта.

* **Создать бэкап**:
```bash
make backup-db lycoris_db

```


* **Восстановить из бэкапа**:

```bash
make restore-db lycoris_db BACKUP=backup/lycoris_db/YYYY-MM-DD_HH-MM-SS
```
