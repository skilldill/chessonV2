import assert from 'node:assert/strict';
import { chromium, devices } from '../../client/node_modules/playwright/index.mjs';

const apiOrigin = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:4000';
const api = apiOrigin + '/api';
const siteOrigin = process.env.TEST_SITE_ORIGIN || 'http://127.0.0.1:4321';
async function post(body) {
    const response = await fetch(api + '/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
}
const payload = { whiteTimer: 180, blackTimer: 180, increment: 2, vsBot: false, withAIhints: true, gameMode: 'standard', requestId: crypto.randomUUID() };
const first = await post(payload);
assert.equal(first.status, 200);
assert(first.body.success);
assert.deepEqual((await post(payload)).body, first.body);
assert.equal((await post({ ...payload, increment: 10 })).status, 409);
assert.equal((await post({ ...payload, requestId: 'bad' })).status, 400);
assert.notEqual((await post({ ...payload, requestId: undefined })).body.roomId, first.body.roomId);
console.log('HTTP: timers, retries, conflict and invalid ids passed');

const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    headless: true,
});
async function createContext(options) {
    const context = await browser.newContext(options);
    if (process.env.TEST_API_ORIGIN) {
        await context.route('**/api/**', async (route) => {
            const url = new URL(route.request().url());
            const response = await route.fetch({ url: apiOrigin + url.pathname + url.search });
            return route.fulfill({ response });
        });
        await context.addInitScript(({ apiOrigin }) => {
            const NativeWebSocket = window.WebSocket;
            window.WebSocket = class extends NativeWebSocket {
                constructor(url, protocols) {
                    const target = new URL(url);
                    if (target.port === '4000') target.host = new URL(apiOrigin).host;
                    super(target.href, protocols);
                }
            };
        }, { apiOrigin });
    }
    return context;
}
try {
    for (const app of [
        { name: 'desktop', origin: 'http://127.0.0.1:5173', viewport: { width: 1440, height: 900 } },
        { name: 'mobile', origin: 'http://127.0.0.1:5174', ...devices['iPhone 13'] },
    ]) {
        const { name, origin, ...options } = app;
        const context = await createContext({ ...options, locale: 'ru-RU' });
        await context.addInitScript(({ mobile }) => {
            window.__copied = [];
            window.__shares = [];
            Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text) => window.__copied.push(text) }, configurable: true });
            if (mobile) Object.defineProperty(navigator, 'share', { value: async (data) => window.__shares.push(data), configurable: true });
            localStorage.setItem('gameData', JSON.stringify({ gameId: 'previous-room', playerName: 'Previous', avatar: '0' }));
        }, { mobile: name === 'mobile' });
        await context.route('https://mc.yandex.ru/**', (route) => route.abort());
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        const posts = [];
        page.on('request', (request) => {
            if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/rooms') posts.push(request.postDataJSON());
        });
        const id = crypto.randomUUID();
        const entry = origin + '/create-room?mode=friend&autoStart=1&timeMinutes=3&incrementSeconds=2&withAIhints=true&requestId=' + id;
        await page.goto(entry);
        await page.waitForURL('**/game/*');
        const roomId = new URL(page.url()).pathname.split('/').pop();
        await page.getByRole('button', { name: 'Скопировать ссылку', exact: true }).waitFor();
        assert.equal(posts.length, 1, name + ' one request');
        assert.deepEqual(posts[0], { requestId: id, whiteTimer: 180, blackTimer: 180, increment: 2, vsBot: false, withAIhints: true, gameMode: 'standard' });
        const state = await fetch(api + '/rooms/' + roomId).then((response) => response.json());
        assert.equal(state.gameState.timer.initialWhiteTime, 180);
        assert.equal(state.gameState.timer.whiteIncrement, 2);
        assert.equal(state.gameState.withAIhints, true);
        assert.equal(state.gameState.gameStarted, false);
        await page.getByRole('button', { name: 'Скопировать ссылку', exact: true }).click();
        assert.deepEqual(await page.evaluate(() => window.__copied), [origin + '/game/' + roomId]);
        if (name === 'mobile') {
            await page.getByRole('button', { name: 'Отправить приглашение', exact: true }).click();
            assert.equal((await page.evaluate(() => window.__shares))[0].url, origin + '/game/' + roomId);
            for (const viewport of [{ width: 320, height: 568 }, { width: 667, height: 375 }]) {
                await page.setViewportSize(viewport);
                await page.reload();
                await page.getByRole('button', { name: 'Скопировать ссылку', exact: true }).waitFor();
                const layout = await page.evaluate(() => ({
                    overflow: document.documentElement.scrollWidth > innerWidth,
                    first: document.querySelector('h1').getBoundingClientRect().top,
                    buttons: [...document.querySelectorAll('button')].map((button) => {
                        const rect = button.getBoundingClientRect();
                        return { left: rect.left, right: rect.right, top: rect.top, height: rect.height };
                    }),
                }));
                assert(!layout.overflow);
                assert(layout.first >= 0);
                for (const button of layout.buttons) assert(button.left >= 0 && button.right <= viewport.width && button.top >= 0 && button.height >= 44);
                await page.screenshot({ path: `/tmp/chesson-auto-room-mobile-${viewport.width}.png`, fullPage: true });
            }
            await page.setViewportSize(options.viewport);
            await page.reload();
            await page.getByRole('button', { name: 'Скопировать ссылку', exact: true }).waitFor();
        }
        await page.screenshot({ path: '/tmp/chesson-auto-room-' + name + '.png', fullPage: true });
        await page.reload();
        await page.getByRole('button', { name: 'Скопировать ссылку', exact: true }).waitFor();
        assert.equal(posts.length, 1, name + ' reload invitation must not create');
        await page.goto(entry);
        await page.waitForURL('**/game/' + roomId);
        await page.getByRole('button', { name: 'Скопировать ссылку', exact: true }).waitFor();
        assert.equal(posts.length, 2);

        let failed = false;
        await page.route('**/api/rooms', async (route) => {
            if (route.request().method() === 'POST' && !failed) {
                failed = true;
                return route.fulfill({ status: 503, json: { success: false } });
            }
            return route.fallback();
        });
        await page.goto(origin + '/create-room?mode=friend&autoStart=1&timeMinutes=10&incrementSeconds=0');
        await page.getByRole('alert').waitFor();
        const retryId = new URL(page.url()).searchParams.get('requestId');
        assert(retryId);
        await page.screenshot({ path: '/private/tmp/chesson-auto-room-error-' + name + '.png' });
        await page.getByRole('button', { name: 'Повторить', exact: true }).click();
        await page.waitForURL('**/game/*');
        await page.getByRole('button', { name: 'Скопировать ссылку', exact: true }).waitFor();
        assert.equal(posts.at(-1).requestId, retryId);
        assert.equal(posts.at(-1).withAIhints, false);
        const count = posts.length;
        await page.goto(origin + '/create-room?mode=friend&autoStart=1&timeMinutes=-1&incrementSeconds=0');
        await page.getByRole('alert').waitFor();
        assert.equal(posts.length, count, name + ' invalid settings must not post');
        await page.getByRole('link', { name: 'Выбрать настройки партии' }).click();
        await page.getByRole('button', { name: /Играть с другом|Создать комнату/ }).first().waitFor();
        assert.equal(posts.length, count, name + ' normal catalogue must not post');
        await context.route('https://*.chesson.me/create-room?**', (route) => {
            const target = new URL(route.request().url());
            assert.equal(target.hostname, name === 'desktop' ? 'game.chesson.me' : 'mobile.chesson.me');
            return route.fulfill({ status: 302, headers: { location: origin + target.pathname + target.search } });
        });
        await page.goto(siteOrigin + '/shahmaty_online_s_drugom_po_ssylke/');
        await page.getByRole('button', { name: '15 мин каждому игроку, 10 сек за ход', exact: true }).click();
        await page.getByRole('button', { name: 'Играть с другом', exact: true }).click();
        await page.waitForURL(origin + '/game/*');
        await page.getByRole('button', { name: 'Скопировать ссылку', exact: true }).waitFor();
        const sharedRoom = new URL(page.url()).pathname.split('/').pop();
        assert.equal(posts.length, count + 1);
        assert.equal(posts.at(-1).whiteTimer, 900);
        assert.equal(posts.at(-1).increment, 10);
        assert.equal(posts.at(-1).requestId.length, 36);
        assert.equal(posts.at(-1).withAIhints, false);
        const friendContext = await createContext({ locale: 'ru-RU' });
        const friendPage = await friendContext.newPage();
        let friendPosts = 0;
        friendPage.on('request', (request) => { if (request.method() === 'POST' && request.url().endsWith('/api/rooms')) friendPosts++; });
        await friendPage.goto((name === 'desktop' ? 'http://127.0.0.1:5174' : 'http://127.0.0.1:5173') + '/game/' + sharedRoom);
        await page.getByRole('button', { name: 'Скопировать ссылку', exact: true }).waitFor({ state: 'hidden' });
        const joined = await fetch(api + '/rooms/' + sharedRoom).then((response) => response.json());
        assert.equal(joined.gameState.gameStarted, true);
        assert.equal(friendPosts, 0);
        await friendContext.close();
        await page.route('**/api/auth/me', (route) => route.fulfill({ json: { success: true, user: { name: 'Signed Player', avatar: '1' } } }));
        await page.goto(origin + '/create-room?mode=friend&autoStart=1&timeMinutes=5&incrementSeconds=0');
        await page.waitForURL('**/game/*');
        await page.getByRole('button', { name: 'Скопировать ссылку', exact: true }).waitFor();
        await page.waitForFunction(() => {
            const saved = localStorage.getItem('gameData');
            return saved && JSON.parse(saved).playerName === 'Signed Player';
        });
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('gameData')).playerName), 'Signed Player');
        const reloadRequestId = crypto.randomUUID();
        let lostRoom;
        let loseNext = true;
        await page.route('**/api/rooms', async (route) => {
            if (route.request().method() === 'POST' && loseNext) {
                loseNext = false;
                const response = await route.fetch({ url: api + '/rooms' });
                lostRoom = (await response.json()).roomId;
                return route.abort('failed');
            }
            return route.fallback();
        });
        await page.goto(origin + '/create-room?mode=friend&autoStart=1&timeMinutes=5&incrementSeconds=0&requestId=' + reloadRequestId);
        await page.getByRole('alert').waitFor();
        assert(lostRoom);
        await page.reload();
        await page.waitForURL('**/game/' + lostRoom);
        await page.getByRole('button', { name: 'Скопировать ссылку', exact: true }).waitFor();
        await page.route('**/src/main.tsx', async (route) => {
            const response = await route.fetch();
            const source = await response.text();
            assert(source.includes('.render('));
            const version = source.match(/\?v=[a-zA-Z0-9]+/)?.[0] || '';
            const body = `import TestReact from "/node_modules/.vite/deps/react.js${version}";\nconst { StrictMode: TestStrictMode, createElement: testCreateElement } = TestReact;\n`
                + source.replace(/\.render\([\s\S]*?\);/, '.render(testCreateElement(TestStrictMode, null, testCreateElement(App)));');
            return route.fulfill({ response, body });
        });
        const beforeStrict = posts.length;
        await page.goto(origin + '/create-room?mode=friend&autoStart=1&timeMinutes=10&incrementSeconds=0');
        await page.waitForURL('**/game/*');
        await page.getByRole('button', { name: 'Скопировать ссылку', exact: true }).waitFor();
        assert.equal(posts.length, beforeStrict + 1, name + ' StrictMode must create once');
        assert.deepEqual(errors, [], name + ' browser errors');
        console.log(name + ': guest, profile, landing CTA, cross-device invite, old game, timers, copy, lost response/reload, retry and invalid settings passed');
        await context.close();
    }
} finally {
    await browser.close();
}
