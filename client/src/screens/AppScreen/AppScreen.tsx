import { useParams } from "react-router-dom";
import { useRoomWS } from "../../hooks/useRoomWS";
import { useUserData } from "../../hooks/useUserData";
import { WaitingScreen } from "../WaitingScreen/WaitingScreen";
import { GameScreen } from "../GameScreen/GameScreen";

export const AppScreen = () => {
    const { roomId } = useParams<{ roomId: string }>();

    const { connectToRoom, isConnected, gameState, userColor } = useRoomWS(roomId || "");
    const { userName, setUserName } = useUserData();

    const handleSetUserName = (userName: string) => {
        setUserName(userName);
        connectToRoom(userName);
    }

    // Если пользователь еще не ввел имя, показываем форму
    if (!isConnected) {
        return <WaitingScreen onSetUserName={handleSetUserName} />;
    }

    if (gameState.gameStarted) {
        return <GameScreen gameState={gameState} playerColor={userColor || "white"} />;
    }

    return (
        <div className="container">
            <div>AppScreen {roomId}</div>
            <div>Подключен: {isConnected ? 'Да' : 'Нет'}</div>
            <div>Имя пользователя: {userName}</div>
        </div>
    );
};
