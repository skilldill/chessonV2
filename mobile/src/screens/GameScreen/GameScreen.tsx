import { IonPage, IonContent } from '@ionic/react';
import { useCellSize } from '../../hooks/useCellSize';
import { ChessBoard, GameResult, JSChessEngine } from 'react-chessboard-ui';
import { CapturedPieces } from '../../components/CapturedPieces/CapturedPieces';
import { HistoryMoves } from '../../components/HistoryMoves/HistoryMoves';
import { GameScreenControls } from '../../components/GameScreenControls/GameScreenControls';
import { ChessTimerWithProfile } from '../../components/ChessTimerWithProfile/ChessTimerWithProfile';
import { useScreenSize } from '../../hooks/useScreenSize';
import { GameState, ChessColor, TimerState, CursorPosition, MoveData } from '../../types';
import { useState, useMemo, useEffect, useRef } from 'react';
import { INITIAL_FEN } from '../../constants/chess';
import { useTimers } from '../../hooks/useTimers';
import { debounce } from '../../utils/debounce';
import { MEM_AVATARS } from '../../constants/avatars';
import { useGameStorage } from '../../hooks/useGameStorage';
import { useAppearance } from '../../hooks/useAppearance';
import { ConnectionNotification } from '../../components/ConnectionNotification/ConnectionNotification';
import { DrawOfferActions } from '../../components/DrawOfferActions/DrawOfferActions';
import { ResultsActions } from '../../components/ResultsActions/ResultsActions';
import { CHESSBOARD_THEMES } from '../../components/ChessBoardConfigs/ChessBoardConfigs';

