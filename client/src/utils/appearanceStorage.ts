export const CHESSBOARD_THEME_STORAGE_KEY = 'chesson_chessboard_theme';

export const getChessboardThemeFromStorage = (): string => {
  if (typeof window === 'undefined') return 'default';
  return localStorage.getItem(CHESSBOARD_THEME_STORAGE_KEY) || 'default';
};

export const setChessboardThemeToStorage = (theme: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHESSBOARD_THEME_STORAGE_KEY, theme);
};
