import { type FC, useMemo, useRef } from 'react';

export interface ChessboardWrapProps {
    reverse?: boolean;
    renderChessboard: (containerWidth: number) => React.ReactElement;
}

const BOARD_LETERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const ChessboardWrap: FC<ChessboardWrapProps> = (
    props
) => {
    const { renderChessboard, reverse = false } = props;
    const innerWrapRef = useRef<HTMLDivElement>(null);

    // Подготовка букв для отрисовки
    const preparedLetters = useMemo(
        () => (reverse ? [...BOARD_LETERS].reverse() : BOARD_LETERS),
        [reverse]
    );

    const lettersRow = useMemo(
        () => (
            <div className="grid grid-cols-[24px_repeat(8,1fr)_24px] text-color-primary select-none">
                <span></span>
                {preparedLetters.map((letter) => (
                    <span key={letter} className="text-sm font-semibold text-color-primary flex justify-center items-center">
                        {letter}
                    </span>
                ))}
                <span></span>
            </div>
        ),
        [preparedLetters]
    );

    const numbersRow = useMemo(
        () => (
            <div className="grid grid-rows-[repeat(8,1fr)] text-gray-300 select-none">
                {BOARD_LETERS.map((letter, i) => (
                    <span key={`${letter}_${i}`} className="text-sm font-semibold text-color-primary flex justify-center items-center">
                        {reverse ? i + 1 : BOARD_LETERS.length - i}
                    </span>
                ))}
            </div>
        ),
        [reverse]
    );

    return (
        <div className="bg-gray-400/20 grid grid-rows-[24px_1fr_24px] rounded-2xl">
            {lettersRow}
            <div className="grid grid-cols-[24px_1fr_24px]">
                {numbersRow}
                <div ref={innerWrapRef} className="overflow-hidden rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.40)]">
                    {innerWrapRef.current && renderChessboard(innerWrapRef.current.offsetWidth)}
                </div>
                {numbersRow}
            </div>
            {lettersRow}
        </div>
    );
};