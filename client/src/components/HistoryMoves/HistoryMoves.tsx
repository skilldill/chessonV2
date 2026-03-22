import { useCallback, useEffect, useState, type FC } from "react";
import { groupByTwoMoves } from "../../utils/groupByTwoMoves";
import { getReadableMoveNotation } from "../../utils/getReadableMoveNotation";
import { Resizable } from 're-resizable';
import { DraggableWrap } from "../DraggableWrap/DraggableWrap";
import styles from './HistoryMoves.module.css';
import cn from 'classnames';
import { useScreenSize } from "../../hooks/useScreenSize";
import type { MoveData } from "../../types";

type HistoryMovesProps = {
    moves: MoveData[];
    onSelectMove?: (data: { moveData: MoveData, isLastMove: boolean }) => void;
}

// Из дизайна
const DEFAULT_SIZE = {
    widthS: 200,
    heightS: 120,

    widthM: 288,
    heightM: 160,

    widthL: 348,
    heightL: 192,
};

export const HistoryMoves: FC<HistoryMovesProps> = ({ moves, onSelectMove }) => {
    const [size, setSize] = useState({
        width: DEFAULT_SIZE.widthM,
        height: DEFAULT_SIZE.heightM,
    });

    const [fontSize, setFontSize] = useState(16);
    const [selectedMoveIndex, setSelectedMoveIndex] = useState<number>();

    const screenSize = useScreenSize();

    useEffect(() => {
        console.log(screenSize);
        if (screenSize === 'L')
            setSize({
                width: DEFAULT_SIZE.widthL,
                height: DEFAULT_SIZE.heightL,
            });

        if (screenSize === 'S') {
            setSize({
                width: DEFAULT_SIZE.widthS,
                height: DEFAULT_SIZE.heightS,
            });

            setFontSize(14);
        }
    }, [screenSize])


    const groupedMoves = groupByTwoMoves(moves)
        .map((moveItem) => moveItem.map((move) => getReadableMoveNotation(move)));

    const handleSelectMove = useCallback((moveIndex: number) => {
        if (moveIndex < 0 || moveIndex >= moves.length) return;
        const selectedMove = moves[moveIndex];
        setSelectedMoveIndex(moveIndex);
        onSelectMove?.({
            moveData: selectedMove,
            isLastMove: moveIndex === (moves.length - 1),
        });
    }, [moves, onSelectMove]);

    useEffect(() => {
        const isEditableTarget = (target: EventTarget | null): boolean => {
            if (!(target instanceof HTMLElement)) return false;
            const tagName = target.tagName.toLowerCase();

            return tagName === 'input' || tagName === 'textarea' || target.isContentEditable;
        };

        const handleHistoryArrowNavigation = (event: KeyboardEvent) => {
            if (isEditableTarget(event.target)) return;
            if (moves.length === 0) return;

            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
                return;
            }

            const isPrevMove = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
            const isNextMove = event.key === 'ArrowRight' || event.key === 'ArrowDown';

            const currentIndex = selectedMoveIndex === undefined
                ? (moves.length - 1)
                : Math.min(Math.max(selectedMoveIndex, 0), moves.length - 1);
            let nextIndex = currentIndex;

            if (isPrevMove) {
                nextIndex = Math.max(0, currentIndex - 1);
            }

            if (isNextMove) {
                nextIndex = Math.min(moves.length - 1, currentIndex + 1);
            }

            if (nextIndex === currentIndex) return;

            event.preventDefault();
            handleSelectMove(nextIndex);
        };

        window.addEventListener('keydown', handleHistoryArrowNavigation);

        return () => {
            window.removeEventListener('keydown', handleHistoryArrowNavigation);
        };
    }, [handleSelectMove, moves.length, selectedMoveIndex]);

    return (
        <DraggableWrap>
            <Resizable
                size={size}
                maxWidth={size.width}
                minWidth={size.width}
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
                                <span className={`text-[${fontSize}px] text-gray-400`}>{index + 1}.</span>
                                <div onClick={() => handleSelectMove(index * 2)}>
                                    <span className={cn(`text-[${fontSize}px] text-white`, { 'px-[2px] py-[2px] bg-gray-600 rounded-[4px]': (index * 2) === selectedMoveIndex })}>
                                        {moveItem[0]}
                                    </span>
                                </div>
                                {moveItem[1] && (
                                    <div onClick={() => handleSelectMove((index * 2) + 1)}>
                                        <span className={cn(`text-[${fontSize}px] text-white`, styles.movesCell, { 
                                            'px-[2px] py-[2px] bg-gray-700 rounded-[4px]': ((index * 2) + 1) === selectedMoveIndex && ((index * 2) + 1) < (moves.length - 1)
                                        })}>
                                            {moveItem[1]}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Resizable>
        </DraggableWrap>
    );
};
