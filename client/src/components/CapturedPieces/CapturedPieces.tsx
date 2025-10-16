import { useMemo, type FC } from 'react';
import { DEFAULT_PIECES_MAP, type Figure, type FigureColor } from 'react-chessboard-ui';
import { getCapturedPieces } from '../../utils/getCapturedPieces';
import { getMaterialPercents } from '../../utils/getMaterialPercents';

type CapturedPiecesProps = {
    FEN: string;
    color: FigureColor;
    figure?: Figure;
}

export const CapturedPieces: FC<CapturedPiecesProps> = ({ FEN, color, figure }) => {

    const capturedPieces = useMemo(() => getCapturedPieces(FEN, color), [FEN]);
    const materialPercents = useMemo(() => getMaterialPercents(FEN), [FEN]);

    return (
        <div className="relative">
            <div className="relative w-[144px] h-[80px] bg-back-secondary flex rounded-lg overflow-hidden transition-all duration-200 active:scale-95 cursor-pointer">
                <div className="h-full bg-indigo-400/20" style={{ width: `${materialPercents.white.percentOfStart}%` }} />
                <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center">
                    {figure && DEFAULT_PIECES_MAP[`${figure.type}-${figure.color}`](40)}
                </div>
            </div>
            <div className="bg-back-secondary rounded-lg p-[20px] absolute right-0 top-[88px] grid grid-cols-[28px_28px_28px_28px_28px_28px] grid-rows-[28px_28px_28px] gap-2">
                {capturedPieces.map((piece) => (
                    <div key={piece} className="flex items-center gap-2">
                        {DEFAULT_PIECES_MAP[piece](40)}
                    </div>
                ))}
            </div>
        </div>
    );
};
