import type { FC, useMemo } from "react";
import type { MoveData } from "react-chessboard-ui";
import { groupByTwoMoves } from "../../utils/groupByTwoMoves";
import { getReadableMoveNotation } from "../../utils/getReadableMoveNotation";


type HistoryMovesProps = {
    moves: MoveData[];
}

export const HistoryMoves: FC<HistoryMovesProps> = ({ moves }) => {
    const groupedMoves = groupByTwoMoves(moves).map((moveItem) => moveItem.map((move) => getReadableMoveNotation(move)));
    console.log(groupedMoves);
    return <div>History Moves</div>;
};