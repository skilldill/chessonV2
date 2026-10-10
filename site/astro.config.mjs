// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import sitemap from "@astrojs/sitemap";
import { FRIEND_GAME_SLUGS } from './src/data/friendGame';
import { BOT_GAME_RU_SLUGS, BOT_GAME_EN_SLUGS } from './src/data/botGame';

const landingAliases = [...FRIEND_GAME_SLUGS, ...BOT_GAME_RU_SLUGS, ...BOT_GAME_EN_SLUGS];

// https://astro.build/config
export default defineConfig({
  site: 'https://chesson.me',
  devToolbar: { enabled: false },
  vite: {
    plugins: [
      tailwindcss()
    ]
  },

  integrations: [react(), sitemap({
    filter: (page) => !landingAliases.some((slug) => new URL(page).pathname === `/${slug}/`),
  })],

  i18n: {
    locales: ["en", "ru"],
    defaultLocale: "en",
  }
});
