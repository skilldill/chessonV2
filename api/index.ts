import { Elysia, t } from 'elysia';
import { connectDB } from './config/database';
import { ElysiaWS } from 'elysia/ws';
import { v4 as uuidv4 } from 'uuid';

// Connect to MongoDB
if (process.env.WITHOUT_MONGO !== 'true') {
  connectDB();
}

const DEFAULT_TIME_SECONDS = 600;

const app = new Elysia();

// Функция для генерации коротких уникальных ID
function generateShortId(): string {
  // Генерируем UUID и берем случайные части для создания короткого ID
  const uuid = uuidv4().replace(/-/g, '');
  
  // Берем части UUID и комбинируем их для создания короткого уникального ID
  const part1 = uuid.substring(0, 8);
  const part2 = uuid.substring(8, 16);
  const part3 = uuid.substring(16, 24);
  
  // Конвертируем каждую часть в base36 и объединяем
  const short1 = parseInt(part1, 16).toString(36);
  const short2 = parseInt(part2, 16).toString(36);
  const short3 = parseInt(part3, 16).toString(36);
  
  // Объединяем и берем первые 8 символов для компактности
  return (short1 + short2 + short3).substring(0, 8);
}

// Функция для назначения случайного цвета игроку
function assignRandomColor(): "white" | "black" {
  const colors: ("white" | "black")[] = ["white", "black"];
  return colors[Math.floor(Math.random() * colors.length)];
}

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

type GameResult = {
    resultType: "mat" | "pat" | "draw" | "resignation";
    winColor?: "white" | "black";
};

type DrawOffer = {
    from: string;
    to: string;
    status: "pending" | "accepted" | "declined";
};

type TimerState = {
    whiteTime: number; // время в секундах
    blackTime: number; // время в секундах
    whiteIncrement?: number; // добавка времени за ход в секундах
    blackIncrement?: number; // добавка времени за ход в секундах
    initialWhiteTime: number; // изначальное время белых в секундах
    initialBlackTime: number; // изначальное время черных в секундах
};

type PlayerInfo = {
    userId: string;
    userName: string;
    avatar: string;
    color: "white" | "black";
};

type GameState = {
    currentFEN: string;
    moveHistory: MoveData[];
    currentPlayer: "white" | "black";
    currentColor: "white" | "black"; // чей ход
    gameStarted: boolean;
    gameEnded: boolean;
    gameResult?: GameResult;
    drawOffer?: DrawOffer;
    drawOfferCount: { [userId: string]: number };
    timer?: TimerState;
    player?: PlayerInfo;
    opponent?: PlayerInfo;
};

type UserData = {
    userName: string;
    avatar: string;
    ws: ElysiaWS<any, any>;
    isConnected: boolean;
    color?: "white" | "black";
    cursorPosition?: CursorPosition;
};

type Room = {
    users: Map<string, UserData>;
    gameState: GameState;
};

const rooms = new Map<string, Room>();
const roomTimers = new Map<string, NodeJS.Timeout>();

// Функция для синхронизации currentColor с currentPlayer
function syncCurrentColor(room: Room) {
    room.gameState.currentColor = room.gameState.currentPlayer;
}

// Функция для получения персонализированного gameState для конкретного игрока
function getPersonalizedGameState(room: Room, userId: string): GameState {
    const userData = room.users.get(userId);
    if (!userData) {
        // Если пользователь не найден, возвращаем базовый gameState без player/opponent
        return { ...room.gameState };
    }

    const userColor = userData.color;
    if (!userColor) {
        // Если у пользователя нет цвета, возвращаем базовый gameState
        return { ...room.gameState };
    }

    // Находим соперника
    const opponent = Array.from(room.users.entries()).find(
        ([id, user]) => id !== userId && user.color && user.color !== userColor
    );

    if (!opponent) {
        // Если соперник не найден, возвращаем gameState только с player
        return {
            ...room.gameState,
            player: {
                userId: userId,
                userName: userData.userName,
                avatar: userData.avatar,
                color: userColor
            }
        };
    }

    const [opponentUserId, opponentUserData] = opponent;

    // Создаем персонализированный gameState
    return {
        ...room.gameState,
        player: {
            userId: userId,
            userName: userData.userName,
            avatar: userData.avatar,
            color: userColor
        },
        opponent: {
            userId: opponentUserId,
            userName: opponentUserData.userName,
            avatar: opponentUserData.avatar,
            color: opponentUserData.color!
        }
    };
}

