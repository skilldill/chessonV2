import type { ChessboardConfig } from "../../types";
import './ChessBoardConfigs.css';

import MagicKingWhitePNG from '../../assets/pieces/magicPieces/king-white.png';
import MagicKingBlackPNG from '../../assets/pieces/magicPieces/king-black.png';
import MagicQueenWhitePNG from '../../assets/pieces/magicPieces/queen-white.png';
import MagicQueenBlackPNG from '../../assets/pieces/magicPieces/queen-black.png';
import MagicRookWhitePNG from '../../assets/pieces/magicPieces/rook-white.png';
import MagicRookBlackPNG from '../../assets/pieces/magicPieces/rook-black.png';
import MagicBishopWhitePNG from '../../assets/pieces/magicPieces/bishop-white.png';
import MagicBishopBlackPNG from '../../assets/pieces/magicPieces/bishop-black.png';
import MagicKnightWhitePNG from '../../assets/pieces/magicPieces/knight-white.png';
import MagicKnightBlackPNG from '../../assets/pieces/magicPieces/knight-black.png';
import MagicPawnWhitePNG from '../../assets/pieces/magicPieces/pawn-white.png';
import MagicPawnBlackPNG from '../../assets/pieces/magicPieces/pawn-black.png';

import DagestanKingWhitePNG from '../../assets/pieces/dagestanPieces/king-white.png';
import DagestanKingBlackPNG from '../../assets/pieces/dagestanPieces/king-black.png';
import DagestanQueenWhitePNG from '../../assets/pieces/dagestanPieces/queen-white.png';
import DagestanQueenBlackPNG from '../../assets/pieces/dagestanPieces/queen-black.png';
import DagestanRookWhitePNG from '../../assets/pieces/dagestanPieces/rook-white.png';
import DagestanRookBlackPNG from '../../assets/pieces/dagestanPieces/rook-black.png';
import DagestanBishopWhitePNG from '../../assets/pieces/dagestanPieces/bishop-white.png';
import DagestanBishopBlackPNG from '../../assets/pieces/dagestanPieces/bishop-black.png';
import DagestanKnightWhitePNG from '../../assets/pieces/dagestanPieces/knight-white.png';
import DagestanKnightBlackPNG from '../../assets/pieces/dagestanPieces/knight-black.png';
import DagestanPawnWhitePNG from '../../assets/pieces/dagestanPieces/pawn-white.png';
import DagestanPawnBlackPNG from '../../assets/pieces/dagestanPieces/pawn-black.png';

export const CHESSBOARD_THEMES: Record<string, ChessboardConfig> = {
    default: {
        lightSquareClassName: 'defaultLightSquare',
        darkSquareClassName: 'defaultDarkSquare',
        possibleMoveMarkClassName: 'defaultPossibleMoveMark',
    },
    
    dagestan: {
        // pieceSizePercent: 95,
        lightSquareClassName: 'dagestanLightSquare',
        darkSquareClassName: 'dagestanDarkSquare',
        piecesMap: {
            "pawn-white": () => <img width="60%" src={DagestanPawnWhitePNG} />,
            "pawn-black": () => <img width="60%" src={DagestanPawnBlackPNG} />,
            "knight-white": () => <img width="70%" src={DagestanKnightWhitePNG} />,
            "knight-black": () => <img width="70%" src={DagestanKnightBlackPNG} />,
            "bishop-white": () => <img width="60%" src={DagestanBishopWhitePNG} />,
            "bishop-black": () => <img width="60%" src={DagestanBishopBlackPNG} />,
            "rook-white": () => <img width="65%" src={DagestanRookWhitePNG} />,
            "rook-black": () => <img width="65%" src={DagestanRookBlackPNG} />,
            "queen-white": () => <img width="60%" src={DagestanQueenWhitePNG} />,
            "queen-black": () => <img width="60%" src={DagestanQueenBlackPNG} />,
            "king-white": () => <img width="80%" src={DagestanKingWhitePNG} />,
            "king-black": () => <img width="80%" src={DagestanKingBlackPNG} />
        },
    },

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
            "pawn-white": (size) => <img width={size} src={MagicPawnWhitePNG} />,
            "pawn-black": (size) => <img width={size} src={MagicPawnBlackPNG} />,
            "knight-white": (size) => <img width={size} src={MagicKnightWhitePNG} />,
            "knight-black": (size) => <img width={size} src={MagicKnightBlackPNG} />,
            "bishop-white": (size) => <img width={size} src={MagicBishopWhitePNG} />,
            "bishop-black": (size) => <img width={size} src={MagicBishopBlackPNG} />,
            "rook-white": (size) => <img width={size} src={MagicRookWhitePNG} />,
            "rook-black": (size) => <img width={size} src={MagicRookBlackPNG} />,
            "queen-white": (size) => <img width={size} src={MagicQueenWhitePNG} />,
            "queen-black": (size) => <img width={size} src={MagicQueenBlackPNG} />,
            "king-white": (size) => <img width={size} src={MagicKingWhitePNG} />,
            "king-black": (size) => <img width={size} src={MagicKingBlackPNG} />
        },
    },
};

export const DEFAULT_CHESSBOARD_CONFIG: ChessboardConfig = CHESSBOARD_THEMES.default;

export const getChessboardConfig = (theme: string): ChessboardConfig => {
    return CHESSBOARD_THEMES[theme] || CHESSBOARD_THEMES.default;
};
