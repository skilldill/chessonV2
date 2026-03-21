import { useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useRoomWS } from "../../hooks/useRoomWS";
import { useUserData } from "../../hooks/useUserData";
import { WaitingScreen } from "../WaitingScreen/WaitingScreen";
import { GameScreen } from "../GameScreen/GameScreen";
import { SetProfileScreen } from "../SetProfileScreen/SetProfileScreen";
import { useGameStorage } from "../../hooks/useGameStorage";
import { useAutoConnect } from "../../hooks/useAutoConnect";
const QUICK_PLAY_ROOM_ID_KEY = "quickPlayRoomId";
const LEAVE_DELAY_MS = 3000;

function ConnectingToGameOverlay({ onLeave }: { onLeave: () => void }) {
    const history = useHistory();
    const [showLeaveOption, setShowLeaveOption] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowLeaveOption(true), LEAVE_DELAY_MS);
        return () => clearTimeout(timer);
    }, []);

    const handleLeave = () => {
        onLeave();
        history.push("/main");
    };

    return (
        <div className="w-full h-[100vh] flex flex-col justify-center items-center gap-6 px-4">
            <div className="text-center text-white/85">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4F39F6] border-t-transparent mx-auto" />
                <p className="mt-4 text-sm">Connecting to game...</p>
            </div>
            {showLeaveOption && (
                <div className="w-full max-w-sm flex flex-col items-center gap-3">
                    <p className="text-white/70 text-sm text-center">
                        Connection is taking longer than expected. You can leave and try again.
                    </p>
                    <button
                        type="button"
                        onClick={handleLeave}
                        className="w-full rounded-xl px-6 py-4 bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15 transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer"
                    >
                        Leave
                    </button>
                </div>
            )}
        </div>
    );
}

export const AppScreen = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const isQuickPlayRoom = useMemo(
        () => !!roomId && localStorage.getItem(QUICK_PLAY_ROOM_ID_KEY) === roomId,
        [roomId]
    );

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
        disconnect,
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
        if (isQuickPlayRoom) {
            localStorage.removeItem(QUICK_PLAY_ROOM_ID_KEY);
        }
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

    if (isQuickPlayRoom && userName) {
        return (
            <ConnectingToGameOverlay onLeave={() => {
                localStorage.removeItem(QUICK_PLAY_ROOM_ID_KEY);
                localStorage.removeItem("quickPlayProfile");
                localStorage.removeItem("gameData");
                localStorage.removeItem("wsClientId");
            }} />
        );
    }

    return (
        <WaitingScreen
            onLeave={() => {
                disconnect();
                localStorage.removeItem("gameData");
                localStorage.removeItem("wsClientId");
            }}
        />
    );
};