import WhiteFlagPNG from "../../assets/white-flag.png";
import CrossMarkRedPNG from "../../assets/cross-mark.png";
import HandShakePNG from "../../assets/handshake.png";
import AiIconPNG from "../../assets/ai-icon.png";
import ArrowLeftPNG from '../../assets/arrow-left.png';
import DoubleChevronesLeftSVG from '../../assets/double-chevrones-left.svg';

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
  onSendAIHintRequest: () => void;
  onSendRollbackPlayerMove: () => void;
  aiHintArrow: { from: [number, number]; to: [number, number] } | null;

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
  onSendAIHintRequest,
  onSendRollbackPlayerMove,
  aiHintArrow,

  resultMessage,
  offeredDraw,
  connectionLost = false,
}) => {
  const screenSize = useScreenSize();
  const cellSize = useCellSize();
  const { removeGameData } = useGameStorage();
  const { chessboardTheme } = useAppearance();
  const themeConfig = CHESSBOARD_THEMES[chessboardTheme];

  const [initialFEN, setInitialFEN] = useState(INITIAL_FEN);
  const [boardResetVersion, setBoardResetVersion] = useState(0);
  const [waitAIhint, setWaitAIhint] = useState(false);
  const [gameControlsNotify, setGameControlsNotify] = useState<{ text: string }>();
  const [externalChangeMove, setExternalChangeMove] = useState<any>(undefined);
  const previousMovesCountRef = useRef<number>(movesHistory.length);

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

  const handleMove = (moveData: MoveData) => {
    const move = reversed ? JSChessEngine.reverseMove(moveData) : moveData;
    onMove(move as MoveData);
  }

  const handleQuitGame = () => {
    onSendResignation();
    removeGameData();
    window.location.href = '/';
  };

  useEffect(() => {
    setInitialFEN(gameState.currentFEN);
  }, [])

  // Контролируем внешние ходы
    // через useEffect, так как 
    // если сделать откат хода
    // То старый внешний ход + обновленное состояние
    // вызывают pat на доске
    useEffect(() => {
        if (!currentMove) {
            setExternalChangeMove(undefined);
            return;
        };

        setExternalChangeMove({
            move: currentMove,
            withTransition: true
        });
    }, [currentMove])

    useEffect(() => {
        const previousCount = previousMovesCountRef.current;
        const nextCount = movesHistory.length;

        if (nextCount < previousCount) {
            setExternalChangeMove(undefined);
            setInitialFEN(gameState.currentFEN);
            setBoardResetVersion((prev) => prev + 1);
        }

        previousMovesCountRef.current = nextCount;
    }, [movesHistory.length, gameState.currentFEN]);

  const handleCloseResults = () => {
    window.location.href = import.meta.env.VITE_MAIN_SITE;
  };

  const handleAIhints = () => {
    if (waitAIhint) {
      return;
    }

    if (playerColor !== gameState.currentColor) {
        setGameControlsNotify({ text: 'Only on your turn' });
        return;
    }

    setWaitAIhint(true);
    onSendAIHintRequest();
  };

  useEffect(() => {
    if (aiHintArrow) {
      setWaitAIhint(false);
    }
  }, [aiHintArrow]);

  useEffect(() => {
    if (!waitAIhint) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setWaitAIhint(false);
    }, 10_000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [waitAIhint]);

  const mappedHintArrow = useMemo(() => {
    if (!aiHintArrow) {
      return [];
    }

    if (playerColor !== "black") {
      return [{ start: aiHintArrow.from, end: aiHintArrow.to }];
    }

    const reverseCoords = (coords: [number, number]): [number, number] => [7 - coords[0], 7 - coords[1]];
    return [{ start: reverseCoords(aiHintArrow.from), end: reverseCoords(aiHintArrow.to) }];
  }, [aiHintArrow, playerColor]);

  const playerAvatarIndex = gameState.player?.avatar ? parseInt(gameState.player.avatar) : undefined;
  const playerAvatar = playerAvatarIndex ? MEM_AVATARS[playerAvatarIndex] : MEM_AVATARS[0];

  const opponentAvatarIndex = gameState.opponent?.avatar ? parseInt(gameState.opponent.avatar) : undefined;
  const opponentAvatar = opponentAvatarIndex ? MEM_AVATARS[opponentAvatarIndex] : MEM_AVATARS[0];

  const magicButtonControls = [
    {
      content: <img src={HandShakePNG} alt="Предложить ничью" height={18} width={18} />,
      onClick: () => onSendDrawOffer('offer'),
      tooltip: 'Предложить ничью',
    },
    {
      content: <img src={WhiteFlagPNG} alt="Сдаться" height={18} width={18} />,
      onClick: () => onSendResignation(),
      tooltip: 'Сдаться',
    },
    {
      content: <img src={CrossMarkRedPNG} alt="Завершить игру" height={18} width={18} />,
      onClick: () => handleQuitGame(),
      tooltip: 'Уйти',
    },
  ];

  const forBotGameMagicButtonControls = [
    {
      content: <img src={AiIconPNG} alt="Подсказка от AI" height={18} width={18} />,
      onClick: () => handleAIhints(),
      tooltip: 'AI\u00A0подсказка',
    },
    {
      content: <img src={DoubleChevronesLeftSVG} alt="Вернуться к прошлому ходу" height={26} width={26} />,
      onClick: () => onSendRollbackPlayerMove(),
      tooltip: 'Переходить',
    },
    {
      content: <img src={CrossMarkRedPNG} alt="Завершить игру" height={18} width={18} />,
      onClick: () => handleQuitGame(),
      tooltip: 'Уйти',
    },
  ];

  const withAIhintsMagicButtonControls = [
    {
      content: <img src={AiIconPNG} alt="Подсказка от AI" height={18} width={18} />,
      onClick: () => handleAIhints(),
      tooltip: 'AI\u00A0подсказка',
    },
    {
      content: <img src={HandShakePNG} alt="Предложить ничью" height={18} width={18} />,
      onClick: () => onSendDrawOffer('offer'),
      tooltip: 'Предложить ничью',
    },
    {
      content: <img src={WhiteFlagPNG} alt="Сдаться" height={18} width={18} />,
      onClick: () => onSendResignation(),
      tooltip: 'Сдаться',
    },
    {
      content: <img src={CrossMarkRedPNG} alt="Завершить игру" height={18} width={18} />,
      onClick: () => handleQuitGame(),
      tooltip: 'Уйти',
    },
  ];

  const notActiveMagicButtonControls = [
    {
      content: <img src={CrossMarkRedPNG} alt="Завершить игру" height={18} width={18} />,
      onClick: () => handleQuitGame(),
      tooltip: 'Уйти',
    },
  ];

  const actualMagicButtonControls = useMemo(() => {
    if (gameState.manualBotRoom) return forBotGameMagicButtonControls;
    if (gameState.withAIhints) return withAIhintsMagicButtonControls;
    return magicButtonControls;
  }, [gameState.withAIhints, gameState.manualBotRoom]);

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
              key={`gameBoard-${boardResetVersion}`}
              FEN={initialFEN}
              onChange={(moveData) => handleMove(moveData as MoveData)} 
              onEndGame={onSendGameResult}
              reversed={playerColor === "black"}
              change={externalChangeMove}
              playerColor={playerColor}
              moveArrows={mappedHintArrow}
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
              isNotActive={!!resultMessage}
              loading={waitAIhint}
              notify={gameControlsNotify}
              controls={actualMagicButtonControls}
              notActiveControls={notActiveMagicButtonControls}
              highlightsControls={actualMagicButtonControls}
            />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GameScreen;
