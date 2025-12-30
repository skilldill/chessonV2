/// <reference types="vitest/config" />
/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

  // More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig(async () => {
  const config: any = {
    plugins: [
      react(),
      legacy(),
      tailwindcss(),
      // Fix for Storybook MDX file:// imports
      {
        name: 'fix-storybook-mdx-imports',
        resolveId(source: string) {
          // Handle file:// protocol imports from MDX files
          if (source.startsWith('file://./node_modules/')) {
            return source.replace('file://./node_modules/', '');
          }
          if (source.startsWith('file://')) {
            // Convert file:// URLs to regular paths
            const url = new URL(source);
            return url.pathname;
          }
        },
        transform(code: string, id: string) {
          if (code.includes('file://')) {
            // Replace file:// protocol imports with regular module imports
            return code.replace(
              /from\s+["']file:\/\/\.\/node_modules\/([^"']+)["']/g,
              (match, modulePath) => {
                return `from "${modulePath}"`;
              }
            );
          }
        },
      },
    ],
    resolve: {
      alias: {
        // Fix for Storybook MDX imports
        '@storybook/addon-docs/dist/mdx-react-shim.js': path.resolve(
          dirname,
          'node_modules/@storybook/addon-docs/dist/mdx-react-shim.js'
        ),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: 'ws://localhost:4000',
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };

  // Only add Vitest config if modules can be imported (skip when Storybook loads config)
  try {
    const { storybookTest } = await import('@storybook/addon-vitest/vitest-plugin');
    const { playwright } = await import('@vitest/browser-playwright');
    
    config.test = {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      projects: [{
        extends: true,
        plugins: [
        // The plugin will run tests for the stories defined in your Storybook config
        // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
        storybookTest({
          configDir: path.join(dirname, '.storybook')
        })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{
              browser: 'chromium'
            }]
          },
          setupFiles: ['.storybook/vitest.setup.ts']
        }
      }]
    };
  } catch (error) {
    // Silently skip Vitest config when modules aren't available (e.g., when Storybook loads config)
  }

  return config;
});