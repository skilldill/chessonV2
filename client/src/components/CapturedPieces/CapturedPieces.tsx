import { useEffect, useMemo, useState, type FC } from 'react';
import { type Figure, type FigureColor } from 'react-chessboard-ui';
import { getCapturedPieces, getLastCapturedPieces } from '../../utils/getCapturedPieces';
import { getMaterialPercents } from '../../utils/getMaterialPercents';
import cn from 'classnames';
import styles from './CapturedPieces.module.css';
import { CAPTURED_CHESS_PIECES_MAP } from '../../constants/pieces';

type CapturedPiecesProps = {
    FEN: string;
    color: FigureColor;
    figure?: Figure; // Чтобы можно было поставить фиксированное значение
    listInBottom?: boolean;
}

export const CapturedPieces: FC<CapturedPiecesProps> = ({ FEN, color, figure, listInBottom = false }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [lastCapturedFigure, setLastCapturedFigure] = useState<string>();
    const [initialFEN, setInitialFEN] = useState<string>();

    useEffect(() => {
        if (!initialFEN) {
            setInitialFEN(FEN);
            return;
        }

        // Для предотвращения двойного вызова
        if (initialFEN === FEN) return;

        const piece = getLastCapturedPieces(initialFEN, FEN);
        
        // Всегда обновляем initialFEN, чтобы следующее сравнение было корректным
        setInitialFEN(FEN);
        
        // Если фигура была захвачена и это фигура нужного цвета, обновляем отображение
        if (piece && piece.includes(color)) {
            setLastCapturedFigure(piece);
        }
    }, [FEN, initialFEN, color]) 

    const capturedPieces = useMemo(() => getCapturedPieces(FEN, color), [FEN]);
    const materialPercents = useMemo(() => getMaterialPercents(FEN), [FEN]);

    const toggleListsVisible = () => {
        setIsVisible(!isVisible);
    };

    const closeList = () => {
        setIsVisible(false);
    };

    const piecesListClassname = listInBottom ? styles.piecesListBottom : styles.piecesListTop;
    const piecesListVisibleClassname = listInBottom ? styles.piecesListBottomVisible : styles.piecesListTopVisible;

    return (
        <div className="relative" onMouseEnter={toggleListsVisible} onMouseLeave={closeList}>
            <div className="relative w-[144px] h-[80px] bg-back-secondary flex rounded-lg overflow-hidden transition-all duration-200 active:scale-95 cursor-pointer">
                <div className="h-full bg-indigo-400/20" style={{ width: `${materialPercents[color].percentOfStart}%` }} />
                <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center">
                    {(!lastCapturedFigure && figure) && CAPTURED_CHESS_PIECES_MAP[`${figure.type}-${figure.color}`](40)}
                    {lastCapturedFigure && CAPTURED_CHESS_PIECES_MAP[lastCapturedFigure](40)}
                </div>
            </div>
            {materialPercents[color].percentOfStart < 100 && (
                <div className={cn(piecesListClassname, {
                    [piecesListVisibleClassname]: isVisible,
                })}>
                    <div className="bg-back-secondary rounded-lg p-[20px] grid grid-cols-[28px_28px_28px_28px_28px_28px] grid-rows-[28px_28px_28px] gap-2">
                        {capturedPieces.map((piece, i) => (
                            <div key={piece + i} className="flex items-center gap-2">
                                {CAPTURED_CHESS_PIECES_MAP[piece](40)}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
