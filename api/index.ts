import { Elysia, t } from 'elysia';
import { connectDB } from './config/database';
import { ElysiaWS } from 'elysia/ws';
import { v4 as uuidv4 } from 'uuid';

// Connect to MongoDB
if (process.env.WITHOUT_MONGO !== 'true') {
  connectDB();
}

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

type GameState = {
    currentFEN: string;
    moveHistory: MoveData[];
    currentPlayer: "white" | "black";
    gameStarted: boolean;
    gameEnded: boolean;
    gameResult?: GameResult;
    drawOffer?: DrawOffer;
    drawOfferCount: { [userId: string]: number };
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

const rooms = new Map<string, Room>();

// Healthcheck endpoint
app.get('/api/health', () => ({
  status: 'ok',
  timestamp: new Date().toISOString()
}));

// Create room endpoint
app.post('/api/rooms', () => {
  // Generate unique room ID using short format
  const roomId = generateShortId();
  
  // Create empty room with initial game state
  const room = { 
    users: new Map(),
    gameState: {
      currentFEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Starting position
      moveHistory: [],
      currentPlayer: "white" as "white" | "black",
      gameStarted: false,
      gameEnded: false,
      gameResult: undefined,
      drawOffer: undefined,
      drawOfferCount: {}
    }
  };
  rooms.set(roomId, room);
  
  return {
    success: true,
    roomId,
    message: 'Комната успешно создана'
  };
});

app.ws('/ws/room', {
  query: t.Object({
      roomId: t.String(),
      userName: t.String()
  }),

  body: t.Union([
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
      type: t.Literal("cursor"),
      position: t.Object({
        x: t.Number(),
        y: t.Number()
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
    })
  ]),

  open(ws) {
      const { roomId, userName } = ws.data.query;

      let room = rooms.get(roomId);
      if (!room) {
          room = {
            users: new Map(),
            gameState: {
              currentFEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
              moveHistory: [],
              currentPlayer: "white" as "white" | "black",
              gameStarted: false,
              gameEnded: false,
              gameResult: undefined,
              drawOffer: undefined,
              drawOfferCount: {}
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
              ws: ws,
              isConnected: true,
              color: existingUserData?.color,
              cursorPosition: existingUserData?.cursorPosition
          });

          // Приветствие для вернувшегося пользователя
          ws.send({ 
            system: true, 
            message: `Добро пожаловать обратно в комнату ${roomId}, ${userName}! Ваш ID: ${existingUserId}`,
            type: "reconnection",
            gameState: room.gameState,
            userColor: existingUserData?.color
          });

          // Уведомляем других пользователей о возвращении
          for (const [id, userData] of room.users) {
              if (id !== existingUserId) {
                  userData.ws.send({ system: true, message: `${userName} вернулся в комнату` });
              }
          }
          return;
      }

      // Если уже 2 участника → не пускаем
      if (room.users.size >= 2) {
          ws.send({ system: true, message: 'Комната занята' });
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
          ws: ws,
          isConnected: true,
          color: assignedColor,
          cursorPosition: { x: 0, y: 0 }
      });

      // приветствие для нового пользователя
      ws.send({ 
        system: true, 
        message: `Добро пожаловать в комнату ${roomId}, ${userName}! Ваш ID: ${userId}`,
        type: "connection",
        userColor: assignedColor,
        gameState: room.gameState
      });

      // уведомляем других пользователей о подключении
      for (const [id, userData] of room.users) {
          if (id !== userId) {
              userData.ws.send({ 
                system: true, 
                message: `${userName} подключился`,
                opponentColor: assignedColor
              });
          }
      }

      // Если теперь 2 игрока, начинаем игру
      if (room.users.size === 2) {
          room.gameState.gameStarted = true;
          
          // Уведомляем всех игроков о начале игры
          for (const [id, userData] of room.users) {
              userData.ws.send({
                  system: true,
                  message: "Игра началась! Белые ходят первыми.",
                  type: "gameStart",
                  gameState: room.gameState
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
              ws.send({ system: true, message: "Игра еще не началась" });
              return;
          }

          if (room.gameState.gameEnded) {
              ws.send({ system: true, message: "Игра уже завершена" });
              return;
          }

          // Проверяем, что ход делает правильный игрок
          if (senderUserData.color !== room.gameState.currentPlayer) {
              ws.send({ system: true, message: "Не ваш ход!" });
              return;
          }

          // Обновляем состояние игры
          room.gameState.currentFEN = data.moveData.FEN;
          room.gameState.moveHistory.push(data.moveData);
          room.gameState.currentPlayer = room.gameState.currentPlayer === "white" ? "black" : "white";

          // Отправляем ход всем игрокам кроме отправителя
          for (const [id, userData] of room.users) {
              if (id !== senderUserId && userData.isConnected && userData.ws) {
                  userData.ws.send({
                      type: "move",
                      moveData: data.moveData,
                      from: senderUserData.userName,
                      userId: senderUserId,
                      gameState: room.gameState,
                      time: Date.now()
                  });
              }
          }
      } else if (data.type === "cursor") {
          // Позиция курсора
          senderUserData.cursorPosition = data.position;

          // Отправляем позицию курсора другим игрокам
          for (const [id, userData] of room.users) {
              if (id !== senderUserId && userData.isConnected && userData.ws) {
                  userData.ws.send({
                      type: "cursor",
                      position: data.position,
                      from: senderUserData.userName,
                      userId: senderUserId,
                      time: Date.now()
                  });
              }
          }
      } else if (data.type === "gameResult") {
          // Результат игры
          if (!room.gameState.gameStarted) {
              ws.send({ system: true, message: "Игра еще не началась" });
              return;
          }

          if (room.gameState.gameEnded) {
              ws.send({ system: true, message: "Игра уже завершена" });
              return;
          }

          // Обновляем состояние игры
          room.gameState.gameEnded = true;
          room.gameState.gameResult = data.gameResult;

          // Отправляем результат всем игрокам
          for (const [id, userData] of room.users) {
              if (userData.isConnected && userData.ws) {
                  userData.ws.send({
                      type: "gameResult",
                      gameResult: data.gameResult,
                      from: senderUserData.userName,
                      userId: senderUserId,
                      gameState: room.gameState,
                      time: Date.now()
                  });
              }
          }

          // Отправляем системное сообщение о результате
          let resultMessage = "";
          if (data.gameResult.resultType === "mat") {
              resultMessage = `Мат! Победили ${data.gameResult.winColor === "white" ? "белые" : "черные"}!`;
          } else if (data.gameResult.resultType === "pat") {
              resultMessage = "Пат! Ничья!";
          } else if (data.gameResult.resultType === "draw") {
              resultMessage = "Ничья!";
          } else if (data.gameResult.resultType === "resignation") {
              resultMessage = `Сдача! Победили ${data.gameResult.winColor === "white" ? "белые" : "черные"}!`;
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
              ws.send({ system: true, message: "Игра еще не началась" });
              return;
          }

          if (room.gameState.gameEnded) {
              ws.send({ system: true, message: "Игра уже завершена" });
              return;
          }

          if (data.action === "offer") {
              // Предложение ничьей
              if (room.gameState.drawOffer && room.gameState.drawOffer.status === "pending") {
                  ws.send({ system: true, message: "Уже есть активное предложение ничьей" });
                  return;
              }

              // Проверяем лимит предложений ничьей (максимум 2 на игрока)
              const offerCount = room.gameState.drawOfferCount[senderUserId] || 0;
              if (offerCount >= 2) {
                  ws.send({ system: true, message: "Вы исчерпали лимит предложений ничьей" });
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
                  ws.send({ system: true, message: "Оппонент не найден" });
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
                      gameState: room.gameState,
                      time: Date.now()
                  });
              }

              // Уведомляем отправителя
              ws.send({ 
                  system: true, 
                  message: `Предложение ничьей отправлено ${opponentUserName}` 
              });

          } else if (data.action === "accept") {
              // Принятие предложения ничьей
              if (!room.gameState.drawOffer || room.gameState.drawOffer.status !== "pending") {
                  ws.send({ system: true, message: "Нет активного предложения ничьей" });
                  return;
              }

              if (room.gameState.drawOffer.to !== senderUserId) {
                  ws.send({ system: true, message: "Это предложение не для вас" });
                  return;
              }

              // Обновляем статус предложения
              room.gameState.drawOffer.status = "accepted";

              // Завершаем игру ничьей
              room.gameState.gameEnded = true;
              room.gameState.gameResult = {
                  resultType: "draw"
              };

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
                          message: "Предложение ничьей принято! Игра завершена ничьей.",
                          type: "gameEnd"
                      });
                  }
              }

          } else if (data.action === "decline") {
              // Отклонение предложения ничьей
              if (!room.gameState.drawOffer || room.gameState.drawOffer.status !== "pending") {
                  ws.send({ system: true, message: "Нет активного предложения ничьей" });
                  return;
              }

              if (room.gameState.drawOffer.to !== senderUserId) {
                  ws.send({ system: true, message: "Это предложение не для вас" });
                  return;
              }

              // Обновляем статус предложения
              room.gameState.drawOffer.status = "declined";

              // Уведомляем отправителя предложения
              const offerSender = room.users.get(room.gameState.drawOffer.from);
              if (offerSender && offerSender.ws) {
                  offerSender.ws.send({
                      system: true,
                      message: `${senderUserData.userName} отклонил предложение ничьей`
                  });
              }

              // Уведомляем отклоняющего
              ws.send({ 
                  system: true, 
                  message: "Предложение ничьей отклонено" 
              });

              // Очищаем предложение
              room.gameState.drawOffer = undefined;
          }

      } else if (data.type === "resign") {
          // Сдача
          if (!room.gameState.gameStarted) {
              ws.send({ system: true, message: "Игра еще не началась" });
              return;
          }

          if (room.gameState.gameEnded) {
              ws.send({ system: true, message: "Игра уже завершена" });
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
                      message: `Сдача! Победили ${winnerColor === "white" ? "белые" : "черные"}!`,
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

    for (const [_, userData] of room.users) {
      const { userName } = userData;

      if (userName !== ws.data.query.userName) {
        userData.ws.send({ system: true, message: `${ws.data.query.userName} отключился` });
      } else {
        userData.isConnected = false;
      }
    }
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

app.listen(PORT);
console.log(`Server is running on port ${PORT}`);