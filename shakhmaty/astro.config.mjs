// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/config.mjs';

// https://astro.build/config
export default defineConfig({
    site: SITE_URL,
    trailingSlash: 'always',
    integrations: [sitemap()],
    devToolbar: { enabled: false },
    vite: {
        plugins: [
            tailwindcss()
        ]
    },
});
