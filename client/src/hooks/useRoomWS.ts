import { useRef, useState, useCallback } from "react";
import type { 
    WSServerMessage, 
    WSClientMessage, 
    GameState, 
    ChessColor, 
    MoveData, 
    CursorPosition, 
    GameResult 
} from "../types";

const WS_URL = 'ws://localhost:4000/ws/room';

export const useRoomWS = (roomId: string) => {
    const refWS = useRef<WebSocket | null>(null);
    const [gameState, setGameState] = useState<GameState>({
        currentFEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moveHistory: [],
        currentPlayer: "white",
        gameStarted: false,
        gameEnded: false,
        gameResult: undefined,
        drawOffer: undefined,
        drawOfferCount: {}
    });
    
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [userColor, setUserColor] = useState<ChessColor | undefined>(undefined);
    const [opponentColor, setOpponentColor] = useState<ChessColor | undefined>(undefined);
    const [opponentName, setOpponentName] = useState<string | undefined>(undefined);
    const [systemMessages, setSystemMessages] = useState<string[]>([]);
    const [opponentCursor, setOpponentCursor] = useState<CursorPosition | undefined>(undefined);

    const [chatMessages, setChatMessages] = useState<Array<{
        from: string;
        message: string;
        time: number;
        userId: string;
    }>>([]);

    const handleMessage = useCallback((data: WSServerMessage) => {
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
                }
                break;

            case 'cursor':
                if (data.position && data.from !== undefined) {
                    setOpponentCursor(data.position);
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

            default:
                // Обработка сообщений о подключении оппонента
                if (data.opponentColor && data.from) {
                    setOpponentColor(data.opponentColor);
                    setOpponentName(data.from);
                }
                break;
        }
    }, []);

    const connectToRoom = useCallback((userName: string) => {
        if (refWS.current?.readyState === WebSocket.OPEN) {
            refWS.current.close();
        }

        refWS.current = new WebSocket(`${WS_URL}?roomId=${roomId}&userName=${userName}`);
        
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
    }, [roomId, handleMessage]);

    const disconnect = useCallback(() => {
        if (refWS.current) {
            refWS.current.close();
        }
    }, []);

    const sendMessage = useCallback((message: WSClientMessage) => {
        if (refWS.current?.readyState === WebSocket.OPEN) {
            refWS.current.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not connected');
        }
    }, []);

    // Вспомогательные функции для отправки различных типов сообщений
    const sendChatMessage = useCallback((message: string) => {
        sendMessage({ type: 'message', message });
    }, [sendMessage]);

    const sendMove = useCallback((moveData: MoveData) => {
        sendMessage({ type: 'move', moveData });
    }, [sendMessage]);

    const sendCursorPosition = useCallback((position: CursorPosition) => {
        sendMessage({ type: 'cursor', position });
    }, [sendMessage]);

    const sendGameResult = useCallback((gameResult: GameResult) => {
        sendMessage({ type: 'gameResult', gameResult });
    }, [sendMessage]);

    const sendDrawOffer = useCallback((action: 'offer' | 'accept' | 'decline') => {
        sendMessage({ type: 'drawOffer', action });
    }, [sendMessage]);

    const sendResignation = useCallback(() => {
        sendMessage({ type: 'resign' });
    }, [sendMessage]);

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
        
        // Функции подключения
        connectToRoom,
        disconnect,
        
        // Функции отправки сообщений
        sendChatMessage,
        sendMove,
        sendCursorPosition,
        sendGameResult,
        sendDrawOffer,
        sendResignation,
        
        // Общая функция отправки
        sendMessage
    };
};
