import { useParams } from "react-router-dom";
import { useRoomWS } from "../../hooks/useRoomWS";
import { useUserData } from "../../hooks/useUserData";
import { WaitingScreen } from "../WaitingScreen/WaitingScreen";
import { GameScreen } from "../GameScreen/GameScreen";
import { SetProfileScreen } from "../SetProfileScreen/SetProfileScreen";
import { useGameStorage } from "../../hooks/useGameStorage";
import { useAutoConnect } from "../../hooks/useAutoConnect";

export const AppScreen = () => {
    const { roomId } = useParams<{ roomId: string }>();

    const {
        gameState,
        userColor,
        lastMove,
        movesHistory,
        timer,
        opponentCursor,
        resultMessage,
        offeredDraw,
        connectionLost,

        connectToRoom,
        sendMove,
        sendDrawOffer,
        sendCursorPosition,
        sendResignation,
        sendGameResult,
    } = useRoomWS(roomId || "");
    const { userName, setUserName } = useUserData();
    const { saveGameData, storageGameData, removeGameData } = useGameStorage();

    const { checkingAuth, handleSetUserName } = useAutoConnect({
        roomId: roomId || "",
        userName,
        storageGameData,
        connectToRoom,
        setUserName,
        saveGameData,
        removeGameData,
    });

    // Показываем загрузку пока проверяем авторизацию
    if (checkingAuth) {
        return (
            <div className="w-full h-[100vh] flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4F39F6] border-t-transparent"></div>
            </div>
        );
    }

    // Если пользователь еще не ввел имя, показываем форму
    if (!userName) {
        return <SetProfileScreen onSetUserName={handleSetUserName} />;
    }

    // Если игра началась, показываем игровой экран
    if (userColor && gameState.gameStarted) {
        return (
            <GameScreen
                gameState={gameState}
                movesHistory={movesHistory}
                playerColor={userColor}
                onMove={sendMove}
                currentMove={lastMove}
                timer={timer}
                opponentCursor={opponentCursor}
                onSendCursorPosition={sendCursorPosition}
                onSendResignation={sendResignation}
                onSendGameResult={sendGameResult}
                resultMessage={resultMessage}
                onSendDrawOffer={sendDrawOffer}
                offeredDraw={offeredDraw}
                connectionLost={connectionLost}
            />
        );
    }

    return <WaitingScreen />;
};