// Функция для создания таймера комнаты
function createRoomTimer(roomId: string) {
  // Очищаем существующий таймер если есть
  const existingTimer = roomTimers.get(roomId);
  if (existingTimer) {
    clearInterval(existingTimer);
  }

  // Создаем новый таймер
  const timer = setInterval(() => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState.timer || room.gameState.gameEnded || !room.gameState.gameStarted) {
      return;
    }

    const { timer: timerState, currentPlayer } = room.gameState;
    
    // Уменьшаем время текущего игрока
    if (currentPlayer === "white") {
      timerState.whiteTime--;
      if (timerState.whiteTime < 0) {
        // Время белых истекло - черные выиграли
        room.gameState.gameEnded = true;
        room.gameState.gameResult = {
          resultType: "resignation",
          winColor: "black"
        };

        // Отправляем результат всем игрокам
        for (const [id, userData] of room.users) {
          if (userData.isConnected && userData.ws) {
            userData.ws.send({
              type: "gameResult",
              gameResult: room.gameState.gameResult,
              gameState: getPersonalizedGameState(room, id),
              time: Date.now()
            });
          }
        }

        // Отправляем системное сообщение
        for (const [id, userData] of room.users) {
          if (userData.isConnected && userData.ws) {
            userData.ws.send({
              system: true,
              message: "White's time expired! Black wins!",
              type: "gameEnd"
            });
          }
        }

        // Очищаем таймер
        clearInterval(timer);
        roomTimers.delete(roomId);
        return;
      }
    } else {
      timerState.blackTime--;
      if (timerState.blackTime < 0) {
        // Время черных истекло - белые выиграли
        room.gameState.gameEnded = true;
        room.gameState.gameResult = {
          resultType: "resignation",
          winColor: "white"
        };

        // Отправляем результат всем игрокам
        for (const [id, userData] of room.users) {
          if (userData.isConnected && userData.ws) {
            userData.ws.send({
              type: "gameResult",
              gameResult: room.gameState.gameResult,
              gameState: getPersonalizedGameState(room, id),
              time: Date.now()
            });
          }
        }

        // Отправляем системное сообщение
        for (const [id, userData] of room.users) {
          if (userData.isConnected && userData.ws) {
            userData.ws.send({
              system: true,
              message: "Black's time expired! White wins!",
              type: "gameEnd"
            });
          }
        }

        // Очищаем таймер
        clearInterval(timer);
        roomTimers.delete(roomId);
        return;
      }
    }

    // Отправляем обновленное время всем игрокам
    for (const [id, userData] of room.users) {
      if (userData.isConnected && userData.ws) {
        userData.ws.send({
          type: "timerTick",
          timer: timerState,
          currentPlayer: currentPlayer,
          time: Date.now()
        });
      }
    }
  }, 1000); // Каждую секунду

  roomTimers.set(roomId, timer);
}

// Healthcheck endpoint
app.get('/api/health', () => ({
  status: 'ok',
  timestamp: new Date().toISOString()
}));

