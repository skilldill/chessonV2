import { GameScreen } from "../screens/GameScreen/GameScreen";
import type { ChessColor } from "../types";

const INITIAL_GAME_STATE = {
    currentFEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moveHistory: [],
    currentPlayer: "white" as ChessColor,
    gameStarted: false,
    gameEnded: false,
    gameResult: undefined,
    drawOffer: undefined,
    drawOfferCount: {}
}

export const GameScreenTest = () => {
    return (
        <GameScreen 
            gameState={INITIAL_GAME_STATE}
            playerColor="white" 
            onMove={() => {}} 
            currentMove={undefined} 
        />
    );
}
