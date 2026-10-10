# Партия с ботом со страницы site

## Страницы

Основные страницы: `/ru/play-chess-with-bot/` и `/play-chess-with-bot/`.
Русские дополнительные адреса:

- `/shahmaty_online_s_botom/`
- `/igrat_v_shahmaty_s_botom/`
- `/shahmaty_s_kompyuterom/`
- `/igrat_v_shahmaty_s_kompyuterom_online/`
- `/shahmaty_s_botom_bez_registratsii/`

Английские дополнительные адреса:

- `/play_chess_with_a_bot/`
- `/chess_online_with_a_bot/`
- `/play_chess_against_computer/`
- `/chess_vs_computer/`
- `/chess_with_a_bot_no_signup/`

Каждый язык использует один canonical; дополнительные адреса не дублируются
в sitemap. Это альтернативные входы, а не десять независимо индексируемых
копий одной страницы. Указаны взаимные hreflang и локализованные метаданные/FAQ.
Названия адресов описывают намерение пользователя, но не являются подтверждённым
рейтингом частотности поисковых запросов.

`BotGamePage.astro` использует общую разметку `GameLandingPage.astro`, настройки
`GameLandingSettings.astro` и существующий 3D-фон `HeroBackdrop`. Контент и адреса
находятся в `src/data/botGame.ts`.

## Автоматический вход

Форма отправляет GET на `game.chesson.me/create-room` или
`mobile.chesson.me/create-room` в зависимости от устройства:

```text
/create-room?mode=bot&autoStart=1&gameMode=standard&source=bot-landing&requestId=<uuid>&timeMinutes=30&incrementSeconds=0&botDifficulty=medium&color=white
```

По умолчанию: 30+0, средняя сложность, белые фигуры. Все варианты времени
совпадают с игровой формой. Сложности: `super_easy`, `easy`, `medium`, `hard`.
Цвет: `white` или `black`. Время лендинга сохраняется отдельно от игры с другом.

Оба приложения проверяют параметры через `botGameEntry.ts`, затем общий
`GameEntryScreen` вызывает существующий `useCreateRoom`. В запрос передаются
таймеры в секундах, добавление, `vsBot: true`, `botDifficulty`, `color`,
`botMoveTimeMs: 800`, `withAIhints: true` и `requestId`. Подсказки включаются
так же, как при обычном создании игры с ботом в приложениях.

Успешный запрос заменяет адрес на `/game/{roomId}`. Старая сохранённая партия
не перехватывает переход. При подключении гостя существующий API добавляет бота,
запускает игру и, если игрок выбрал чёрные фигуры, выполняет первый ход ботом.
Повторные запросы с тем же `requestId` используют защиту API от дубликатов
(10 минут в памяти одного процесса). Обычный `/create-room` остаётся каталогом.

## Проверки

`cd api && bun test`: параметры обеих платформ, таймеры, сложности, цвета,
некорректные/повторяющиеся параметры, локализация и защита создания комнат.

Для браузерной проверки нужны локальные site, client и mobile (4321, 5173, 5174),
а также API с рабочим Stockfish. `friend-game-api.preload.ts` сюда не подходит:
он отключает движок, поэтому реальную партию с ботом не проверяет.

```sh
cd api
WITHOUT_MONGO=true PORT=4001 STOCKFISH_PATH=/absolute/path/to/stockfish bun run index.ts
TEST_API_ORIGIN=http://127.0.0.1:4001 node test/bot-game-browser-check.mjs
```

`TEST_API_ORIGIN` перенаправляет HTTP и WebSocket только в тестовом браузере;
приложения менять не нужно. Для отдельной сборки site можно задать
`TEST_SITE_ORIGIN=http://127.0.0.1:4322`. Нестандартный путь Chromium задаётся
переменной `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.

Проверяются все 12 адресов, языки и SEO-разметка, непустая анимированная сцена,
разметка от 320 до 1920 пикселей, переход кнопки на нужное приложение, настоящий
первый ход бота, таймеры, восстановление страницы комнаты, повторный вход с тем же
UUID, ошибка/повторная попытка и отказ от создания при неверных настройках.
Production-переходы в тесте перехватываются: production-комнаты не создаются.

Для выпуска нужно совместно развернуть site, client, mobile и API с поддержкой
`requestId` из предыдущего изменения игры с другом. После выпуска проверить
переходы на обоих доменах и добавить события аналитики начала партии с ботом.
