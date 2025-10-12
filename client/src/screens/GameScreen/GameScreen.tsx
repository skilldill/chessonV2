import { ChessBoard, JSChessEngine } from "react-chessboard-ui";
import type { ChessColor, GameState, MoveData } from "../../types";
import { memo, useEffect, useMemo, useState } from "react";

type GameScreenProps = {
    // gameState: GameState;
    playerColor: ChessColor;
    onMove: (moveData: MoveData) => void;
    currentMove?: MoveData;
}

export const GameScreen: React.FC<GameScreenProps> = memo(({ playerColor, onMove, currentMove }) => {
    const [changeMove, setChangeMove] = useState<any>();

    const reversed = useMemo(() => playerColor === "black", [playerColor]);
    
    useEffect(() => {
        JSChessEngine.reverseMove
        if (currentMove) {
            setChangeMove({
                move: currentMove,
                withTransition: true
            });
        }
    }, [currentMove]);

    const handleMove = (moveData: MoveData) => {
        const move = reversed ? JSChessEngine.reverseMove(moveData) : moveData;
        onMove(move as MoveData);
    }

    return (
        <div>
            <ChessBoard
                FEN="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                onChange={(moveData) => handleMove(moveData as MoveData)} 
                onEndGame={() => {}}
                reversed={playerColor === "black"}
                change={changeMove}
                playerColor={playerColor}
                // change={gameState.moveHistory.length > 0 ? { move: gameState.moveHistory[gameState.moveHistory.length - 1], withTransition: true } : undefined}
            />

            {/* <button onClick={() => {
                onMove({
                    FEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                    from: [0, 0],
                    to: [0, 0],
                    figure: {
                        color: playerColor,
                        type: "pawn"
                    }
                });
            }}>Make Move</button>
            {JSON.stringify(currentMove)} */}
        </div>
    )
})