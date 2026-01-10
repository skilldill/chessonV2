import { useEffect, useState, type FC } from "react";
import type { MoveData } from "react-chessboard-ui";
import { groupByTwoMoves } from "../../utils/groupByTwoMoves";
import { getReadableMoveNotation } from "../../utils/getReadableMoveNotation";
import { Resizable } from 're-resizable';
import { DraggableWrap } from "../DraggableWrap/DraggableWrap";
import styles from './HistoryMoves.module.css';
import cn from 'classnames';
import { useScreenSize } from "../../hooks/useScreenSize";

type HistoryMovesProps = {
    moves: MoveData[];
}

// Из дизайна
const DEFAULT_SIZE = {
    widthM: 288,
    heightM: 160,

    widthL: 348,
    heightL: 192,
};

export const HistoryMoves: FC<HistoryMovesProps> = ({ moves }) => {
    const [size, setSize] = useState({
        width: DEFAULT_SIZE.widthM,
        height: DEFAULT_SIZE.heightM,
    });
    const screenSize = useScreenSize();

    useEffect(() => {
        if (screenSize === 'L')
            setSize({
                width: DEFAULT_SIZE.widthL,
                height: DEFAULT_SIZE.heightL,
            })
    }, [screenSize])


    const groupedMoves = groupByTwoMoves(moves)
        .map((moveItem) => moveItem.map((move) => getReadableMoveNotation(move)));

    return (
        <DraggableWrap>
            <Resizable
                size={size}
                maxWidth={screenSize === 'L' ? DEFAULT_SIZE.widthL : DEFAULT_SIZE.widthM}
                minWidth={screenSize === 'L' ? DEFAULT_SIZE.widthL : DEFAULT_SIZE.widthM}
                minHeight={100}
                onResizeStop={(...args) => {
                    setSize((prev) => ({
                        ...prev,
                        height: prev.height + args[3].height
                    }));
                }}
            >
                <div className="relative w-full h-full p-[8px] bg-back-secondary rounded-xl overflow-hidden flex flex-col justify-end transition-transform duration-200 active:scale-95 select-none">
                    <div className="absolute top-0 left-0 right-0 h-[98px] bg-gradient-to-t from-zink-950 to-[#0a0a0a]" />
                    {groupedMoves.map((moveItem, index) => (
                        <div className={styles.movesRow}>
                            <div key={`${moveItem[0]}_${index}`} className="flex items-center gap-x-[8px] px-[4px] py-[6px] hover:bg-white/4 transition-all duration-200 cursor-pointer grid grid-cols-[40px_1fr_1fr]">
                                <span className="text-[16px] text-gray-400">{index + 1}.</span>
                                <span className="text-[16px] text-white">{moveItem[0]}</span>
                                {moveItem[1] && <span className={cn('text-[16px] text-white', styles.movesCell)}>{moveItem[1]}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </Resizable>
        </DraggableWrap>
    );
};