export const SITE_URL = new URL(process.env.PUBLIC_SITE_URL || 'https://шахматы-онлайн.рф').origin;
export const GAME_URL = 'https://3d.chesson.me';

/** @param {string} mode */
export function createGameUrl(mode) {
  if (mode !== 'friend' && mode !== 'bot') throw new Error('Unknown game mode');
  const url = new URL('/create-room', GAME_URL);
  url.search = new URLSearchParams({
    mode,
    autoStart: '1',
    gameMode: 'standard',
    source: 'shakhmaty-landing',
    timeMinutes: mode === 'bot' ? '30' : '10',
    incrementSeconds: '0',
  }).toString();
  if (mode === 'bot') {
    url.searchParams.set('botDifficulty', 'medium');
    url.searchParams.set('color', 'white');
  }
  return url.href;
}
