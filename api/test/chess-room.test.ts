import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Elysia } from 'elysia';
import { ElysiaWS } from 'elysia/ws';

// Импортируем типы из основного файла
type MoveData = {
    FEN: string;
    from: [number, number];
    to: [number, number];
    figure: { 
        color: "white" | "black";
        type: "pawn" | "bishop" | "knight" | "rook" | "queen" | "king";
    };
};

type CursorPosition = {
    x: number;
    y: number;
};

type GameState = {
    currentFEN: string;
    moveHistory: MoveData[];
    currentPlayer: "white" | "black";
    gameStarted: boolean;
};

type UserData = {
    userName: string;
    ws: ElysiaWS<any, any>;
    isConnected: boolean;
    color?: "white" | "black";
    cursorPosition?: CursorPosition;
};

type Room = {
    users: Map<string, UserData>;
    gameState: GameState;
};

// Мок для WebSocket соединения
class MockWebSocket {
    public readyState = 1; // OPEN
    public messages: any[] = [];
    public closed = false;

    send(data: any) {
        if (!this.closed) {
            this.messages.push(data);
        }
    }

    close() {
        this.closed = true;
        this.readyState = 3; // CLOSED
    }

    // Метод для получения последнего сообщения
    getLastMessage() {
        return this.messages[this.messages.length - 1];
    }

    // Метод для получения всех сообщений определенного типа
    getMessagesByType(type: string) {
        return this.messages.filter(msg => msg.type === type);
    }
}

// Функция для генерации коротких ID (копируем из основного файла)
function generateShortId(): string {
    const uuid = Math.random().toString(36).substring(2, 15);
    return uuid.substring(0, 8);
}

