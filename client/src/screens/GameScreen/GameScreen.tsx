import { ChessBoard } from "react-chessboard-ui";
import type { ChessColor, GameState } from "../../types";
import 'react-chessboard-ui/dist/index.css';

type GameScreenProps = {
    gameState: GameState;
    playerColor: ChessColor;
}

export const GameScreen: React.FC<GameScreenProps> = ({ gameState, playerColor }) => {
    return (
        <div>
            <ChessBoard 
                FEN={gameState.currentFEN} 
                onChange={() => {}} 
                onEndGame={() => {}}
                playerColor={playerColor}
                reversed={playerColor === "black"}
            />
        </div>
    )
}