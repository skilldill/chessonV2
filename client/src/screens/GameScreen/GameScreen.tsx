import { ChessBoard, JSChessEngine } from "react-chessboard-ui";
import type { ChessColor, GameState, MoveData } from "../../types";
import { memo, useMemo } from "react";
import { ChessboardWrap } from "../../components/ChessboardWrap/ChessboardWrap";
import { PlasmaButton } from "../../components/PlasmaButton/PlasmaButton";


type GameScreenProps = {
    gameState: GameState;
    playerColor: ChessColor;
    onMove: (moveData: MoveData) => void;
    currentMove?: MoveData;
}

export const GameScreen: React.FC<GameScreenProps> = memo(({ playerColor, onMove, currentMove }) => {
    const reversed = useMemo(() => playerColor === "black", [playerColor]);

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

    return (
        <div className="bg-back-primary grid grid-cols-[1fr_720px_1fr] h-screen items-center">
            <div></div>
            <div>
                <ChessboardWrap>
                    <ChessBoard
                        FEN="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
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
                <PlasmaButton />
            </div>
            <div></div>

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