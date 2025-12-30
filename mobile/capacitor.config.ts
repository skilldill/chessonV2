import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'chessonMobile',
  webDir: 'dist',
  server: {
    allowNavigation: ['chesson.me', '*.chesson.me'],
  },
};

export default config;
