# Stalking

Қазақстанда сталкинг, киберқудалау, шантаж немесе үй қаупіне тап болған адамдарға арналған тыныш ақпараттық платформа.

Спокойная информационная платформа поддержки для людей в Казахстане, столкнувшихся со сталкингом, киберпреследованием, шантажом или домашней угрозой.

**Это не полиция, не экстренная служба, не кризисный центр, не юрист, не врач и не психолог.**

Заголовок браузера: `Stalking — қауіпсіз көмек / безопасная помощь в Казахстане`

---

## Стек

- Django 5 + WhiteNoise
- SQLite для быстрого локального старта
- PostgreSQL через Docker Compose (опционально)
- Google GenAI SDK (`google-genai`) для необязательного AI-помощника

---

## Что хранится, а что нет

| Данные | Где |
|--------|-----|
| Регионы, проверенный каталог служб, правовые ссылки, контент-страницы | PostgreSQL / SQLite |
| Язык интерфейса (`kk` / `ru`) | Cookie `stalking_lang` |
| Тест риска, план безопасности, доказательства, черновик заявления | Только память вкладки / DOM — **не** в БД, cookie, localStorage, sessionStorage, логи |
| Сообщения Gemini | Не сохраняются; уходят на сервер → Google Gemini только после согласия и кнопки «Отправить» |
| Анонимный запрос помощи (`/help-request/`) | **Zero-Persistence:** Не сохраняется в БД, cookie, localStorage или логи. Сервер очищает EXIF-метаданные прикреплённого изображения в RAM и отправляет plain text письмо на `HELP_REQUEST_EMAIL` через SMTP |
| Таблица пользователей/пострадавших | **Нет** |

### Анонимная помощь специалиста (`/help-request/`)

- Реализована **без сохранения в базу данных** (Zero-Persistence). Сообщения, контакты и файлы не оседают на диске и не логируются.
- Очистка метаданных: Сервер удаляет EXIF/GPS теги и метаданные загружаемых изображений в оперативной памяти перед отправкой.
- Email специалиста настраивается строго через переменную `HELP_REQUEST_EMAIL` в `.env`. Если переменная пуста или не задана, онлайн-форма автоматически отключается в безопасный режим, направляя пользователей на проверенные горячие линии (111, 150) и в шелтеры.
- Спам-защита: Включает Honeypot и ограничение частоты запросов (`HELP_REQUEST_RATE_LIMIT=5` в час).

---

## Быстрый локальный запуск (SQLite)

```powershell
cd "C:\Users\bahon\OneDrive\Desktop\Stalking-ai"
python -m pip install -r requirements.txt
copy .env.example .env
# Отредактируйте .env при необходимости. GEMINI_API_KEY можно оставить пустым.

python manage.py migrate
python manage.py seed_regions
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

Откройте: http://127.0.0.1:8000/

Админка редактора: http://127.0.0.1:8000/admin/

---

## PostgreSQL (Docker)

```powershell
copy .env.example .env
# В .env установите:
# DATABASE_URL=postgres
# POSTGRES_* — как в .env.example

docker compose up -d
python manage.py migrate
python manage.py seed_regions
python manage.py runserver 127.0.0.1:8000
```

### Резервное копирование / восстановление (Postgres)

```powershell
docker compose exec db pg_dump -U stalking stalking > backup.sql
# восстановление:
Get-Content backup.sql | docker compose exec -T db psql -U stalking stalking
```

Обновление схемы: `python manage.py migrate` после получения новых миграций.

---

## Gemini API key (опционально)

1. Создайте ключ в [Google AI Studio](https://aistudio.google.com/apikey).
2. Впишите **локально** в файл `.env`:

```
GEMINI_API_KEY=ваш_ключ
GEMINI_MODEL=gemini-2.0-flash
```

3. Не коммитьте `.env`, не вставляйте ключ во frontend и не присылайте его в чат.
4. Без ключа сайт полностью работает; AI показывает спокойное сообщение о недоступности.
5. Возможны расходы по тарифам Google Gemini — следите за квотой в консоли провайдера.
6. Сообщение пользователя уходит через сервер проекта в Gemini и может обрабатываться по правилам Google.

---

## Production (кратко)

- HTTPS обязателен (`DJANGO_SECURE_SSL_REDIRECT=True`, secure cookies).
- Смените `DJANGO_SECRET_KEY`, `DEBUG=False`, настройте `ALLOWED_HOSTS` и `CSRF_TRUSTED_ORIGINS`.
- PostgreSQL, бэкапы, ограниченный доступ к `/admin/`.
- Секреты — только env / Secret Manager.
- Не подключайте аналитику и трекинг без крайней необходимости.

---

## Редактор каталога

Публикация `SupportService` возможна **только** после `contacts_verified` и `source_verified`.  
Не добавляйте фиктивные центры. Если данных нет — на сайте показывается пустое состояние со ссылкой на gov.kz.

Проверенные экстренные номера (ручная проверка 2026-10-13):

- 102, 112, 103 — egov.kz
- 111 — gov4c.kz / Постановление Правительства РК №901
- 150 — telephone150.kz (национальная линия доверия)

---

## Лицензия / использование

Информационный ресурс. Не обещает нулевые ошибки, полную невидимость или юридический исход.