// Create room endpoint
app.post('/api/rooms', async ({ body }) => {
  // Generate unique room ID using short format
  const roomId = generateShortId();
  
  // Извлекаем конфигурацию таймеров или используем значения по умолчанию
  // В Elysia body может быть строкой или объектом, поэтому парсим если нужно
  let timerConfig: any = {};
  if (typeof body === 'string') {
    try {
      timerConfig = JSON.parse(body);
    } catch (e) {
      timerConfig = {};
    }
  } else if (body && typeof body === 'object') {
    timerConfig = body;
  }
  
  const whiteTimer = timerConfig.whiteTimer ?? DEFAULT_TIME_SECONDS;
  const blackTimer = timerConfig.blackTimer ?? DEFAULT_TIME_SECONDS;
  const increment = timerConfig.increment ?? 0;

  // {"whiteTimer":60,"blackTimer":60,"increment":5}
  console.log('TIMER CONFIG BODY', body);
  console.log('TIMER CONFIG', timerConfig);

  // console.log(body, whiteTime, blackTime, increment);

  // Create empty room with initial game state
  const room = { 
    users: new Map(),
    gameState: {
      currentFEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Starting position
      moveHistory: [],
      currentPlayer: "white" as "white" | "black",
      currentColor: "white" as "white" | "black",
      gameStarted: false,
      gameEnded: false,
      gameResult: undefined,
      drawOffer: undefined,
      drawOfferCount: {},
      timer: {
        whiteTime: whiteTimer,
        blackTime: blackTimer,
        whiteIncrement: increment,
        blackIncrement: increment,
        initialWhiteTime: whiteTimer,
        initialBlackTime: blackTimer,
      }
    }
  };
  rooms.set(roomId, room);
  
  console.log('ROOM CREATED WITH TIMER:', room.gameState.timer);
  console.log('ROOM ID:', roomId);
  
  return {
    success: true,
    roomId,
    message: 'Room created successfully',
    timerConfig: {
      whiteTimer: whiteTimer,
      blackTimer: blackTimer,
      increment: increment,
    }
  };
});

// Get room state endpoint
app.get('/api/rooms/:roomId', async ({ params }) => {
  const { roomId } = params;
  const room = rooms.get(roomId);
  
  if (!room) {
    return {
      success: false,
      error: 'Room not found'
    };
  }
  
  return {
    gameState: room.gameState
  };
});

