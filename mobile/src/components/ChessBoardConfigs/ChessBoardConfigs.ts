export type ChessboardThemeConfig = {
  whiteCellColor: string;
  blackCellColor: string;
  circleMarkColor: string;
};

export const CHESSBOARD_THEMES: Record<string, ChessboardThemeConfig> = {
  default: {
    whiteCellColor: '#E5E7EB',
    blackCellColor: '#A5AEBD',
    circleMarkColor: '#0069A8',
  },
  green: {
    whiteCellColor: '#E8F5E9',
    blackCellColor: '#81C784',
    circleMarkColor: '#2E7D32',
  },
  brown: {
    whiteCellColor: '#D7C4A5',
    blackCellColor: '#8B7355',
    circleMarkColor: '#5D4037',
  },
  blue: {
    whiteCellColor: '#E3F2FD',
    blackCellColor: '#64B5F6',
    circleMarkColor: '#1565C0',
  },
};

export const getChessboardThemeConfig = (theme: string): ChessboardThemeConfig => {
  return CHESSBOARD_THEMES[theme] || CHESSBOARD_THEMES.default;
};
