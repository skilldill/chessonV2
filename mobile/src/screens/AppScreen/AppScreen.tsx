import { useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useRoomWS } from '../../hooks/useRoomWS';
import { useUserData } from '../../hooks/useUserData';
import SetProfileScreen from '../SetProfileScreen/SetProfileScreen';
import GameScreen from '../GameScreen/GameScreen';
import WaitingScreen from '../WaitingScreen/WaitingScreen';
import { useGameStorage } from '../../hooks/useGameStorage';
import { useAutoConnect } from '../../hooks/useAutoConnect';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';

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
    <IonPage>
      <IonContent className="ion-padding">
        <div className="flex flex-col justify-center items-center h-full gap-6 px-4">
          <div className="flex flex-col items-center gap-4">
            <IonSpinner name="crescent" />
            <p className="text-white/85 text-sm">Connecting to game...</p>
          </div>
          {showLeaveOption && (
            <div className="w-full max-w-sm flex flex-col items-center gap-3">
              <p className="text-white/70 text-sm text-center">
                Connection is taking longer than expected. You can leave and try again.
              </p>
              <button
                type="button"
                onClick={handleLeave}
                className="btn-client w-full rounded-xl px-6 py-4 bg-white/10 border border-white/15 text-white font-semibold active:bg-white/15 transition-all duration-200 active:scale-[0.98] touch-manipulation -webkit-tap-highlight-color: transparent"
              >
                Leave
              </button>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}

const AppScreen: React.FC = () => {
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
      <IonPage>
        <IonContent className="ion-padding">
          <div className="flex justify-center items-center h-full">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
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

  return <WaitingScreen />;
};

export default AppScreen;