app.ws('/ws/room', {
  query: t.Object({
      roomId: t.String(),
      userName: t.String(),
      avatar: t.String()
  }),

  body: t.Union([
    t.Object({
      type: t.Literal("cursor"),
      position: t.Union([
        t.Object({
          x: t.Number(),
          y: t.Number()
        }),
        t.Array(t.Object({
          x: t.Number(),
          y: t.Number()
        }))
      ]),
      screenSize: t.Object({
        width: t.Number(),
        height: t.Number()
      })
    }),
    t.Object({
      type: t.Literal("message"),
      message: t.String()
    }),
    t.Object({
      type: t.Literal("move"),
      moveData: t.Object({
        FEN: t.String(),
        from: t.Tuple([t.Number(), t.Number()]),
        to: t.Tuple([t.Number(), t.Number()]),
        figure: t.Object({
          color: t.Union([t.Literal("white"), t.Literal("black")]),
          type: t.Union([
            t.Literal("pawn"),
            t.Literal("bishop"),
            t.Literal("knight"),
            t.Literal("rook"),
            t.Literal("queen"),
            t.Literal("king")
          ])
        })
      })
    }),
    t.Object({
      type: t.Literal("gameResult"),
      gameResult: t.Object({
        resultType: t.Union([
          t.Literal("mat"),
          t.Literal("pat"),
          t.Literal("draw"),
          t.Literal("resignation")
        ]),
        winColor: t.Optional(t.Union([
          t.Literal("white"),
          t.Literal("black")
        ]))
      })
    }),
    t.Object({
      type: t.Literal("drawOffer"),
      action: t.Union([
        t.Literal("offer"),
        t.Literal("accept"),
        t.Literal("decline")
      ])
    }),
    t.Object({
      type: t.Literal("resign")
    }),
    t.Object({
      type: t.Literal("timerTick")
    })
  ]),

  open(ws) {
      const { roomId, userName, avatar } = ws.data.query;

      let room = rooms.get(roomId);

      console.log('ROOM ID:', roomId);
      console.log('ROOM FOUND:', !!room);
      console.log('ROOM', room?.gameState);

      if (!room) {
          console.log('ROOM NOT DEFINED - CREATING NEW ROOM WITH DEFAULT TIMERS');  

          room = {
            users: new Map(),
            gameState: {
              currentFEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
              moveHistory: [],
              currentPlayer: "white" as "white" | "black",
              currentColor: "white" as "white" | "black",
              gameStarted: false,
              gameEnded: false,
              gameResult: undefined,
              drawOffer: undefined,
              drawOfferCount: {},
              timer: {
                whiteTime: DEFAULT_TIME_SECONDS, // 10 минут по умолчанию
                blackTime: DEFAULT_TIME_SECONDS, // 10 минут по умолчанию
                whiteIncrement: 0, // без добавки времени
                blackIncrement: 0, // без добавки времени
                initialWhiteTime: DEFAULT_TIME_SECONDS, // 10 минут по умолчанию
                initialBlackTime: DEFAULT_TIME_SECONDS // 10 минут по умолчанию
              }
            }
          };
          rooms.set(roomId, room);
      }

      // Проверяем, есть ли уже пользователь с таким именем в комнате
      let existingUserId: string | null = null;
      for (const [userId, userData] of room.users) {
          if (userData.userName === userName) {
              existingUserId = userId;
              break;
          }
      }

      // Если пользователь с таким именем уже есть, заменяем его соединение
      if (existingUserId) {
          const existingUserData = room.users.get(existingUserId);
          if (existingUserData) {
              // Закрываем старое соединение
              existingUserData.ws.close();
          }
          
          // Обновляем данные пользователя с новым WebSocket
          room.users.set(existingUserId, {
              userName: userName,
              avatar: avatar,
              ws: ws,
              isConnected: true,
              color: existingUserData?.color,
              cursorPosition: existingUserData?.cursorPosition
          });

          // Приветствие для вернувшегося пользователя
          ws.send({ 
            system: true, 
            message: `Welcome back to room ${roomId}, ${userName}! Your ID: ${existingUserId}`,
            type: "reconnection",
            gameState: getPersonalizedGameState(room, existingUserId),
            userColor: existingUserData?.color
          });

          // Отправляем текущее состояние таймера если игра идет
          if (room.gameState.gameStarted && !room.gameState.gameEnded && room.gameState.timer) {
            ws.send({
              type: "timerTick",
              timer: room.gameState.timer,
              currentPlayer: room.gameState.currentPlayer,
              time: Date.now()
            });
            
            // Убеждаемся, что таймер комнаты работает
            if (!roomTimers.has(roomId)) {
              createRoomTimer(roomId);
            }
          }

          // Уведомляем других пользователей о возвращении
          for (const [id, userData] of room.users) {
              if (id !== existingUserId) {
                  userData.ws.send({ system: true, message: `${userName} rejoined the room` });
              }
          }
          return;
      }

      // Если уже 2 участника → не пускаем
      if (room.users.size >= 2) {
          ws.send({ system: true, message: 'Room is full' });
          ws.close();
          return;
      }

      // Генерируем новый ID для нового пользователя
      const userId = generateShortId();

      // Назначаем цвет пользователю случайным образом
      const assignedColor = room.users.size === 0 ? assignRandomColor() : 
        room.users.get(Array.from(room.users.keys())[0] as string)?.color === "white" ? "black" : "white";

      // Сохраняем данные нового пользователя в комнате
      room.users.set(userId, {
          userName: userName,
          avatar: avatar,
          ws: ws,
          isConnected: true,
          color: assignedColor,
          cursorPosition: { x: 0, y: 0 }
      });

      // приветствие для нового пользователя
      ws.send({ 
        system: true, 
        message: `Welcome to room ${roomId}, ${userName}! Your ID: ${userId}`,
        type: "connection",
        userColor: assignedColor,
        gameState: getPersonalizedGameState(room, userId)
      });

      // Отправляем текущее состояние таймера если игра уже идет
      if (room.gameState.gameStarted && !room.gameState.gameEnded && room.gameState.timer) {
        ws.send({
          type: "timerTick",
          timer: room.gameState.timer,
          currentPlayer: room.gameState.currentPlayer,
          time: Date.now()
        });
      }

      // уведомляем других пользователей о подключении
      for (const [id, userData] of room.users) {
          if (id !== userId) {
              userData.ws.send({ 
                system: true, 
                message: `${userName} connected`,
                opponentColor: assignedColor
              });
          }
      }

      // Если теперь 2 игрока, начинаем игру
      if (room.users.size === 2) {
          room.gameState.gameStarted = true;
          
          // Запускаем таймер комнаты
          createRoomTimer(roomId);
          
          // Уведомляем всех игроков о начале игры
          for (const [id, userData] of room.users) {
              userData.ws.send({
                  system: true,
                  message: "Game started! White moves first.",
                  type: "gameStart",
                  gameState: getPersonalizedGameState(room, id)
              });
          }
      }
  },

  message(ws, data) {
      const { roomId } = ws.data.query;
      const room = rooms.get(roomId);
      if (!room) return;

      // Находим пользователя по WebSocket соединению
      let senderUserId: string | null = null;
      let senderUserData: UserData | null = null;
      
      for (const [userId, userData] of room.users) {
          if (userData.userName === ws.data.query.userName) {
              senderUserId = userId;
              senderUserData = userData;
              break;
          }
      }

      if (!senderUserId || !senderUserData) return;

      // Обрабатываем различные типы сообщений
      if (data.type === "message") {
          // Обычное текстовое сообщение
          for (const [id, userData] of room.users) {
              if (id !== senderUserId && userData.isConnected && userData.ws) {
                  userData.ws.send({
                      type: "message",
                      from: senderUserData.userName,
                      userId: senderUserId,
                      message: data.message,
                      time: Date.now()
                  });
              }
          }
      } else if (data.type === "move") {
          // Шахматный ход
          if (!room.gameState.gameStarted) {
              ws.send({ system: true, message: "Game has not started yet" });
              return;
          }

          if (room.gameState.gameEnded) {
              ws.send({ system: true, message: "Game is already finished" });
              return;
          }

          // Проверяем, что ход делает правильный игрок
          if (senderUserData.color !== room.gameState.currentPlayer) {
              ws.send({ system: true, message: "Not your turn!" });
              return;
          }

          // Обновляем состояние игры
          room.gameState.currentFEN = data.moveData.FEN;
          room.gameState.moveHistory.push(data.moveData);
          
          // Добавляем время за ход (increment) если есть
          if (room.gameState.timer) {
            if (senderUserData.color === "white" && room.gameState.timer.whiteIncrement) {
              room.gameState.timer.whiteTime += room.gameState.timer.whiteIncrement;
            } else if (senderUserData.color === "black" && room.gameState.timer.blackIncrement) {
              room.gameState.timer.blackTime += room.gameState.timer.blackIncrement;
            }
          }
          
          // Меняем ход
          room.gameState.currentPlayer = room.gameState.currentPlayer === "white" ? "black" : "white";
          // Обновляем currentColor синхронно с currentPlayer
          syncCurrentColor(room);

          // Отправляем ход всем игрокам кроме отправителя
          for (const [id, userData] of room.users) {
              if (id !== senderUserId && userData.isConnected && userData.ws) {
                  userData.ws.send({
                      type: "move",
                      moveData: data.moveData,
                      from: senderUserData.userName,
                      userId: senderUserId,
                      gameState: getPersonalizedGameState(room, id),
                      time: Date.now()
                  });
              }
          }
      } else if (data.type === "cursor") {
          // Позиция курсора
          // Нормализуем position если он пришел как массив
          let position = data.position;
          if (Array.isArray(position)) {
              position = position[0] || { x: 0, y: 0 };
          }
          
          senderUserData.cursorPosition = position;

          // Отправляем позицию курсора другим игрокам
          for (const [id, userData] of room.users) {
              if (id !== senderUserId && userData.isConnected && userData.ws) {
                  userData.ws.send({
                      type: "cursor",
                      position: position,
                      screenSize: data.screenSize,
                      from: senderUserData.userName,
                      userId: senderUserId,
                      time: Date.now()
                  });
              }
          }
      } else if (data.type === "gameResult") {
          // Результат игры
          if (!room.gameState.gameStarted) {
              ws.send({ system: true, message: "Game has not started yet" });
              return;
          }

          if (room.gameState.gameEnded) {
              ws.send({ system: true, message: "Game is already finished" });
              return;
          }

          // Обновляем состояние игры
          room.gameState.gameEnded = true;
          room.gameState.gameResult = data.gameResult;
          
          // Очищаем таймер комнаты
          const timer = roomTimers.get(roomId);
          if (timer) {
            clearInterval(timer);
            roomTimers.delete(roomId);
          }

          // Отправляем результат всем игрокам
          for (const [id, userData] of room.users) {
              if (userData.isConnected && userData.ws) {
                  userData.ws.send({
                      type: "gameResult",
                      gameResult: data.gameResult,
                      from: senderUserData.userName,
                      userId: senderUserId,
                      gameState: getPersonalizedGameState(room, id),
                      time: Date.now()
                  });
              }
          }

          // Отправляем системное сообщение о результате
          let resultMessage = "";
          if (data.gameResult.resultType === "mat") {
              resultMessage = `Checkmate! ${data.gameResult.winColor === "white" ? "White" : "Black"} wins!`;
          } else if (data.gameResult.resultType === "pat") {
              resultMessage = "Stalemate! Draw!";
          } else if (data.gameResult.resultType === "draw") {
              resultMessage = "Draw!";
          } else if (data.gameResult.resultType === "resignation") {
              resultMessage = `Resignation! ${data.gameResult.winColor === "white" ? "White" : "Black"} wins!`;
          }

          for (const [id, userData] of room.users) {
              if (userData.isConnected && userData.ws) {
                  userData.ws.send({
                      system: true,
                      message: resultMessage,
                      type: "gameEnd"
                  });
              }
          }
      } else if (data.type === "drawOffer") {
          // Предложение ничьей
          if (!room.gameState.gameStarted) {
              ws.send({ system: true, message: "Game has not started yet" });
              return;
          }

          if (room.gameState.gameEnded) {
              ws.send({ system: true, message: "Game is already finished" });
              return;
          }

          if (data.action === "offer") {
              // Предложение ничьей
              if (room.gameState.drawOffer && room.gameState.drawOffer.status === "pending") {
                  ws.send({ system: true, message: "There is already an active draw offer" });
                  return;
              }

              // Проверяем лимит предложений ничьей (максимум 2 на игрока)
              const offerCount = room.gameState.drawOfferCount[senderUserId] || 0;
              if (offerCount >= 2) {
                  ws.send({ system: true, message: "You have exhausted the draw offer limit" });
                  return;
              }

              // Находим оппонента
              let opponentUserId: string | null = null;
              let opponentUserName: string | null = null;
              for (const [id, userData] of room.users) {
                  if (id !== senderUserId) {
                      opponentUserId = id;
                      opponentUserName = userData.userName;
                      break;
                  }
              }

              if (!opponentUserId || !opponentUserName) {
                  ws.send({ system: true, message: "Opponent not found" });
                  return;
              }

              // Создаем предложение ничьей
              room.gameState.drawOffer = {
                  from: senderUserId,
                  to: opponentUserId,
                  status: "pending"
              };

              // Увеличиваем счетчик предложений
              room.gameState.drawOfferCount[senderUserId] = offerCount + 1;

              // Отправляем предложение оппоненту
              const opponent = room.users.get(opponentUserId);
              if (opponent && opponent.ws) {
                  opponent.ws.send({
                      type: "drawOffer",
                      action: "offer",
                      from: senderUserData.userName,
                      userId: senderUserId,
                      gameState: getPersonalizedGameState(room, opponentUserId),
                      time: Date.now()
                  });
              }

              // Уведомляем отправителя
              ws.send({ 
                  system: true, 
                  message: `Draw offer sent to ${opponentUserName}` 
              });

          } else if (data.action === "accept") {
              // Принятие предложения ничьей
              if (!room.gameState.drawOffer || room.gameState.drawOffer.status !== "pending") {
                  ws.send({ system: true, message: "No active draw offer" });
                  return;
              }

              if (room.gameState.drawOffer.to !== senderUserId) {
                  ws.send({ system: true, message: "This offer is not for you" });
                  return;
              }

              // Обновляем статус предложения
              room.gameState.drawOffer.status = "accepted";

              // Завершаем игру ничьей
              room.gameState.gameEnded = true;
              room.gameState.gameResult = {
                  resultType: "draw"
              };
              
              // Очищаем таймер комнаты
              const timer = roomTimers.get(roomId);
              if (timer) {
                clearInterval(timer);
                roomTimers.delete(roomId);
              }

              // Отправляем результат всем игрокам
              for (const [id, userData] of room.users) {
                  if (userData.isConnected && userData.ws) {
                      userData.ws.send({
                          type: "gameResult",
                          gameResult: room.gameState.gameResult,
                          from: senderUserData.userName,
                          userId: senderUserId,
                          gameState: getPersonalizedGameState(room, id),
                          time: Date.now()
                      });
                  }
              }

              // Отправляем системное сообщение
              for (const [id, userData] of room.users) {
                  if (userData.isConnected && userData.ws) {
                      userData.ws.send({
                          system: true,
                          message: "Draw offer accepted! Game ended in a draw.",
                          type: "gameEnd"
                      });
                  }
              }

          } else if (data.action === "decline") {
              // Отклонение предложения ничьей
              if (!room.gameState.drawOffer || room.gameState.drawOffer.status !== "pending") {
                  ws.send({ system: true, message: "No active draw offer" });
                  return;
              }

              if (room.gameState.drawOffer.to !== senderUserId) {
                  ws.send({ system: true, message: "This offer is not for you" });
                  return;
              }

              // Обновляем статус предложения
              room.gameState.drawOffer.status = "declined";

              // Уведомляем отправителя предложения
              const offerSender = room.users.get(room.gameState.drawOffer.from);
              if (offerSender && offerSender.ws) {
                  offerSender.ws.send({
                      system: true,
                      message: `${senderUserData.userName} declined the draw offer`
                  });
              }

              // Уведомляем отклоняющего
              ws.send({ 
                  system: true, 
                  message: "Draw offer declined" 
              });

              // Очищаем предложение
              room.gameState.drawOffer = undefined;
          }

      } else if (data.type === "resign") {
          // Сдача
          if (!room.gameState.gameStarted) {
              ws.send({ system: true, message: "Game has not started yet" });
              return;
          }

          if (room.gameState.gameEnded) {
              ws.send({ system: true, message: "Game is already finished" });
              return;
          }

          // Определяем победителя (противоположный цвет)
          const winnerColor = senderUserData.color === "white" ? "black" : "white";

          // Завершаем игру сдачей
          room.gameState.gameEnded = true;
          room.gameState.gameResult = {
              resultType: "resignation",
              winColor: winnerColor
          };
          
          // Очищаем таймер комнаты
          const timer = roomTimers.get(roomId);
          if (timer) {
            clearInterval(timer);
            roomTimers.delete(roomId);
          }

          // Отправляем результат всем игрокам
          for (const [id, userData] of room.users) {
              if (userData.isConnected && userData.ws) {
                  userData.ws.send({
                      type: "gameResult",
                      gameResult: room.gameState.gameResult,
                      from: senderUserData.userName,
                      userId: senderUserId,
                      gameState: room.gameState,
                      time: Date.now()
                  });
              }
          }

          // Отправляем системное сообщение
          for (const [id, userData] of room.users) {
              if (userData.isConnected && userData.ws) {
                  userData.ws.send({
                      system: true,
                      message: `Resignation! ${winnerColor === "white" ? "White" : "Black"} wins!`,
                      type: "gameEnd"
                  });
              }
          }
      }
  },

  close(ws) {
    const { roomId } = ws.data.query;
    const room = rooms.get(roomId);
    if (!room) return;

    // Проверяем, остались ли подключенные игроки
    let connectedUsers = 0;
    for (const [_, userData] of room.users) {
      const { userName } = userData;

      if (userName !== ws.data.query.userName) {
        if (userData.isConnected) {
          connectedUsers++;
          userData.ws.send({ system: true, message: `${ws.data.query.userName} disconnected` });
        }
      } else {
        userData.isConnected = false;
      }
    }

    // Если остался только один игрок или никто, очищаем таймер
    if (connectedUsers <= 1) {
      const timer = roomTimers.get(roomId);
      if (timer) {
        clearInterval(timer);
        roomTimers.delete(roomId);
      }
    }
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

app.listen(PORT);
console.log(`Server is running on port ${PORT}`);