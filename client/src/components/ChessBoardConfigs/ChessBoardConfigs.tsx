import type { ChessboardConfig } from "../../types";
import './ChessBoardConfigs.css';

import KingWhitePNG from '../../assets/pieces/magicPieces/king-white.png';
import KingBlackPNG from '../../assets/pieces/magicPieces/king-black.png';
import QueenWhitePNG from '../../assets/pieces/magicPieces/queen-white.png';
import QueenBlackPNG from '../../assets/pieces/magicPieces/queen-black.png';
import RookWhitePNG from '../../assets/pieces/magicPieces/rook-white.png';
import RookBlackPNG from '../../assets/pieces/magicPieces/rook-black.png';
import BishopWhitePNG from '../../assets/pieces/magicPieces/bishop-white.png';
import BishopBlackPNG from '../../assets/pieces/magicPieces/bishop-black.png';
import KnightWhitePNG from '../../assets/pieces/magicPieces/knight-white.png';
import KnightBlackPNG from '../../assets/pieces/magicPieces/knight-black.png';
import PawnWhitePNG from '../../assets/pieces/magicPieces/pawn-white.png';
import PawnBlackPNG from '../../assets/pieces/magicPieces/pawn-black.png';

export const CHESSBOARD_THEMES: Record<string, ChessboardConfig> = {
    default: {
        lightSquareClassName: 'defaultLightSquare',
        darkSquareClassName: 'defaultDarkSquare',
        possibleMoveMarkClassName: 'defaultPossibleMoveMark',
    },
    // green: {
    //     lightSquareClassName: 'greenLightSquare',
    //     darkSquareClassName: 'greenDarkSquare',
    //     possibleMoveMarkClassName: 'greenPossibleMoveMark',
    // },
    // brown: {
    //     lightSquareClassName: 'brownLightSquare',
    //     darkSquareClassName: 'brownDarkSquare',
    //     possibleMoveMarkClassName: 'brownPossibleMoveMark',
    // },
    // blue: {
    //     lightSquareClassName: 'blueLightSquare',
    //     darkSquareClassName: 'blueDarkSquare',
    //     possibleMoveMarkClassName: 'bluePossibleMoveMark',
    // },
    magic: {
        pieceSizePercent: 95,
        lightSquareClassName: "magicLightSquare",
        darkSquareClassName: "magicDarkSquare",
        hidePieceEffectClassName: 'hideFigureEffectWithBurn',
        onHidePieces: (piece) => {
            setTimeout(() => {
                piece.position = [8, piece.position![1]]
            }, 1000)
        },
        piecesMap: {
            "pawn-white": (size) => <img width={size} src={PawnWhitePNG} />,
            "pawn-black": (size) => <img width={size} src={PawnBlackPNG} />,
            "knight-white": (size) => <img width={size} src={KnightWhitePNG} />,
            "knight-black": (size) => <img width={size} src={KnightBlackPNG} />,
            "bishop-white": (size) => <img width={size} src={BishopWhitePNG} />,
            "bishop-black": (size) => <img width={size} src={BishopBlackPNG} />,
            "rook-white": (size) => <img width={size} src={RookWhitePNG} />,
            "rook-black": (size) => <img width={size} src={RookBlackPNG} />,
            "queen-white": (size) => <img width={size} src={QueenWhitePNG} />,
            "queen-black": (size) => <img width={size} src={QueenBlackPNG} />,
            "king-white": (size) => <img width={size} src={KingWhitePNG} />,
            "king-black": (size) => <img width={size} src={KingBlackPNG} />
        },
    }
};

export const DEFAULT_CHESSBOARD_CONFIG: ChessboardConfig = CHESSBOARD_THEMES.default;

export const getChessboardConfig = (theme: string): ChessboardConfig => {
    return CHESSBOARD_THEMES[theme] || CHESSBOARD_THEMES.default;
};
