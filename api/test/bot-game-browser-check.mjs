import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, devices } from '../../client/node_modules/playwright/index.mjs';

const apiOrigin = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:4000';
const site = process.env.TEST_SITE_ORIGIN || 'http://127.0.0.1:4321';
const ru = ['shahmaty_online_s_botom', 'igrat_v_shahmaty_s_botom', 'shahmaty_s_kompyuterom', 'igrat_v_shahmaty_s_kompyuterom_online', 'shahmaty_s_botom_bez_registratsii'];
const en = ['play_chess_with_a_bot', 'chess_online_with_a_bot', 'play_chess_against_computer', 'chess_vs_computer', 'chess_with_a_bot_no_signup'];
const canonical = { ru: 'https://chesson.me/ru/play-chess-with-bot/', en: 'https://chesson.me/play-chess-with-bot/' };
const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

async function roomState(roomId, predicate = () => true) {
    for (let attempt = 0; attempt < 100; attempt++) {
        const response = await fetch(apiOrigin + '/api/rooms/' + roomId);
        const state = (await response.json()).gameState;
        if (state && predicate(state)) return state;
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('Room did not reach expected state: ' + roomId);
}

async function waitForBotGame(page, color) {
    await page.waitForFunction((color) => window.__socketMessages.some((message) =>
        message.gameState?.gameStarted && message.gameState?.manualBotRoom
        && message.gameState?.player?.color === color
        && message.gameState?.opponent?.userName === 'Chesson Bot'), color);
}

try {
    const sitemap = await readFile(new URL('../../site/dist/sitemap-0.xml', import.meta.url), 'utf8');
    for (const [lang, aliases] of Object.entries({ ru, en })) {
        for (const path of [new URL(canonical[lang]).pathname, ...aliases.map((alias) => '/' + alias + '/')]) {
            const response = await fetch(site + path);
            assert.equal(response.status, 200, path);
            const html = await response.text();
            assert(html.includes(`lang="${lang}"`));
            assert(html.includes(`href="${canonical[lang]}"`));
            if (lang === 'en') assert(!/[а-яё]/i.test(html), 'English HTML: ' + path);
            assert(html.includes('name="botDifficulty"'));
        }
        assert(sitemap.includes(canonical[lang]));
        for (const alias of aliases) assert(!sitemap.includes(alias));
    }
    console.log('Twelve bot routes, languages, canonical, hreflang and sitemap passed');

    for (const lang of ['ru', 'en']) {
        for (const mobile of [false, true]) {
            const name = lang + (mobile ? '-mobile' : '-desktop');
            const origin = 'http://127.0.0.1:' + (mobile ? 5174 : 5173);
            const context = await browser.newContext({
                ...(mobile ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 } }),
                locale: 'ru-RU',
            });
            await context.route('https://mc.yandex.ru/**', (route) => route.abort());
            await context.route('**/api/**', async (route) => {
                const url = new URL(route.request().url());
                const response = await route.fetch({ url: apiOrigin + url.pathname + url.search });
                return route.fulfill({ response });
            });
            await context.addInitScript(({ apiOrigin }) => {
                const NativeWebSocket = window.WebSocket;
                window.__socketMessages = [];
                window.WebSocket = class extends NativeWebSocket {
                    constructor(url, protocols) {
                        const target = new URL(url);
                        if (target.port === '4000') target.host = new URL(apiOrigin).host;
                        super(target.href, protocols);
                        this.addEventListener('message', (event) => {
                            try { window.__socketMessages.push(JSON.parse(event.data)); } catch { /* Non-JSON frames are not game state. */ }
                        });
                    }
                };
                localStorage.setItem('gameData', JSON.stringify({ gameId: 'old-room', playerName: 'Old player', avatar: '0' }));
            }, { apiOrigin });
            await context.route('https://*.chesson.me/create-room?**', (route) => {
                const target = new URL(route.request().url());
                assert.equal(target.hostname, mobile ? 'mobile.chesson.me' : 'game.chesson.me');
                assert.equal(target.searchParams.get('mode'), 'bot');
                return route.fulfill({ status: 302, headers: { location: origin + target.pathname + target.search } });
            });
            const page = await context.newPage();
            const errors = [];
            const posts = [];
            page.on('pageerror', (error) => errors.push(error.message));
            page.on('request', (request) => {
                if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/rooms') posts.push(request.postDataJSON());
            });
            await page.goto(site + '/' + (lang === 'ru' ? ru[0] : en[0]) + '/');
            assert.equal(await page.locator('html').getAttribute('lang'), lang);
            assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), canonical[lang]);
            assert.equal(await page.locator('link[hreflang=ru]').getAttribute('href'), canonical.ru);
            assert.equal(await page.locator('link[hreflang=en]').getAttribute('href'), canonical.en);
            if (lang === 'en') assert(!/[а-яё]/i.test(await page.locator('body').innerText()));
            assert.equal(await page.locator('[name=timeMinutes]').inputValue(), '30');
            assert.equal(await page.locator('[name=botDifficulty]').inputValue(), 'medium');
            assert.equal(await page.locator('[name=color]').inputValue(), 'white');
            await page.getByRole('button', { name: lang === 'ru' ? 'Ок' : 'OK', exact: true }).click();
            await page.waitForSelector('canvas');
            await page.waitForTimeout(1500);
            const hidden = await page.addStyleTag({ content: '.friend-hero-content, header { visibility:hidden !important; }' });
            const first = await page.locator('canvas').screenshot();
            let second = first;
            for (let frame = 0; frame < 8 && first.equals(second); frame++) {
                await page.waitForTimeout(500);
                second = await page.locator('canvas').screenshot();
            }
            await page.screenshot({ path: '/private/tmp/chesson-bot-scene-check.png' });
            assert(!first.equals(second), name + ': animated chess scene');
            const pixels = await page.evaluate(async (screenshot) => {
                const image = new Image();
                image.src = 'data:image/png;base64,' + screenshot;
                await image.decode();
                const target = document.createElement('canvas');
                target.width = 160; target.height = 120;
                const ctx = target.getContext('2d');
                ctx.drawImage(image, 0, 0, 160, 120);
                const data = ctx.getImageData(0, 0, 160, 120).data;
                let lit = 0;
                for (let i = 0; i < data.length; i += 4) if (data[i] + data[i + 1] + data[i + 2] > 90) lit++;
                return lit;
            }, second.toString('base64'));
            assert(pixels > 192, name + ': nonblank chess assets');
            await hidden.evaluate((element) => element.remove());
            for (const viewport of mobile ? [{ width: 390, height: 844 }, { width: 320, height: 640 }] : [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
                await page.setViewportSize(viewport);
                const layout = await page.evaluate(() => {
                    const rect = (selector) => document.querySelector(selector).getBoundingClientRect().toJSON();
                    return { overflow: document.documentElement.scrollWidth > innerWidth, heading: rect('h1'), action: rect('.start-game'), next: rect('#how-title') };
                });
                assert(!layout.overflow, name + ': no horizontal overflow');
                assert(layout.heading.bottom < layout.action.top);
                assert(layout.next.top < viewport.height, name + ': next section visible at ' + viewport.width);
                await page.screenshot({ path: '/private/tmp/chesson-bot-' + name + '-' + viewport.width + '.png', fullPage: true });
            }
            await page.locator('[name=timeMinutes]').selectOption('3');
            await page.locator('[name=incrementSeconds]').selectOption('2');
            await page.locator('[name=botDifficulty]').selectOption(lang === 'ru' ? 'hard' : 'easy');
            await page.locator('[name=color]').selectOption('black');
            await page.getByRole('button', { name: lang === 'ru' ? 'Играть с ботом' : 'Play against a bot', exact: true }).click();
            await page.waitForURL(origin + '/game/*');
            const roomId = new URL(page.url()).pathname.split('/').pop();
            const state = await roomState(roomId, (state) => state.gameStarted && state.moveHistory.length > 0);
            assert.equal(posts.length, 1, name + ': one automatic creation');
            assert.equal(posts[0].vsBot, true);
            assert.equal(posts[0].botDifficulty, lang === 'ru' ? 'hard' : 'easy');
            assert.equal(posts[0].color, 'black');
            assert.equal(posts[0].botMoveTimeMs, 800);
            assert.equal(posts[0].withAIhints, true);
            assert.equal(state.timer.initialWhiteTime, 180);
            assert.equal(state.timer.initialBlackTime, 180);
            assert.equal(state.timer.blackIncrement, 2);
            assert.equal(state.currentPlayer, 'black');
            await waitForBotGame(page, 'black');
            await page.screenshot({ path: '/private/tmp/chesson-bot-room-' + name + '.png', fullPage: true });
            await page.reload();
            await waitForBotGame(page, 'black');
            assert.equal(posts.length, 1, name + ': reload room must not create');
            await page.goto(origin + '/create-room?mode=bot&autoStart=1&timeMinutes=3&incrementSeconds=2&botDifficulty=' + posts[0].botDifficulty + '&color=black&requestId=' + posts[0].requestId);
            await page.waitForURL(origin + '/game/' + roomId);
            assert.equal(posts.length, 2);

            let failed = false;
            await page.route('**/api/rooms', (route) => {
                if (!failed && route.request().method() === 'POST') {
                    failed = true;
                    return route.fulfill({ status: 503, json: { success: false } });
                }
                return route.fallback();
            });
            await page.goto(origin + '/create-room?mode=bot&autoStart=1&timeMinutes=30&incrementSeconds=0');
            await page.getByRole('alert').waitFor();
            const retryId = new URL(page.url()).searchParams.get('requestId');
            await page.getByRole('button', { name: 'Повторить', exact: true }).click();
            await page.waitForURL(origin + '/game/*');
            await waitForBotGame(page, 'white');
            const whiteRoom = new URL(page.url()).pathname.split('/').pop();
            const whiteState = await roomState(whiteRoom, (state) => state.gameStarted);
            assert.equal(posts.at(-1).requestId, retryId);
            assert.equal(posts.at(-1).botDifficulty, 'medium');
            assert.equal(posts.at(-1).color, 'white');
            assert.equal(whiteState.moveHistory.length, 0, 'White player moves before bot');
            const count = posts.length;
            await page.goto(origin + '/create-room?mode=bot&autoStart=1&timeMinutes=30&incrementSeconds=0&botDifficulty=invalid');
            await page.getByRole('alert').waitFor();
            assert.equal(posts.length, count);
            assert.deepEqual(errors, [], name + ': browser errors');
            console.log(name + ': scene/layout, landing CTA, real bot first move, timers, old room, replay/reload, retry and invalid settings passed');
            await context.close();
        }
    }
} finally {
    await browser.close();
}
