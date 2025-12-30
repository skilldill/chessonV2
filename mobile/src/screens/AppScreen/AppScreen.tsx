import { useParams } from 'react-router-dom';
import { useRoomWS } from '../../hooks/useRoomWS';
import { useUserData } from '../../hooks/useUserData';
import SetProfileScreen from '../SetProfileScreen/SetProfileScreen';
import GameScreen from '../GameScreen/GameScreen';
import WaitingScreen from '../WaitingScreen/WaitingScreen';
import { useGameStorage } from '../../hooks/useGameStorage';
import { useEffect } from 'react';

const AppScreen: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();

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
  

  const handleSetUserName = (userName: string, avatarIndex: number) => {
    console.log(userName, avatarIndex);

    setUserName(userName);
    connectToRoom({
      userName,
      avatar: `${avatarIndex}`,
    });

    saveGameData({
      playerName: userName,
      avatar: `${avatarIndex}`,
      gameId: roomId,
    })
  }

  // Тут еще одна проверка для localStorage

  useEffect(() => {
    if (!storageGameData) return;

    // Проверим, если игрок пытается открыть
    // новую ссессию, то удалим старые данные
    if (storageGameData.gameId !== roomId) {
      removeGameData();
      return;
    }

    handleSetUserName(storageGameData.playerName, parseInt(storageGameData.avatar));
  }, [storageGameData]);

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

export default AppScreen;
