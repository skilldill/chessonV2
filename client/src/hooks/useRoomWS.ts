import { useRef, useState, useEffect } from "react";
import type { 
    WSServerMessage, 
    WSClientMessage, 
    GameState, 
    ChessColor, 
    MoveData, 
    CursorPosition,
    ChatMessage,
    TimerState
} from "../types";
import { getOpponentCursorPosition } from "../utils/getOpponentCursorPosition";
import type { FigureColor } from "react-chessboard-ui";
import { WS_URL, API_PREFIX } from "../constants/api";

// В режиме разработки используем прокси Vite, в production - прямой URL

const INITIAL_GAME_STATE = {
    currentFEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moveHistory: [],
    currentPlayer: "white" as ChessColor,
    currentColor: "white" as ChessColor,
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
    const reconnectAttemptsRef = useRef<number>(0);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const pingIntervalRef = useRef<number | null>(null);
    const lastPongTimeRef = useRef<number>(Date.now());
    const userCredentialsRef = useRef<{ userName: string; avatar: string } | null>(null);
    const connectionCheckIntervalRef = useRef<number | null>(null);
    const isReconnectingRef = useRef<boolean>(false);
    const authTokenRef = useRef<string | null>(null);
    
    const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
    const [currentColorMove, setCurrentColorMove] = useState<FigureColor>();
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
    
    const [resultMessage, setResultMessage] = useState<string>();
    const [offeredDraw, setOfferedDraw] = useState(false);
    const [connectionLost, setConnectionLost] = useState<boolean>(false);

    // Синхронизируем currentColorMove с gameState.currentColor
    useEffect(() => {
        if (gameState.currentColor) {
            setCurrentColorMove(gameState.currentColor as FigureColor);
        }
    }, [gameState.currentColor]);

    const handleMessage = (data: WSServerMessage) => {
        // Обновляем время последнего pong при получении любого сообщения
        lastPongTimeRef.current = Date.now();
        
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
                    // Обновляем currentColorMove на основе currentColor
                    setCurrentColorMove(data.gameState.currentColor as FigureColor);
                }
                break;

            case 'gameStart':
                if (data.gameState) {
                    setGameState(data.gameState);
                    // Обновляем currentColorMove на основе currentColor
                    setCurrentColorMove(data.gameState.currentColor as FigureColor);
                }
                break;

            case 'gameEnd':
                setResultMessage(data.message);
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
                    // Обновляем currentColorMove на основе currentColor
                    setCurrentColorMove(data.gameState.currentColor as FigureColor);
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
                    // Обновляем currentColorMove на основе currentColor
                    setCurrentColorMove(data.gameState.currentColor as FigureColor);
                }
                break;

            case 'drawOffer':
                setOfferedDraw(true);
                break;

            case 'timerTick':
                if (data.timer) {
                    setTimer(data.timer);
                    // Обновляем таймер в gameState тоже
                    setGameState(prev => {
                        const updated = {
                            ...prev,
                            timer: data.timer
                        };
                        // Обновляем currentColorMove если изменился currentColor
                        if (prev.currentColor !== updated.currentColor) {
                            setCurrentColorMove(updated.currentColor as FigureColor);
                        }
                        return updated;
                    });
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

    const clearConnectionCheck = () => {
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }
        if (connectionCheckIntervalRef.current) {
            clearInterval(connectionCheckIntervalRef.current);
            connectionCheckIntervalRef.current = null;
        }
    };

    const startConnectionCheck = () => {
        clearConnectionCheck();
        
        // Проверяем соединение каждые 5 секунд
        connectionCheckIntervalRef.current = setInterval(() => {
            const ws = refWS.current;
            const now = Date.now();
            const timeSinceLastPong = now - lastPongTimeRef.current;
            
            // Если прошло больше 10 секунд с последнего сообщения и соединение открыто,
            // считаем что соединение потеряно
            if (ws && ws.readyState === WebSocket.OPEN) {
                if (timeSinceLastPong > 10000) {
                    console.warn('Connection appears to be lost, attempting reconnection...');
                    handleReconnection();
                }
            } else if (ws && ws.readyState !== WebSocket.CONNECTING && ws.readyState !== WebSocket.OPEN) {
                // Если соединение закрыто или в состоянии ошибки, пытаемся переподключиться
                handleReconnection();
            }
        }, 5000);
    };

    const handleReconnection = () => {
        // Предотвращаем множественные одновременные попытки переподключения
        if (isReconnectingRef.current) {
            return;
        }

        if (!userCredentialsRef.current) {
            console.error('Cannot reconnect: no user credentials stored');
            return;
        }

        console.log(reconnectAttemptsRef.current)
        if (reconnectAttemptsRef.current >= 4) {
            console.error('Max reconnection attempts reached');
            setConnectionLost(true);
            setIsConnected(false);
            clearConnectionCheck();
            isReconnectingRef.current = false;
            return;
        }

        isReconnectingRef.current = true;
        reconnectAttemptsRef.current += 1;
        console.log(`Reconnection attempt ${reconnectAttemptsRef.current}/5`);

        // Закрываем текущее соединение если оно есть
        if (refWS.current) {
            refWS.current.onclose = null; // Отключаем обработчик чтобы избежать рекурсии
            refWS.current.close();
        }

        // Пытаемся переподключиться через экспоненциальную задержку
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 10000);
        
        reconnectTimeoutRef.current = setTimeout(async () => {
            isReconnectingRef.current = false;
            await connectToRoom(userCredentialsRef.current!, true);
        }, delay);
    };

    const connectToRoom = async ({ userName, avatar }: { userName: string, avatar: string }, isReconnect = false) => {
        // Сохраняем учетные данные для переподключения
        userCredentialsRef.current = { userName, avatar };
        
        if (refWS.current?.readyState === WebSocket.OPEN) {
            refWS.current.close();
        }

        // Получаем токен для авторизованных пользователей
        let wsUrl = `${WS_URL}?roomId=${roomId}&userName=${encodeURIComponent(userName)}&avatar=${encodeURIComponent(avatar)}`;
        
        // Если токен еще не получен или это не переподключение, пытаемся получить токен
        if (!authTokenRef.current && !isReconnect) {
            try {
                const response = await fetch(`${API_PREFIX}/auth/ws-token`, {
                    credentials: "include",
                });
                const data = await response.json();
                if (data.success && data.token) {
                    authTokenRef.current = data.token;
                }
            } catch (err) {
                // Игнорируем ошибки, пользователь может играть без авторизации
                console.log('Failed to get WS token, playing without auth:', err);
            }
        }

        // Добавляем токен в URL если он есть
        if (authTokenRef.current) {
            wsUrl += `&authToken=${encodeURIComponent(authTokenRef.current)}`;
        }

        refWS.current = new WebSocket(wsUrl);
        
        refWS.current.onopen = () => {
            setIsConnected(true);
            setConnectionLost(false);
            reconnectAttemptsRef.current = 0; // Сбрасываем счетчик попыток при успешном подключении
            isReconnectingRef.current = false; // Сбрасываем флаг переподключения
            lastPongTimeRef.current = Date.now(); // Обновляем время последнего pong
            console.log(isReconnect ? 'Reconnected to room:' : 'Connected to room:', roomId);
            startConnectionCheck();
        };

        refWS.current.onclose = (event) => {
            setIsConnected(false);
            console.log('Disconnected from room', event.code, event.reason);
            clearConnectionCheck();
            
            // Если это не было намеренное закрытие (код 1000), пытаемся переподключиться
            if (event.code !== 1000 && userCredentialsRef.current && reconnectAttemptsRef.current < 5) {
                handleReconnection();
            }
        };

        refWS.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            clearConnectionCheck();
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
        clearConnectionCheck();
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        reconnectAttemptsRef.current = 0;
        userCredentialsRef.current = null;
        if (refWS.current) {
            refWS.current.close(1000, 'User disconnect'); // 1000 = нормальное закрытие
        }
    };

    // Очистка при размонтировании компонента
    useEffect(() => {
        return () => {
            clearConnectionCheck();
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, []);

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
        // Обновляем currentColorMove сразу после отправки хода
        // Ход переходит к оппоненту, поэтому меняем цвет на противоположный текущему
        setGameState((prev) => {
            const nextColor = prev.currentColor === "white" ? "black" : "white";
            setCurrentColorMove(nextColor as FigureColor);
            return {
                ...prev,
                currentColor: nextColor,
                currentPlayer: nextColor
            };
        });
        sendMessage({ type: 'move', moveData });
    };

    const sendCursorPosition = (position: CursorPosition) => {
        sendMessage({ 
            type: 'cursor',
            position,
            screenSize: { width: window.innerWidth, height: window.innerHeight }
        });
    };

    // TODO: fix type
    const sendGameResult = (gameResult: any) => {
        console.log('sendGameResult', gameResult);
        sendMessage({ type: 'gameResult', gameResult });
    };

    const sendDrawOffer = (action: 'offer' | 'accept' | 'decline') => {
        if (action === 'accept' || action === 'decline') setOfferedDraw(false);
        sendMessage({ type: 'drawOffer', action });
    };

    const sendResignation = () => {
        sendMessage({ type: 'resign' });
    };

    return {
        // Состояние
        isConnected,
        connectionLost,
        gameState,
        currentColorMove,
        userColor,
        opponentColor,
        opponentName,
        systemMessages,
        chatMessages,
        opponentCursor,
        timer,

        offeredDraw,
        resultMessage,

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
