import { useMemo, type FC } from 'react';
import { DEFAULT_PIECES_MAP, type FigureColor } from 'react-chessboard-ui';
import { getCapturedPieces } from '../../utils/getCapturedPieces';

type CapturedPiecesProps = {
    FEN: string;
    color: FigureColor;
}

export const CapturedPieces: FC<CapturedPiecesProps> = ({ FEN, color }) => {

    const capturedPieces = useMemo(() => getCapturedPieces(FEN, color), [FEN]);

    return (
        <div className="flex flex-col gap-2">
            {capturedPieces.map((piece) => (
                <div key={piece} className="flex items-center gap-2">
                    {DEFAULT_PIECES_MAP[piece](40)}
                </div>
            ))}
        </div>
    );
};
