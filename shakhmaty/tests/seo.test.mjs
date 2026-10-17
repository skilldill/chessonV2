import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { parse } from 'parse5';
import { createGameUrl, GAME_URL, SITE_URL } from '../src/config.mjs';
import { landingPages } from '../src/data/landingPages.mjs';

const dist = new URL('../dist/', import.meta.url);
const specs = [
  { slug: '', heading: 'онлайн', description: 'Просто шахматы онлайн без регистрации бесплатно' },
  ...landingPages,
];
const attr = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
const textContent = (node) => node.value ?? (node.childNodes ?? []).map(textContent).join('');
function elements(node, tag) {
  return [ ...(node.tagName === tag ? [node] : []), ...(node.childNodes ?? []).flatMap((child) => elements(child, tag)) ];
}
const docs = await Promise.all(specs.map(async (page) => ({
  ...page,
  path: page.slug ? `/${page.slug}/` : '/',
  html: parse(await readFile(new URL(`${page.slug ? `${page.slug}/` : ''}index.html`, dist), 'utf8')),
})));

test('Landing canonical and room creation use separate production hosts', () => {
  assert.equal(new URL(GAME_URL).origin, 'https://3d.chesson.me');
  assert.notEqual(new URL(SITE_URL).origin, new URL(GAME_URL).origin);
});

