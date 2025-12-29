import type { FC } from 'react';
import type { ChessColor, GameState, CursorPosition } from "../../types";
import { MEM_AVATARS } from "../../constants/avatars";
import { CursorProfile } from '../CursorProfile/CursorProfile';

type GameCursorProfileProps = {
    opponentCursor?: CursorPosition;
    playerColor: ChessColor;
    gameState: GameState;
}

export const GameCursorProfile: FC<GameCursorProfileProps> = ({
    opponentCursor,
    playerColor,
    gameState,
}) => {
    if (!opponentCursor) {
        return null;
    }

    // Определяем цвет оппонента: если текущий игрок белый, то оппонент - черный, иначе - белый
    const opponentColor = playerColor === "white" ? "black" : "white";
    
    // Показываем курсор только во время хода оппонента
    const isOpponentTurn = gameState.currentColor === opponentColor;
    
    // Определяем оппонента: если текущий игрок белый, то оппонент - черный (opponent), иначе - белый (player)
    const opponent = playerColor === "white" ? gameState.opponent : gameState.player;
    const avatarIndex = opponent?.avatar ? parseInt(opponent.avatar) : undefined;
    const avatarSrc = avatarIndex !== undefined && avatarIndex >= 0 && avatarIndex < MEM_AVATARS.length 
        ? MEM_AVATARS[avatarIndex] 
        : undefined;
    
    return (
        <div
            className="fixed transition-all duration-500 ease-in-out z-100"
            style={{ top: `${opponentCursor.y}px`, left: `${opponentCursor.x}px`, opacity: isOpponentTurn ? 1 : 0 }}
        >
            <CursorProfile 
                nickname={opponent?.userName || "Игрок"}
                avatar={avatarSrc}
            />
        </div>
    );
};
