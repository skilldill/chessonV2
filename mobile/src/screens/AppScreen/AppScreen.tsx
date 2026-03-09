import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useRoomWS } from '../../hooks/useRoomWS';
import { useUserData } from '../../hooks/useUserData';
import SetProfileScreen from '../SetProfileScreen/SetProfileScreen';
import GameScreen from '../GameScreen/GameScreen';
import WaitingScreen from '../WaitingScreen/WaitingScreen';
import { useGameStorage } from '../../hooks/useGameStorage';
import { useAutoConnect } from '../../hooks/useAutoConnect';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';

const QUICK_PLAY_ROOM_ID_KEY = "quickPlayRoomId";

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
      <IonPage>
        <IonContent className="ion-padding">
          <div className="flex flex-col justify-center items-center h-full gap-4">
            <IonSpinner name="crescent" />
            <p className="text-white/85 text-sm">Connecting to game...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return <WaitingScreen />;
};

export default AppScreen;
