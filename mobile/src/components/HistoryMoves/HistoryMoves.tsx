import { type FC } from "react";
import type { MoveData } from "react-chessboard-ui";
import { getReadableMoveNotation } from "../../utils/getReadableMoveNotation";
import "./HistoryMoves.css";

type HistoryMovesProps = {
    moves: MoveData[];
}

export const HistoryMoves: FC<HistoryMovesProps> = ({ moves }) => {
    return (
        <div className="h-[32px] overflow-x-auto overflow-y-hidden historyMovesContainer" style={{ width: `${window.innerWidth}px` }}>
            <div className="min-w-fit flex items-center gap-[12px] py-[6px] h-full">
                {moves.map((move, index) => 
                    <span className="min-w-[32px] text-sm font-medium text-white" key={index}>{getReadableMoveNotation(move)}</span>
                )}
            </div>
        </div>
    );
};