import { LETTERS, FIGURES_LATTERS_NOTATIONS,type MoveData, JSChessEngine } from 'react-chessboard-ui';

/**
 * Возвращает читабельное описание хода
 * @param move данные хода
 */
export const getReadableMoveNotation = (move: MoveData) => {
    const castlingType = JSChessEngine.getCastlingType(move);

    const figureLetter = FIGURES_LATTERS_NOTATIONS[move.figure.color][move.figure.type] === 'p' ? '' 
        : FIGURES_LATTERS_NOTATIONS[move.figure.color][move.figure.type];

    if (!castlingType) return `${figureLetter} ${LETTERS[move.to[0]]}${8 - move.to[1]}`;

    return castlingType;
};