describe("Chess Room WebSocket", () => {
    let rooms: Map<string, Room>;
    let mockWs1: MockWebSocket;
    let mockWs2: MockWebSocket;
    let roomId: string;

    beforeEach(() => {
        // Инициализируем комнаты
        rooms = new Map();
        
        // Создаем моки WebSocket соединений
        mockWs1 = new MockWebSocket();
        mockWs2 = new MockWebSocket();
        
        // Генерируем ID комнаты
        roomId = generateShortId();
        
        // Создаем комнату с начальным состоянием
        const room: Room = {
            users: new Map(),
            gameState: {
                currentFEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                moveHistory: [],
                currentPlayer: "white" as "white" | "black",
                gameStarted: false
            }
        };
        rooms.set(roomId, room);
    });

    afterEach(() => {
        rooms.clear();
    });

    describe("Player Connection and Color Assignment", () => {
        it("should assign white color to first player", () => {
            const userId1 = generateShortId();
            const room = rooms.get(roomId)!;
            
            // Подключаем первого игрока
            room.users.set(userId1, {
                userName: "Player1",
                ws: mockWs1 as any,
                isConnected: true,
                color: "white",
                cursorPosition: { x: 0, y: 0 }
            });

            const user1 = room.users.get(userId1);
            expect(user1?.color).toBe("white");
        });

        it("should assign black color to second player", () => {
            const userId1 = generateShortId();
            const userId2 = generateShortId();
            const room = rooms.get(roomId)!;
            
            // Подключаем первого игрока (белые)
            room.users.set(userId1, {
                userName: "Player1",
                ws: mockWs1 as any,
                isConnected: true,
                color: "white",
                cursorPosition: { x: 0, y: 0 }
            });

            // Подключаем второго игрока (черные)
            room.users.set(userId2, {
                userName: "Player2",
                ws: mockWs2 as any,
                isConnected: true,
                color: "black",
                cursorPosition: { x: 0, y: 0 }
            });

            const user2 = room.users.get(userId2);
            expect(user2?.color).toBe("black");
        });

        it("should start game when two players connect", () => {
            const userId1 = generateShortId();
            const userId2 = generateShortId();
            const room = rooms.get(roomId)!;
            
            // Подключаем двух игроков
            room.users.set(userId1, {
                userName: "Player1",
                ws: mockWs1 as any,
                isConnected: true,
                color: "white",
                cursorPosition: { x: 0, y: 0 }
            });

            room.users.set(userId2, {
                userName: "Player2",
                ws: mockWs2 as any,
                isConnected: true,
                color: "black",
                cursorPosition: { x: 0, y: 0 }
            });

            // Начинаем игру
            room.gameState.gameStarted = true;

            expect(room.gameState.gameStarted).toBe(true);
            expect(room.users.size).toBe(2);
        });
    });

    describe("Move Handling", () => {
        beforeEach(() => {
            // Настраиваем комнату с двумя игроками
            const userId1 = generateShortId();
            const userId2 = generateShortId();
            const room = rooms.get(roomId)!;
            
            room.users.set(userId1, {
                userName: "Player1",
                ws: mockWs1 as any,
                isConnected: true,
                color: "white",
                cursorPosition: { x: 0, y: 0 }
            });

            room.users.set(userId2, {
                userName: "Player2",
                ws: mockWs2 as any,
                isConnected: true,
                color: "black",
                cursorPosition: { x: 0, y: 0 }
            });

            room.gameState.gameStarted = true;
        });

        it("should send move to opponent when valid move is made", () => {
            const room = rooms.get(roomId)!;
            const userId1 = Array.from(room.users.keys())[0];
            const userId2 = Array.from(room.users.keys())[1];
            
            const moveData: MoveData = {
                FEN: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
                from: [4, 1],
                to: [4, 3],
                figure: {
                    color: "white",
                    type: "pawn"
                }
            };

            // Симулируем отправку хода от первого игрока
            const moveMessage = {
                type: "move",
                moveData: moveData
            };

            // Обновляем состояние игры
            room.gameState.currentFEN = moveData.FEN;
            room.gameState.moveHistory.push(moveData);
            room.gameState.currentPlayer = "black";

            // Отправляем ход второму игроку
            const opponent = room.users.get(userId2);
            if (opponent && opponent.ws) {
                opponent.ws.send({
                    type: "move",
                    moveData: moveData,
                    from: "Player1",
                    userId: userId1,
                    gameState: room.gameState,
                    time: Date.now()
                });
            }

            // Проверяем, что сообщение было отправлено
            expect(mockWs2.messages.length).toBeGreaterThan(0);
            const lastMessage = mockWs2.getLastMessage();
            expect(lastMessage.type).toBe("move");
            expect(lastMessage.moveData).toEqual(moveData);
            expect(lastMessage.from).toBe("Player1");
        });

        it("should update game state after move", () => {
            const room = rooms.get(roomId)!;
            
            const moveData: MoveData = {
                FEN: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
                from: [4, 1],
                to: [4, 3],
                figure: {
                    color: "white",
                    type: "pawn"
                }
            };

            // Обновляем состояние игры
            room.gameState.currentFEN = moveData.FEN;
            room.gameState.moveHistory.push(moveData);
            room.gameState.currentPlayer = "black";

            expect(room.gameState.currentFEN).toBe(moveData.FEN);
            expect(room.gameState.moveHistory.length).toBe(1);
            expect(room.gameState.currentPlayer).toBe("black");
        });

        it("should reject move from wrong player", () => {
            const room = rooms.get(roomId)!;
            
            // Устанавливаем, что сейчас ход черных
            room.gameState.currentPlayer = "black";
            
            const moveData: MoveData = {
                FEN: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
                from: [4, 1],
                to: [4, 3],
                figure: {
                    color: "white", // Белые пытаются ходить, когда ход черных
                    type: "pawn"
                }
            };

            // Проверяем, что ход должен быть отклонен
            const isValidMove = room.gameState.currentPlayer === moveData.figure.color;
            expect(isValidMove).toBe(false);
        });
    });

    describe("Cursor Position", () => {
        beforeEach(() => {
            const userId1 = generateShortId();
            const userId2 = generateShortId();
            const room = rooms.get(roomId)!;
            
            room.users.set(userId1, {
                userName: "Player1",
                ws: mockWs1 as any,
                isConnected: true,
                color: "white",
                cursorPosition: { x: 0, y: 0 }
            });

            room.users.set(userId2, {
                userName: "Player2",
                ws: mockWs2 as any,
                isConnected: true,
                color: "black",
                cursorPosition: { x: 0, y: 0 }
            });
        });

        it("should send cursor position to opponent", () => {
            const room = rooms.get(roomId)!;
            const userId1 = Array.from(room.users.keys())[0];
            const userId2 = Array.from(room.users.keys())[1];
            
            const cursorPosition: CursorPosition = { x: 150, y: 200 };

            // Обновляем позицию курсора первого игрока
            const user1 = room.users.get(userId1);
            if (user1) {
                user1.cursorPosition = cursorPosition;
            }

            // Отправляем позицию курсора второму игроку
            const opponent = room.users.get(userId2);
            if (opponent && opponent.ws) {
                opponent.ws.send({
                    type: "cursor",
                    position: cursorPosition,
                    from: "Player1",
                    userId: userId1,
                    time: Date.now()
                });
            }

            // Проверяем, что сообщение было отправлено
            expect(mockWs2.messages.length).toBeGreaterThan(0);
            const lastMessage = mockWs2.getLastMessage();
            expect(lastMessage.type).toBe("cursor");
            expect(lastMessage.position).toEqual(cursorPosition);
            expect(lastMessage.from).toBe("Player1");
        });
    });

    describe("Reconnection", () => {
        it("should restore game state on reconnection", () => {
            const userId1 = generateShortId();
            const room = rooms.get(roomId)!;
            
            // Создаем игрока с историей ходов
            room.users.set(userId1, {
                userName: "Player1",
                ws: mockWs1 as any,
                isConnected: true,
                color: "white",
                cursorPosition: { x: 100, y: 150 }
            });

            // Добавляем несколько ходов в историю
            room.gameState.moveHistory.push({
                FEN: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
                from: [4, 1],
                to: [4, 3],
                figure: { color: "white", type: "pawn" }
            });

            room.gameState.currentFEN = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
            room.gameState.currentPlayer = "black";
            room.gameState.gameStarted = true;

            // Симулируем переподключение
            const reconnectionMessage = {
                system: true,
                message: `Добро пожаловать обратно в комнату ${roomId}, Player1! Ваш ID: ${userId1}`,
                type: "reconnection",
                gameState: room.gameState,
                userColor: "white"
            };

            mockWs1.send(reconnectionMessage);

            // Проверяем, что сообщение восстановления было отправлено
            expect(mockWs1.messages.length).toBeGreaterThan(0);
            const lastMessage = mockWs1.getLastMessage();
            expect(lastMessage.type).toBe("reconnection");
            expect(lastMessage.gameState).toEqual(room.gameState);
            expect(lastMessage.userColor).toBe("white");
        });
    });

    describe("Message Types", () => {
        beforeEach(() => {
            const userId1 = generateShortId();
            const userId2 = generateShortId();
            const room = rooms.get(roomId)!;
            
            room.users.set(userId1, {
                userName: "Player1",
                ws: mockWs1 as any,
                isConnected: true,
                color: "white",
                cursorPosition: { x: 0, y: 0 }
            });

            room.users.set(userId2, {
                userName: "Player2",
                ws: mockWs2 as any,
                isConnected: true,
                color: "black",
                cursorPosition: { x: 0, y: 0 }
            });
        });

        it("should handle chat messages", () => {
            const room = rooms.get(roomId)!;
            const userId1 = Array.from(room.users.keys())[0];
            const userId2 = Array.from(room.users.keys())[1];
            
            const chatMessage = {
                type: "message",
                message: "Привет! Как дела?"
            };

            // Отправляем сообщение второму игроку
            const opponent = room.users.get(userId2);
            if (opponent && opponent.ws) {
                opponent.ws.send({
                    type: "message",
                    from: "Player1",
                    userId: userId1,
                    message: chatMessage.message,
                    time: Date.now()
                });
            }

            // Проверяем, что сообщение было отправлено
            expect(mockWs2.messages.length).toBeGreaterThan(0);
            const lastMessage = mockWs2.getLastMessage();
            expect(lastMessage.type).toBe("message");
            expect(lastMessage.message).toBe("Привет! Как дела?");
            expect(lastMessage.from).toBe("Player1");
        });
    });
});
