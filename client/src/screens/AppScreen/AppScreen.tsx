import { useParams } from "react-router-dom";
import { useRoomWS } from "../../hooks/useRoomWS";
import { useUserData } from "../../hooks/useUserData";
import { WaitingScreen } from "../WaitingScreen/WaitingScreen";
import { GameScreen } from "../GameScreen/GameScreen";
import { SetProfileScreen } from "../SetProfileScreen/SetProfileScreen";

export const AppScreen = () => {
    const { roomId } = useParams<{ roomId: string }>();

    const { 
        isConnected, 
        gameState, 
        userColor,
        lastMove,
        connectToRoom, 
        sendMove, 
    } = useRoomWS(roomId || "");
    const { userName, setUserName } = useUserData();

    const handleSetUserName = (userName: string) => {
        setUserName(userName);
        connectToRoom(userName);
    }

    // Если пользователь еще не ввел имя, показываем форму
    if (!userName) {
        return <SetProfileScreen onSetUserName={handleSetUserName} />;
    }

    // Если игра началась, показываем игровой экран
    if (userColor && gameState.gameStarted) {
        return (
            <GameScreen
                // gameState={gameState}
                playerColor={userColor}
                onMove={sendMove}
                currentMove={lastMove}
            />
        );
    }

    return <WaitingScreen roomId={roomId} userName={userName} isConnected={isConnected} />;
};
