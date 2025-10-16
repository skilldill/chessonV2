import type { MoveData } from "react-chessboard-ui";

/**
 * Группирует ходы в пары
 * чтобы корректно отобразить историю ходов
 */
export const groupByTwoMoves = (moves: MoveData[]) => {
    const groupedMoves: MoveData[][] = [];

    moves.forEach((move, i) => {
        if (i % 2 === 0) {
            groupedMoves.push([move]);
        } else {
            groupedMoves[groupedMoves.length - 1].push(move);
        }
    });
    console.log(groupedMoves);
    return groupedMoves;
};