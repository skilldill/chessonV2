import { ChessBoard } from "react-chessboard-ui";
import type { ChessColor, GameState, MoveData } from "../../types";

type GameScreenProps = {
    gameState: GameState;
    playerColor: ChessColor;
    onMove: (moveData: MoveData) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ gameState, playerColor, onMove }) => {
    return (
        <div>
            <ChessBoard 
                FEN="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" 
                onChange={() => {}} 
                onEndGame={() => {}}
                reversed
                // change={gameState.moveHistory.length > 0 ? { move: gameState.moveHistory[gameState.moveHistory.length - 1], withTransition: true } : undefined}
            />
        </div>
    )
}