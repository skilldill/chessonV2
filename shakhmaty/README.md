# Шахматы онлайн

Минимальный русскоязычный Astro-сайт для `https://шахматы-онлайн.рф`:
заголовок, короткое описание, две кнопки и 3D-фигуры. На главной и тематических
страницах одинаковый экран; меняются только заголовок, описание и SEO-метаданные.
Дополнительных секций, SEO-текстов и FAQ нет.

- `/` — Шахматы онлайн
- `/shahmaty_online_besplatno/` — Шахматы онлайн бесплатно
- `/shahmaty_s_drugom_online/` — Шахматы с другом онлайн (существующий адрес сохранён)
- `/shahmaty_online_s_drugom_po_ssylke/` — Шахматы онлайн с другом по ссылке
- `/shahmaty_online_s_drugom/` — Шахматы онлайн с другом
- `/onlayn_shahmaty_po_ssylke_s_drugom/` — Шахматы онлайн по ссылке с другом
- `/shahmaty_s_drugom_onlayn/` — Шахматы с другом онлайн по ссылке
- `/shahmaty_s_drugom/` — Шахматы с другом
- `/shahmaty_online_s_botom/` — Шахматы онлайн играть с ботом

## Разработка

Node.js >= 22.12, npm >= 10.8.2.

```sh
npm ci
npm run astro -- dev --background
npm test
```

`npm test` собирает сайт и проверяет все девять минимальных HTML-страниц,
метаданные, sitemap, robots.txt и ссылки автоматического создания комнат.

## SEO

Canonical, title, description, robots, Open Graph, Twitter Card и JSON-LD
WebSite/WebPage находятся в `src/layouts/Layout.astro`.
Все метаданные присутствуют в статическом HTML без выполнения JavaScript.
У каждой страницы собственный canonical. Sitemap содержит все девять страниц.
Тексты вариантов заданы в `src/data/landingPages.mjs`. Изображение для ссылок:
`public/social-preview.jpg`. Проверочные токены и счётчики chesson.me не копировались.

Общий с `shakhmatyGame` счётчик Метрики — `113658367`. Нажатия игровых кнопок
отправляют цель `play_click` с режимом (`mode`), адресом страницы (`landing_path`),
`app: shakhmaty` и `placement: landing`. Цели создания комнаты, первого хода и
завершения партии отправляет игровой клиент; настройка целей в кабинете описана
в `../shakhmatyGame/README.md`.

Основной домен задан в `src/config.mjs`. Для смены canonical при сборке:

```sh
PUBLIC_SITE_URL=https://example.com npm run build
```

## Запуск Игры

Кнопки ведут на `https://3d.chesson.me/create-room`
с автоматическим созданием комнаты в `shakhmatyGame`.
С другом: 10 минут каждому. С ботом: 30 минут, средняя сложность, игрок белыми.
При нажатии добавляется уникальный requestId. Продакшен-ссылки не заменяются локальными.

## Docker И Домены

Dockerfile собирает Astro на Node.js 24 и публикует статические файлы через Apache
на внутреннем порту 80, по аналогии с `site`. `.dockerignore` исключает локальные
зависимости, сборки и `.env` из контекста. Для смены canonical доступен build argument
`PUBLIC_SITE_URL`; по умолчанию остаётся `https://шахматы-онлайн.рф`.
Зеркало npm по умолчанию совпадает с существующими Dockerfile. Если оно недоступно
или работает медленно, используйте `docker compose build --build-arg NPM_REGISTRY=https://registry.npmjs.org shakhmaty shakhmaty-game`.

В корневом docker-compose.yml добавлены сервисы `shakhmaty` и `shakhmaty-game`.
Контейнеры: `chesson-shakhmaty` и `chesson-shakhmaty-game`.

nginx.conf направляет русский домен на Astro, а `3d.chesson.me` — на игру.
Неизвестные страницы Astro возвращают 404. Старые ссылки `/create-room` и `/game/*`
на русском домене перенаправляются на игровой поддомен с сохранением пути и параметров.
Canonical и sitemap не меняют домен; `noindex` установлен только на игровом хосте.

HTTPS завершается на внешнем прокси. На нём нужны DNS/сертификаты и маршруты
для `шахматы-онлайн.рф` и `3d.chesson.me` к этому nginx по HTTP, с передачей
исходного `Host` и `X-Forwarded-Proto: https`. Внутренний nginx не требует новых
файлов сертификатов. ASCII-имя русского домена: `xn----7sbab9bkekdf6b7a0b9b.xn--p1ai`.

На сервере с уже работающим API и остальным стеком:

```sh
docker compose up -d --build --no-deps shakhmaty shakhmaty-game
docker compose run --rm --no-deps nginx nginx -t
docker compose up -d --no-deps --force-recreate nginx
```

Последняя команда пересоздаёт только nginx, чтобы он подхватил новый bind-mounted
конфиг и зависимости. API и MongoDB не перезапускаются; WebSocket-соединения могут
кратковременно переподключиться.

После публикации отправьте `/sitemap-index.xml` русского домена в Яндекс Вебмастер
и Google Search Console. Существующие сервисы `site`, `client` и `mobile` не заменяются.

В исходной зависимости `tailwind` и её цепочке ранее обнаружены предупреждения аудита.
Это не Tailwind CSS: стили подключены через `@tailwindcss/vite` и `tailwindcss`.
Замена исходного пакета в эту задачу не входит.
