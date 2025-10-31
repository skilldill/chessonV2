import { ChessBoard, JSChessEngine, type GameResult } from "react-chessboard-ui";
import type { ChessColor, GameState, MoveData, TimerState, CursorPosition } from "../../types";
import { memo, useEffect, useMemo, useState } from "react";
import { ChessboardWrap } from "../../components/ChessboardWrap/ChessboardWrap";
import { GameScreenControls } from "../../components/GameScreenControls/GameScreenControls";
import { CapturedPieces } from "../../components/CapturedPieces/CapturedPieces";
import { ChessTimer } from "../../components/ChessTimer/ChessTimer";
import { HistoryMoves } from "../../components/HistoryMoves/HistoryMoves";
import { INITIAL_FEN } from "../../constants/chess";
import { useTimers } from "../../hooks/useTimers";
import { debounce } from "../../utils/debounce";
import { GameCursorProfile } from "../../components/GameCursorProfile/GameCursorProfile";
import { DrawOfferActions } from "../../components/DrawOfferActions/DrawOfferActions";
import { ResultsActions } from "../../components/ResultsActions/ResultsActions";

type GameScreenProps = {
    gameState: GameState;
    playerColor: ChessColor;
    movesHistory: MoveData[];
    currentMove?: MoveData;
    timer?: TimerState;
    opponentCursor?: CursorPosition;
    onMove: (moveData: MoveData) => void;
    onSendCursorPosition: (position: CursorPosition) => void;
    onSendResignation: () => void;
    onSendGameResult: (gameResult: GameResult) => void;
    onSendDrawOffer: (action: 'offer' | 'accept' | 'decline') => void;
    
    resultMessage?: string;
    offeredDraw?: boolean;
}

export const GameScreen: React.FC<GameScreenProps> = memo(({ 
    playerColor,
    gameState,
    currentMove,
    movesHistory,
    timer,
    opponentCursor,
    onMove,
    onSendCursorPosition,
    onSendDrawOffer,
    onSendResignation,
    onSendGameResult,

    resultMessage,
    offeredDraw,
}) => {
    const [initialFEN, setInitialFEN] = useState(INITIAL_FEN);
    const reversed = useMemo(() => playerColor === "black", [playerColor]);
    const { 
        opponentTime, 
        playerTime,
        initialOpponentTime,
        initialPlayerTime, 
    } = useTimers({ timer, playerColor, gameState });

    // Отслеживаем позицию курсора
    useEffect(() => {
        const sendPosition = debounce(onSendCursorPosition, 500);

        const handleMouseMove = (event: MouseEvent) => {
            sendPosition({ x: event.clientX, y: event.clientY })
        };

        document.addEventListener('mousemove', handleMouseMove);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const externalChangeMove = useMemo(() => {
        if (!currentMove) return undefined;
        return {
            move: currentMove,
            withTransition: true
        };
    }, [currentMove]);

    const handleMove = (moveData: MoveData) => {
        const move = reversed ? JSChessEngine.reverseMove(moveData) : moveData;
        onMove(move as MoveData);
    }

    const handleQuitGame = () => {
        onSendResignation();
        window.location.href = import.meta.env.VITE_MAIN_SITE;
    };

    useEffect(() => {
        setInitialFEN(gameState.currentFEN);
    }, [])

    const handleCloseResults = () => {
        window.location.href = import.meta.env.VITE_MAIN_SITE;
    };

    return (
        <div className="bg-back-primary grid grid-cols-[1fr_720px_1fr] h-screen items-center relative">
            <DrawOfferActions
                offeredDraw={offeredDraw}
                onAcceptDraw={() => onSendDrawOffer('accept')}
                onDeclineDraw={() => onSendDrawOffer('decline')}
            />
            <ResultsActions
                message={resultMessage}
                onClose={handleCloseResults}
            />
            {!resultMessage && (
                <GameCursorProfile
                    opponentCursor={opponentCursor}
                    playerColor={playerColor}
                    gameState={gameState}
                />
            )}
            <div className="flex justify-end p-[16px]">
                <div className="flex flex-col gap-y-[8px]">
                    <CapturedPieces
                        FEN={movesHistory.length > 0 ? movesHistory[movesHistory.length - 1].FEN : initialFEN}
                        color={playerColor === "white" ? "black" : "white"}
                        figure={{
                            type: "pawn",
                            color: playerColor === "white" ? "black" : "white",
                        }}
                    />
                    <CapturedPieces 
                        FEN={movesHistory.length > 0 ? movesHistory[movesHistory.length - 1].FEN : initialFEN}
                        color={playerColor}
                        figure={{
                            type: "pawn",
                            color: playerColor,
                        }}
                        listInBottom={true}
                    />
                </div>
            </div>
            <div>
                <ChessboardWrap reverse={playerColor === "black"}>
                    <ChessBoard
                        FEN={initialFEN}
                        onChange={(moveData) => handleMove(moveData as MoveData)} 
                        onEndGame={onSendGameResult}
                        reversed={playerColor === "black"}
                        change={externalChangeMove}
                        playerColor={playerColor}
                        config={{ 
                            cellSize: 84, 
                            whiteCellColor: "#E5E7EB",
	                        blackCellColor: "#A5AEBD",
                            circleMarkColor: "#0069A8",
                        }}
                    />
                </ChessboardWrap>

                <GameScreenControls
                    key={resultMessage}
                    gameEnded={!!resultMessage} // Если есть сообщение об окончании игры, то игра закончилась
                    onDrawOffer={() => onSendDrawOffer('offer')}
                    onResignation={onSendResignation}
                    onQuitGame={handleQuitGame}
                />
            </div>
            <div className="flex justify-start p-[16px]">
                <div className="fixed top-[40px] right-[40px] z-40">
                    <HistoryMoves moves={movesHistory} />
                </div>
                <div className="flex flex-col gap-y-[8px]">
                    {/* Таймер соперника (верхний) */}
                    <ChessTimer
                        initSeconds={initialOpponentTime}
                        seconds={opponentTime}
                    />
                    {/* Таймер игрока (нижний) */}
                    <ChessTimer
                        initSeconds={initialPlayerTime}
                        seconds={playerTime}
                        timeLineBottom={true}
                    />
                </div>
            </div>
        </div>
    )
});