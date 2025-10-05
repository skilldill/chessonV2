import { useParams } from "react-router-dom";
import { useRoomWS } from "../../hooks/useRoomWS";
import { useUserData } from "../../hooks/useUserData";
import { WaitingScreen } from "../WaitingScreen/WaitingScreen";
import { GameScreen } from "../GameScreen/GameScreen";
import { useEffect } from "react";

export const AppScreen = () => {
    const { roomId } = useParams<{ roomId: string }>();

    const { connectToRoom, isConnected, gameState, userColor } = useRoomWS(roomId || "");
    const { userName, setUserName } = useUserData();

    // Автоматически подключаемся, если есть сохраненное имя
    useEffect(() => {
        if (userName && !isConnected) {
            connectToRoom(userName);
        }
    }, [userName, isConnected, connectToRoom]);

    const handleSetUserName = (userName: string) => {
        setUserName(userName);
        connectToRoom(userName);
    }

    // Если пользователь еще не ввел имя, показываем форму
    if (!userName) {
        return <WaitingScreen onSetUserName={handleSetUserName} />;
    }

    // Если игра началась, показываем игровой экран
    if (gameState.gameStarted) {
        return <GameScreen gameState={gameState} playerColor={userColor || "white"} />;
    }

    return (
        <div className="container">
            <div>AppScreen {roomId}</div>
            <div>Подключен: {isConnected ? 'Да' : 'Нет'}</div>
            <div>Имя пользователя: {userName}</div>
            <div>Ожидание начала игры...</div>
        </div>
    );
};
