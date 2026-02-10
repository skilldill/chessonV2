import type { ChessboardConfig } from "../../types";
import './ChessBoardConfigs.css';

export const CHESSBOARD_THEMES: Record<string, ChessboardConfig> = {
    default: {
        lightSquareClassName: 'defaultLightSquare',
        darkSquareClassName: 'defaultDarkSquare',
        possibleMoveMarkClassName: 'defaultPossibleMoveMark',
    },
    green: {
        lightSquareClassName: 'greenLightSquare',
        darkSquareClassName: 'greenDarkSquare',
        possibleMoveMarkClassName: 'greenPossibleMoveMark',
    },
    brown: {
        lightSquareClassName: 'brownLightSquare',
        darkSquareClassName: 'brownDarkSquare',
        possibleMoveMarkClassName: 'brownPossibleMoveMark',
    },
    blue: {
        lightSquareClassName: 'blueLightSquare',
        darkSquareClassName: 'blueDarkSquare',
        possibleMoveMarkClassName: 'bluePossibleMoveMark',
    },
};

export const DEFAULT_CHESSBOARD_CONFIG: ChessboardConfig = CHESSBOARD_THEMES.default;

export const getChessboardConfig = (theme: string): ChessboardConfig => {
    return CHESSBOARD_THEMES[theme] || CHESSBOARD_THEMES.default;
};
