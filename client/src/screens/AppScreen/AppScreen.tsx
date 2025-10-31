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
        movesHistory,
        timer,
        opponentCursor,
        resultMessage,
        offeredDraw,
        
        connectToRoom,
        sendMove,
        sendDrawOffer,
        sendCursorPosition,
        sendResignation,
        sendGameResult,
    } = useRoomWS(roomId || "");
    const { userName, setUserName } = useUserData();

    const handleSetUserName = (userName: string, avatarIndex: number) => {
        setUserName(userName);
        connectToRoom({
            userName,
            avatar: `${avatarIndex}`,
        });
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
            />
        );
    }

    return <WaitingScreen roomId={roomId} userName={userName} isConnected={isConnected} />;
};
