import { useRef, useState } from "react";
import type { 
    WSServerMessage, 
    WSClientMessage, 
    GameState, 
    ChessColor, 
    MoveData, 
    CursorPosition, 
    GameResult, 
    ChatMessage,
    TimerState
} from "../types";
import { getOpponentCursorPosition } from "../utils/getOpponentCursorPosition";

const WS_URL = 'ws://localhost:4000/ws/room';
const INITIAL_GAME_STATE = {
    currentFEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moveHistory: [],
    currentPlayer: "white" as ChessColor,
    gameStarted: false,
    gameEnded: false,
    gameResult: undefined,
    drawOffer: undefined,
    drawOfferCount: {},
    timer: {
        whiteTime: 600, // 10 минут по умолчанию
        blackTime: 600, // 10 минут по умолчанию
        whiteIncrement: 0, // без добавки времени
        blackIncrement: 0,  // без добавки времени
        initialWhiteTime: 600,
        initialBlackTime: 600
    }
}

export const useRoomWS = (roomId: string) => {
    const refWS = useRef<WebSocket | null>(null);
    
    const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [userColor, setUserColor] = useState<ChessColor>();
    const [opponentColor, setOpponentColor] = useState<ChessColor>();
    const [opponentName, setOpponentName] = useState<string>();
    const [opponentCursor, setOpponentCursor] = useState<CursorPosition>();
    const [systemMessages, setSystemMessages] = useState<string[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [lastMove, setLastMove] = useState<MoveData>();
    const [timer, setTimer] = useState<TimerState | undefined>(INITIAL_GAME_STATE.timer);

    const [movesHistory, setMovesHistory] = useState<MoveData[]>([]);

    const handleMessage = (data: WSServerMessage) => {
        // Обработка системных сообщений
        if (data.system) {
            if (data.message) {
                setSystemMessages(prev => [...prev, data.message!]);
            }
        }

        // Обработка различных типов сообщений
        switch (data.type) {
            case 'connection':
            case 'reconnection':
                if (data.userColor) {
                    setUserColor(data.userColor);
                }
                if (data.gameState) {
                    setGameState(data.gameState);
                    setMovesHistory(data.gameState.moveHistory);
                }
                break;

            case 'gameStart':
                if (data.gameState) {
                    setGameState(data.gameState);
                }
                break;

            case 'gameEnd':
                if (data.gameState) {
                    setGameState(data.gameState);
                }
                break;

            case 'message':
                if (data.from && data.message && data.userId && data.time) {
                    setChatMessages(prev => [...prev, {
                        from: data.from!,
                        message: data.message!,
                        userId: data.userId!,
                        time: data.time!
                    }]);
                }
                break;

            case 'move':
                if (data.gameState) {
                    setGameState(data.gameState);
                    setLastMove(data.moveData);
                    setMovesHistory(data.gameState.moveHistory);
                }
                break;

            case 'cursor':
                if (data.position && data.screenSize && data.from !== undefined) {
                    const { x, y } = getOpponentCursorPosition(
                        data.position,
                        data.screenSize,
                    )
                    setOpponentCursor({ x, y });
                }
                break;

            case 'gameResult':
                if (data.gameState) {
                    setGameState(data.gameState);
                }
                break;

            case 'drawOffer':
                if (data.gameState) {
                    setGameState(data.gameState);
                }
                break;

            case 'timerTick':
                if (data.timer) {
                    setTimer(data.timer);
                    // Обновляем таймер в gameState тоже
                    setGameState(prev => ({
                        ...prev,
                        timer: data.timer
                    }));
                }
                break;

            default:
                // Обработка сообщений о подключении оппонента
                if (data.opponentColor && data.from) {
                    setOpponentColor(data.opponentColor);
                    setOpponentName(data.from);
                }
                break;
        }
    };

    const connectToRoom = ({ userName, avatar }: { userName: string, avatar: string }) => {
        if (refWS.current?.readyState === WebSocket.OPEN) {
            refWS.current.close();
        }

        refWS.current = new WebSocket(`${WS_URL}?roomId=${roomId}&userName=${userName}&avatar=${avatar}`);
        
        refWS.current.onopen = () => {
            setIsConnected(true);
            console.log('Connected to room:', roomId);
        };

        refWS.current.onclose = () => {
            setIsConnected(false);
            console.log('Disconnected from room');
        };

        refWS.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        refWS.current.onmessage = (event) => {
            try {
                const data: WSServerMessage = JSON.parse(event.data);
                handleMessage(data);
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };
    };

    const disconnect = () => {
        if (refWS.current) {
            refWS.current.close();
        }
    };

    const sendMessage = (message: WSClientMessage) => {
        if (refWS.current?.readyState === WebSocket.OPEN) {
            refWS.current.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not connected');
        }
    };

    // Вспомогательные функции для отправки различных типов сообщений
    const sendChatMessage = (message: string) => {
        sendMessage({ type: 'message', message });
    };

    const sendMove =(moveData: MoveData) => {
        setMovesHistory((moves) => [...moves, moveData]); 
        sendMessage({ type: 'move', moveData });
    };

    const sendCursorPosition = (position: CursorPosition) => {
        sendMessage({ 
            type: 'cursor',
            position,
            screenSize: { width: window.innerWidth, height: window.innerHeight }
        });
    };

    const sendGameResult = (gameResult: GameResult) => {
        sendMessage({ type: 'gameResult', gameResult });
    };

    const sendDrawOffer = (action: 'offer' | 'accept' | 'decline') => {
        sendMessage({ type: 'drawOffer', action });
    };

    const sendResignation = () => {
        sendMessage({ type: 'resign' });
    };

    return {
        // Состояние
        isConnected,
        gameState,
        userColor,
        opponentColor,
        opponentName,
        systemMessages,
        chatMessages,
        opponentCursor,
        timer,
        
        // Функции подключения
        connectToRoom,
        disconnect,
        lastMove,

        // Функции отправки сообщений
        sendChatMessage,
        sendMove,
        sendCursorPosition,
        sendGameResult,
        sendDrawOffer,
        sendResignation,
        
        // Общая функция отправки
        sendMessage,

        // Преобразованные данные
        movesHistory,
    };
};