for (const { html, path, heading, description, title } of docs) {
  test(`Yandex.Metrika counter and no-JavaScript fallback: ${path}`, async () => {
    const trackers = elements(html, 'script').filter((node) => textContent(node).includes('https://mc.yandex.ru/metrika/tag.js?id=113658367'));
    assert.equal(trackers.length, 1);
    assert.notEqual(attr(trackers[0], 'type'), 'module');
    assert.match(textContent(trackers[0]), /ym\(113658367,\s*'init'/);
    const source = await readFile(new URL(`${path.slice(1)}index.html`, dist), 'utf8');
    const noScriptHtml = parse(source, { scriptingEnabled: false });
    const fallback = elements(noScriptHtml, 'noscript');
    assert.equal(fallback.length, 1);
    const pixel = elements(fallback[0], 'img');
    assert.equal(pixel.length, 1);
    assert.equal(attr(pixel[0], 'src'), 'https://mc.yandex.ru/watch/113658367');
    assert.equal(attr(pixel[0], 'alt'), '');
    assert.ok(!source.includes('105020689'));
  });
  test(`Minimal content, metadata and game links: ${path}`, async () => {
    assert.equal(elements(html, 'main').length, 1);
    assert.equal(elements(html, 'section').length, 1);
    assert.equal(elements(html, 'h1').length, 1);
    assert.equal(textContent(elements(html, 'h1')[0]).replace(/\s+/g, ' ').trim(), `Шахматы ${heading}`);
    assert.equal(elements(html, 'p').length, 1);
    assert.equal(textContent(elements(html, 'p')[0]).trim(), description);
    for (const tag of ['h2', 'details', 'nav', 'footer']) assert.equal(elements(html, tag).length, 0);

    const metas = elements(html, 'meta');
    const meta = (name) => attr(metas.find((node) => attr(node, 'name') === name || attr(node, 'property') === name), 'content');
    assert.equal(attr(elements(html, 'html')[0], 'lang'), 'ru');
    const canonical = elements(html, 'link').filter((node) => attr(node, 'rel') === 'canonical');
    assert.equal(canonical.length, 1);
    assert.equal(attr(canonical[0], 'href'), `${SITE_URL}${path}`);
    assert.equal(meta('og:url'), `${SITE_URL}${path}`);
    assert.equal(meta('og:locale'), 'ru_RU');
    const pageTitle = textContent(elements(html, 'title')[0]);
    if (title) assert.equal(pageTitle, title);
    assert.equal(meta('og:title'), pageTitle);
    assert.equal(meta('og:description'), meta('description'));
    if (path !== '/') assert.equal(meta('description'), description);
    assert.ok(meta('description').length > 80);
    assert.match(meta('robots'), /^index,follow/);
    assert.equal(meta('twitter:card'), 'summary_large_image');
    assert.equal(meta('twitter:title'), pageTitle);
    assert.equal(meta('twitter:description'), meta('description'));
    assert.equal(meta('twitter:image'), meta('og:image'));
    assert.equal(meta('og:image'), `${SITE_URL}/social-preview.jpg`);
    assert.ok(meta('og:image:alt'));
    assert.ok(meta('twitter:image:alt'));
    assert.ok((await stat(new URL('social-preview.jpg', dist))).size > 1000);

    const jsonLd = elements(html, 'script').filter((node) => attr(node, 'type') === 'application/ld+json');
    assert.equal(jsonLd.length, 1);
    const schema = JSON.parse(textContent(jsonLd[0]));
    assert.equal(schema['@context'], 'https://schema.org');
    const graph = schema['@graph'];
    assert.deepEqual(graph.map((item) => item['@type']).sort(), ['WebPage', 'WebSite']);
    assert.equal(graph.find((item) => item['@type'] === 'WebPage').url, `${SITE_URL}${path}`);
    assert.equal(graph.find((item) => item['@type'] === 'WebSite').url, `${SITE_URL}/`);

    const links = elements(html, 'a').filter((node) => attr(node, 'data-game-link') !== undefined);
    assert.equal(links.length, 2);
    const expectedOrder = path === '/shahmaty_online_s_botom/' ? ['bot', 'friend'] : ['friend', 'bot'];
    assert.deepEqual(links.map((link) => new URL(attr(link, 'href')).searchParams.get('mode')), expectedOrder);
    const primaryClasses = attr(links[0], 'class').split(/\s+/);
    const secondaryClasses = attr(links[1], 'class').split(/\s+/);
    assert.ok(primaryClasses.includes('bg-white'));
    assert.ok(primaryClasses.includes('text-black'));
    assert.ok(secondaryClasses.includes('bg-transparent'));
    assert.ok(!secondaryClasses.includes('bg-white'));
    for (const link of links) {
      assert.equal(attr(link, 'rel'), 'nofollow');
      const url = new URL(attr(link, 'href'));
      assert.equal(url.origin, new URL(GAME_URL).origin);
      assert.equal(url.pathname, '/create-room');
      assert.equal(url.searchParams.get('autoStart'), '1');
      assert.equal(url.searchParams.get('gameMode'), 'standard');
      assert.equal(url.searchParams.get('incrementSeconds'), '0');
      if (url.searchParams.get('mode') === 'bot') {
        assert.equal(url.searchParams.get('botDifficulty'), 'medium');
        assert.equal(url.searchParams.get('color'), 'white');
        assert.equal(url.searchParams.get('timeMinutes'), '30');
      } else assert.equal(url.searchParams.get('timeMinutes'), '10');
    }
  });
}

test('All five requested friend URLs have dedicated Russian content and prioritize friend mode', () => {
  const requiredSlugs = [
    'shahmaty_online_s_drugom_po_ssylke',
    'shahmaty_online_s_drugom',
    'onlayn_shahmaty_po_ssylke_s_drugom',
    'shahmaty_s_drugom_onlayn',
    'shahmaty_s_drugom',
  ];
  for (const slug of requiredSlugs) {
    const page = docs.find((item) => item.slug === slug);
    assert.ok(page, `Missing requested URL: /${slug}/`);
    assert.match(page.heading, /с другом/);
    assert.match(page.title, /[Шш]ахматы/);
    assert.match(page.title, /с другом/);
    assert.match(page.description, /ссылк/);
    const links = elements(page.html, 'a').filter((node) => attr(node, 'data-game-link') !== undefined);
    assert.equal(textContent(links[0]).trim(), 'Играть с другом');
    assert.equal(new URL(attr(links[0], 'href')).searchParams.get('mode'), 'friend');
  }
});

test('Only configured pages are built with distinct headings and metadata', async () => {
  const files = await readdir(dist, { recursive: true });
  assert.deepEqual(files.filter((file) => file.endsWith('.html')).sort(), docs.map(({ slug }) => `${slug ? `${slug}/` : ''}index.html`).sort());
  for (const selector of ['h1', 'title']) assert.equal(new Set(docs.map(({ html }) => textContent(elements(html, selector)[0]))).size, docs.length);
  assert.equal(new Set(docs.map(({ html }) => attr(elements(html, 'meta').find((node) => attr(node, 'name') === 'description'), 'content'))).size, docs.length);
});

test('Metrika initializes the requested settings asynchronously with the page URL and referrer', () => {
  const script = elements(docs[0].html, 'script').find((node) => textContent(node).includes('https://mc.yandex.ru/metrika/tag.js?id=113658367'));
  const inserted = [];
  const context = {
    document: {
      scripts: [],
      referrer: 'https://example.com/referrer',
      createElement: () => ({}),
      getElementsByTagName: () => [{ parentNode: { insertBefore: (element) => inserted.push(element) } }],
    },
    location: { href: `${SITE_URL}/shahmaty_online_s_botom/?test=1` },
  };
  context.window = context;
  runInNewContext(textContent(script), context);
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].src, 'https://mc.yandex.ru/metrika/tag.js?id=113658367');
  assert.ok(inserted[0].async);
  assert.equal(context.ym.a.length, 1);
  const [counter, action, options] = context.ym.a[0];
  assert.equal(counter, 113658367);
  assert.equal(action, 'init');
  assert.deepEqual(JSON.parse(JSON.stringify(options)), {
    ssr: true, webvisor: true, clickmap: true, ecommerce: 'dataLayer',
    referrer: context.document.referrer, url: context.location.href,
    accurateTrackBounce: true, trackLinks: true,
  });
});

