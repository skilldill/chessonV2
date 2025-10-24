import { ChessBoard, JSChessEngine } from "react-chessboard-ui";
import type { ChessColor, GameState, MoveData, TimerState } from "../../types";
import { memo, useEffect, useMemo, useState } from "react";
import { ChessboardWrap } from "../../components/ChessboardWrap/ChessboardWrap";
import { GameScreenControls } from "../../components/GameScreenControls/GameScreenControls";
import { CapturedPieces } from "../../components/CapturedPieces/CapturedPieces";
import { ChessTimer } from "../../components/ChessTimer/ChessTimer";
import { HistoryMoves } from "../../components/HistoryMoves/HistoryMoves";
import { INITIAL_FEN } from "../../constants/chess";

type GameScreenProps = {
    gameState: GameState;
    playerColor: ChessColor;
    movesHistory: MoveData[];
    currentMove?: MoveData;
    timer?: TimerState;
    onMove: (moveData: MoveData) => void;
}

export const GameScreen: React.FC<GameScreenProps> = memo(({ 
    playerColor,
    gameState,
    currentMove,
    movesHistory,
    timer,
    
    onMove, 
}) => {
    const [initialFEN, setInitialFEN] = useState(INITIAL_FEN);
    const reversed = useMemo(() => playerColor === "black", [playerColor]);

    // Определяем время для соперника и игрока
    const opponentTime = useMemo(() => {
        if (!timer) return 600; // значение по умолчанию
        return playerColor === "white" ? timer.blackTime : timer.whiteTime;
    }, [timer, playerColor]);

    const playerTime = useMemo(() => {
        if (!timer) return 600; // значение по умолчанию
        return playerColor === "white" ? timer.whiteTime : timer.blackTime;
    }, [timer, playerColor]);

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

    useEffect(() => {
        setInitialFEN(gameState.currentFEN);
    }, [])

    return (
        <div className="bg-back-primary grid grid-cols-[1fr_720px_1fr] h-screen items-center">
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
                        onEndGame={() => {}}
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
                    onDrawOffer={() => {}}
                    onResignation={() => {}}
                    onQuitGame={() => {}}
                />
            </div>
            <div className="flex justify-start p-[16px]">
                <div className="fixed top-[40px] right-[40px] z-40">
                    <HistoryMoves moves={movesHistory} />
                </div>
                <div className="flex flex-col gap-y-[8px]">
                    {/* Таймер соперника (верхний) */}
                    <ChessTimer
                        initSeconds={10}
                        seconds={opponentTime}
                    />
                    {/* Таймер игрока (нижний) */}
                    <ChessTimer
                        initSeconds={10}
                        seconds={playerTime}
                        timeLineBottom={true}
                    />
                </div>
            </div>
        </div>
    )
});