import { IonPage, IonContent } from '@ionic/react';
import { useCellSize } from '../../hooks/useCellSize';
import { ChessBoard, GameResult, JSChessEngine } from 'react-chessboard-ui';
import { CapturedPieces } from '../../components/CapturedPieces/CapturedPieces';
import { HistoryMoves } from '../../components/HistoryMoves/HistoryMoves';
import { GameScreenControls } from '../../components/GameScreenControls/GameScreenControls';
import { ChessTimerWithProfile } from '../../components/ChessTimerWithProfile/ChessTimerWithProfile';
import { useScreenSize } from '../../hooks/useScreenSize';
import { GameState, ChessColor, TimerState, CursorPosition, MoveData } from '../../types';
import { useState, useMemo, useEffect } from 'react';
import { INITIAL_FEN } from '../../constants/chess';
import { useTimers } from '../../hooks/useTimers';
import { debounce } from '../../utils/debounce';
import { MEM_AVATARS } from '../../constants/avatars';
import { useHistory } from 'react-router-dom';
import { useGameStorage } from '../../hooks/useGameStorage';
import { useAppearance } from '../../hooks/useAppearance';
import { ConnectionNotification } from '../../components/ConnectionNotification/ConnectionNotification';
import { DrawOfferActions } from '../../components/DrawOfferActions/DrawOfferActions';
import { ResultsActions } from '../../components/ResultsActions/ResultsActions';
import { CHESSBOARD_THEMES } from '../../components/ChessBoardConfigs/ChessBoardConfigs';

type GameScreenProps = {
  gameState: GameState;
  playerColor: ChessColor;
  movesHistory: MoveData[];
  currentMove?: MoveData;
  timer?: TimerState;
  onMove: (moveData: MoveData) => void;
  onSendCursorPosition: (position: CursorPosition) => void;
  onSendResignation: () => void;
  onSendGameResult: (gameResult: GameResult) => void;
  onSendDrawOffer: (action: 'offer' | 'accept' | 'decline') => void;

  resultMessage?: string;
  offeredDraw?: boolean;
  connectionLost?: boolean;
}

const GameScreen: React.FC<GameScreenProps> = ({
  playerColor,
  gameState,
  currentMove,
  movesHistory,
  timer,
  onMove,
  onSendCursorPosition,
  onSendDrawOffer,
  onSendResignation,
  onSendGameResult,

  resultMessage,
  offeredDraw,
  connectionLost = false,
}) => {
  const screenSize = useScreenSize();
  const cellSize = useCellSize();
  const history = useHistory();
  const { removeGameData } = useGameStorage();
  const { chessboardTheme } = useAppearance();
  const themeConfig = CHESSBOARD_THEMES[chessboardTheme];

  const [initialFEN, setInitialFEN] = useState(INITIAL_FEN);
  const reversed = useMemo(() => playerColor === "black", [playerColor]);
  const {
    opponentTime,
    playerTime,
    initialOpponentTime,
    initialPlayerTime,
  } = useTimers({ timer, playerColor, gameState });

  // Отслеживаем позицию курсора
  useEffect(() => {
    const sendPosition = debounce(onSendCursorPosition, 500);

    const handleMouseMove = (event: MouseEvent) => {
      sendPosition({ x: event.clientX, y: event.clientY })
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const externalChangeMove = useMemo(() => {
    if (!currentMove) return undefined;
    return {
      move: currentMove,
      withTransition: true
    };
  }, [currentMove]);

  const handleMove = (moveData: MoveData) => {
    const move = reversed ? JSChessEngine.reverseMove(moveData) : moveData;
    onMove(move as MoveData);
  }

  const handleQuitGame = () => {
    onSendResignation();
    removeGameData();
    history.push('/');
  };

  useEffect(() => {
    setInitialFEN(gameState.currentFEN);
  }, [])

  const handleCloseResults = () => {
    window.location.href = import.meta.env.VITE_MAIN_SITE;
  };

  const playerAvatarIndex = gameState.player?.avatar ? parseInt(gameState.player.avatar) : undefined;
  const playerAvatar = playerAvatarIndex ? MEM_AVATARS[playerAvatarIndex] : MEM_AVATARS[0];

  const opponentAvatarIndex = gameState.opponent?.avatar ? parseInt(gameState.opponent.avatar) : undefined;
  const opponentAvatar = opponentAvatarIndex ? MEM_AVATARS[opponentAvatarIndex] : MEM_AVATARS[0];

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <div className="grid grid-rows-[1fr_56px] h-full">
          <div className="flex flex-col h-full justify-center">
            <DrawOfferActions
                offeredDraw={offeredDraw}
                onAcceptDraw={() => onSendDrawOffer('accept')}
                onDeclineDraw={() => onSendDrawOffer('decline')}
            />
            <ResultsActions
                message={resultMessage}
                onClose={handleCloseResults}
            />
            <ConnectionNotification
                message="Connection lost"
                show={connectionLost}
            />

            <HistoryMoves moves={movesHistory} />
            <div className="w-full p-[16px]">
              <ChessTimerWithProfile
                initSeconds={initialOpponentTime}
                seconds={opponentTime}
                nickname={gameState.opponent?.userName || 'Anonym'}
                avatar={opponentAvatar}
                active={gameState.currentColor === gameState.opponent?.color}
              />
            </div>

            {screenSize === "L" && (
              <CapturedPieces
                FEN={movesHistory.length > 0 ? (movesHistory[movesHistory.length - 1].FEN || initialFEN) : initialFEN}
                color={playerColor === "white" ? "black" : "white"}
                figure={{
                    type: "pawn",
                    color: playerColor === "white" ? "black" : "white",
                }}
              />
            )}
            <ChessBoard
              FEN={initialFEN}
              onChange={(moveData) => handleMove(moveData as MoveData)} 
              onEndGame={onSendGameResult}
              reversed={playerColor === "black"}
              change={externalChangeMove}
              playerColor={playerColor}
              config={{
                squareSize: cellSize,
                ...themeConfig
              }}
            />
            {screenSize === "L" && (
              <CapturedPieces
                FEN={movesHistory.length > 0 ? (movesHistory[movesHistory.length - 1].FEN || initialFEN) : initialFEN}
                color={playerColor}
                figure={{
                    type: "pawn",
                    color: playerColor,
                }}
                listInBottom={true}
              />
            )}
            <div className="w-full p-[16px]">
              <ChessTimerWithProfile
                initSeconds={initialPlayerTime}
                seconds={playerTime}
                nickname={gameState.player?.userName || 'Anonym'}
                avatar={playerAvatar}
                active={gameState.currentColor === gameState.player?.color}
              />
            </div>
          </div>
          <div className="p-[12px] flex justify-center">
            <GameScreenControls
              key={resultMessage}
              gameEnded={!!resultMessage} // Если есть сообщение об окончании игры, то игра закончилась
              onDrawOffer={() => onSendDrawOffer('offer')}
              onResignation={onSendResignation}
              onQuitGame={handleQuitGame}
            />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GameScreen;