test('Sitemap contains every canonical URL and robots uses the canonical domain', async () => {
  const sitemap = await readFile(new URL('sitemap-0.xml', dist), 'utf8');
  assert.equal((sitemap.match(/<url>/g) ?? []).length, docs.length);
  for (const { path } of docs) assert.ok(sitemap.includes(`<loc>${SITE_URL}${path}</loc>`));
  assert.ok((await readFile(new URL('sitemap-index.xml', dist), 'utf8')).includes(`${SITE_URL}/sitemap-0.xml`));
  assert.equal(await readFile(new URL('robots.txt', dist), 'utf8'), `User-agent: *\nAllow: /\nDisallow: /create-room\nDisallow: /game/\nDisallow: /api/\nDisallow: /ws/\n\nSitemap: ${SITE_URL}/sitemap-index.xml\n`);
});

test('Launch script generates a fresh request ID without replacing the game domain', async () => {
  const paths = await readdir(new URL('_astro/', dist));
  const scripts = await Promise.all(paths.filter((path) => path.endsWith('.js')).map((path) => readFile(new URL(`_astro/${path}`, dist), 'utf8')));
  scripts.push(...elements(docs[0].html, 'script').filter((node) => attr(node, 'type') === 'module' && !attr(node, 'src')).map(textContent));
  const script = scripts.find((source) => source.includes('data-game-link'));
  assert.ok(script, 'Missing game link enhancement');
  const listeners = {};
  const link = { href: createGameUrl('friend'), addEventListener: (event, handler) => { listeners[event] = handler; } };
  let nextId = 0;
  const context = { URL, document: { querySelectorAll: () => [link] }, crypto: { randomUUID: () => `00000000-0000-4000-8000-${String(++nextId).padStart(12, '0')}` } };
  const goals = [];
  context.window = { ym: (...args) => goals.push(args) };
  context.location = { pathname: '/shahmaty_s_drugom/' };
  runInNewContext(script, context);
  listeners.click();
  const first = new URL(link.href);
  listeners.click();
  const second = new URL(link.href);
  assert.notEqual(first.searchParams.get('requestId'), second.searchParams.get('requestId'));
  assert.equal(second.origin, new URL(GAME_URL).origin);
  assert.equal(second.searchParams.getAll('requestId').length, 1);
  assert.equal(second.searchParams.get('mode'), 'friend');
  assert.equal(goals.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(goals[0])), [113658367, 'reachGoal', 'play_click', {
    app: 'shakhmaty', placement: 'landing', mode: 'friend', landing_path: '/shahmaty_s_drugom/',
  }]);
  delete context.crypto.randomUUID;
  assert.doesNotThrow(() => listeners.click());
  assert.equal(goals.length, 3);
  context.window.ym = () => { throw new Error('Blocked'); };
  assert.doesNotThrow(() => listeners.click());
  assert.equal(new URL(link.href).origin, new URL(GAME_URL).origin);
});
