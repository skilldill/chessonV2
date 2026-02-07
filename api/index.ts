import { Elysia, t } from 'elysia';
import { connectDB } from './config/database';
import { ElysiaWS } from 'elysia/ws';
import { v4 as uuidv4 } from 'uuid';
import { INITIAL_FEN } from './constants/chess';
import { User } from './models/User';
import { RegistrationAttempt } from './models/RegistrationAttempt';
import { Game } from './models/Game';
import { hashPassword, comparePassword } from './utils/password';
import { createToken, verifyToken } from './utils/jwt';
import { getClientIP } from './utils/ip';
import mongoose from 'mongoose';

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
    registeredUserId?: mongoose.Types.ObjectId; // ID зарегистрированного пользователя из базы данных
    gameStartedAt?: Date; // Время начала игры для этого пользователя
};

type Room = {
    users: Map<string, UserData>;
    gameState: GameState;
    firstPlayerColor?: "white" | "black"; // Цвет для первого подключившегося игрока
    gameStartedAt?: Date; // Время начала игры
    hasMobilePlayer?: boolean; // Есть ли мобильный игрок в комнате
};

const rooms = new Map<string, Room>();
const roomTimers = new Map<string, NodeJS.Timeout>();
const roomLastActivity = new Map<string, number>(); // Время последней активности комнаты
const userMessageCounts = new Map<string, { count: number, resetAt: number }>(); // Rate limiting для пользователей

// Метрики для мониторинга
const metrics = {
  activeRooms: 0,
  activeConnections: 0,
  totalMessages: 0,
  messagesPerSecond: 0,
  roomsCreated: 0,
  roomsCleaned: 0,
  lastCleanup: Date.now()
};

// Константы для конфигурации
const ROOM_TTL = 24 * 60 * 60 * 1000; // 24 часа без активности
const CLEANUP_INTERVAL = 60 * 60 * 1000; // Проверка каждый час
const RATE_LIMIT_WINDOW = 1000; // 1 секунда
const RATE_LIMIT_MAX_MESSAGES = 100; // Максимум сообщений в секунду
const METRICS_RESET_INTERVAL = 1000; // Сброс счетчика сообщений в секунду каждую секунду

// Функция для проверки rate limit
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = userMessageCounts.get(userId);
  
  if (!limit || now > limit.resetAt) {
    userMessageCounts.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (limit.count > RATE_LIMIT_MAX_MESSAGES) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Функция для очистки неактивных комнат
function cleanupInactiveRooms() {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [roomId, lastActivity] of roomLastActivity) {
    const room = rooms.get(roomId);
    
    // Проверяем TTL
    if (now - lastActivity > ROOM_TTL) {
      // Очищаем таймер если есть
      clearRoomTimer(roomId);
      
      // Закрываем все WebSocket соединения
      if (room) {
        for (const [_, userData] of room.users) {
          if (userData.isConnected && userData.ws) {
            try {
              userData.ws.send({
                system: true,
                message: "Room expired due to inactivity",
                type: "roomExpired"
              });
              userData.ws.close();
            } catch (e) {
              // Игнорируем ошибки при закрытии
            }
          }
        }
      }
      
      // Удаляем комнату
      rooms.delete(roomId);
      roomLastActivity.delete(roomId);
      cleanedCount++;
    } else if (room) {
      // Проверяем, есть ли активные соединения
      let hasActiveConnections = false;
      for (const [_, userData] of room.users) {
        if (userData.isConnected) {
          hasActiveConnections = true;
          break;
        }
      }
      
      // Если нет активных соединений и игра завершена, можно удалить раньше
      if (!hasActiveConnections && room.gameState.gameEnded) {
        clearRoomTimer(roomId);
        rooms.delete(roomId);
        roomLastActivity.delete(roomId);
        cleanedCount++;
      }
    }
  }
  
  if (cleanedCount > 0) {
    metrics.roomsCleaned += cleanedCount;
    console.log(`Cleaned up ${cleanedCount} inactive rooms`);
  }
  
  metrics.lastCleanup = now;
  updateMetrics();
}

// Функция для обновления метрик
function updateMetrics() {
  let activeConnections = 0;
  let activeRooms = 0;
  
  for (const [_, room] of rooms) {
    let hasActiveUsers = false;
    for (const [_, userData] of room.users) {
      if (userData.isConnected) {
        activeConnections++;
        hasActiveUsers = true;
      }
    }
    if (hasActiveUsers) {
      activeRooms++;
    }
  }
  
  metrics.activeRooms = activeRooms;
  metrics.activeConnections = activeConnections;
}

// Функция для обновления времени последней активности комнаты
function updateRoomActivity(roomId: string) {
  roomLastActivity.set(roomId, Date.now());
}

// Функция для сохранения игры в базу данных
async function saveGameToDatabase(room: Room, roomId: string) {
  try {
    // Проверяем, что игра завершена и началась
    if (!room.gameState.gameStarted || !room.gameState.gameEnded || !room.gameState.gameResult) {
      return;
    }

    // Находим игроков
    let whitePlayer: UserData | null = null;
    let blackPlayer: UserData | null = null;

    for (const [_, userData] of room.users) {
      if (userData.color === "white") {
        whitePlayer = userData;
      } else if (userData.color === "black") {
        blackPlayer = userData;
      }
    }

    // Если нет обоих игроков, не сохраняем
    if (!whitePlayer || !blackPlayer) {
      return;
    }

    // Получаем начальную FEN
    // Если есть история ходов, пытаемся определить начальную позицию
    // Для стандартной игры это INITIAL_FEN, для кастомной - позиция до первого хода
    let initialFEN: string;
    if (room.gameState.moveHistory.length > 0) {
      // Если есть история, предполагаем стандартную игру с INITIAL_FEN
      // (в будущем можно добавить поле initialFEN в Room для точности)
      initialFEN = INITIAL_FEN;
    } else {
      // Если нет истории ходов, начальная позиция = текущая (игра завершилась без ходов)
      initialFEN = room.gameState.currentFEN;
    }

    // Фильтруем moveHistory, оставляя только нужные поля и убирая лишние из figure
    const filteredMoveHistory = room.gameState.moveHistory.map(move => ({
      FEN: move.FEN,
      from: move.from,
      to: move.to,
      figure: {
        color: move.figure.color,
        type: move.figure.type
      }
    }));

    console.log(`📝 Saving game: roomId=${roomId}, moveHistory length=${filteredMoveHistory.length}`);

    // Проверяем, не сохранена ли уже игра с таким roomId
    const existingGame = await Game.findOne({ roomId: roomId });
    
    if (existingGame) {
      // Если игра уже существует, не обновляем её - данные уже сохранены
      // Это предотвращает перезапись данных при реконнекте клиента
      console.log(`⏭️ Game already exists in database: roomId=${roomId}, skipping save to prevent data overwrite`);
      return;
    }
    
      // Создаем новую запись игры только если её еще нет
    // Создаем новую запись игры
      const gameData = {
        roomId: roomId,
        whitePlayer: {
          userId: whitePlayer.registeredUserId || undefined,
          userName: whitePlayer.userName,
          avatar: whitePlayer.avatar
        },
        blackPlayer: {
          userId: blackPlayer.registeredUserId || undefined,
          userName: blackPlayer.userName,
          avatar: blackPlayer.avatar
        },
        initialFEN: initialFEN,
        finalFEN: room.gameState.currentFEN,
        moveHistory: filteredMoveHistory,
        result: room.gameState.gameResult,
        timer: room.gameState.timer,
        startedAt: room.gameStartedAt || new Date(),
        endedAt: new Date(),
        hasMobilePlayer: room.hasMobilePlayer || false
      };

      // Сохраняем в базу данных
      const game = new Game(gameData);
      await game.save();
      
      console.log(`✅ Game saved to database: roomId=${roomId}, result=${gameData.result.resultType}, moveHistory length=${game.moveHistory?.length || 0}`);
  } catch (error) {
    console.error('❌ Failed to save game to database:', error);
    // Не прерываем выполнение, если сохранение не удалось
  }
}

// Запускаем периодическую очистку неактивных комнат
setInterval(() => {
  cleanupInactiveRooms();
}, CLEANUP_INTERVAL);

// Сброс счетчика сообщений в секунду для метрик
let messageCountInSecond = 0;
setInterval(() => {
  metrics.messagesPerSecond = messageCountInSecond;
  messageCountInSecond = 0;
}, METRICS_RESET_INTERVAL);

// Функция для синхронизации currentColor с currentPlayer
function syncCurrentColor(room: Room) {
    room.gameState.currentColor = room.gameState.currentPlayer;
}

// Функция для извлечения текущего игрока из FEN
// FEN формат: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
// Вторая часть (после первого пробела) указывает, чей ход: 'w' для белых, 'b' для черных
function getCurrentPlayerFromFEN(fen: string): "white" | "black" {
    const parts = fen.split(' ');
    if (parts.length < 2) {
        return "white"; // По умолчанию белые
    }
    const activeColor = parts[1].toLowerCase();
    return activeColor === 'b' ? "black" : "white";
}

// Функция для извлечения позиции из FEN (без счетчиков ходов и полуходов)
// FEN формат: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
// Для троекратного повторения важны только первые 4 части: позиция, чей ход, права на рокировку, взятие на проходе
function extractPositionFromFEN(fen: string): string {
    const parts = fen.split(' ');
    // Берем первые 4 части: позиция, чей ход, права на рокировку, взятие на проходе
    return parts.slice(0, 4).join(' ');
}

// Функция для проверки троекратного повторения позиции
function checkThreefoldRepetition(room: Room): boolean {
    if (room.gameState.moveHistory.length < 2) {
        // Нужно минимум 2 хода для троекратного повторения
        return false;
    }

    // Извлекаем текущую позицию (без счетчиков)
    const currentPosition = extractPositionFromFEN(room.gameState.currentFEN);
    
    // Подсчитываем, сколько раз встречалась эта позиция в истории
    // Текущая позиция уже добавлена в moveHistory как последний элемент
    let repetitionCount = 0;
    
    // Проверяем все позиции в истории ходов (включая только что добавленную)
    for (const move of room.gameState.moveHistory) {
        const movePosition = extractPositionFromFEN(move.FEN);
        if (movePosition === currentPosition) {
            repetitionCount++;
        }
    }
    
    // Если позиция встречается 3 или более раз - это троекратное повторение
    return repetitionCount >= 3;
}

// Функция для объявления ничьей по троекратному повторению
function declareDrawByThreefoldRepetition(room: Room, roomId: string) {
    room.gameState.gameEnded = true;
    room.gameState.gameResult = {
        resultType: "draw"
    };
    
    // Очищаем таймер комнаты
    clearRoomTimer(roomId);
    
    // Сохраняем игру в базу данных
    saveGameToDatabase(room, roomId);
    
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
                message: "Threefold repetition! Draw by rule!",
                type: "gameEnd"
            });
        }
    }
}

// Функция для подсчета фигур на доске из FEN позиции
function countPieces(fenPosition: string): { white: { [piece: string]: number }, black: { [piece: string]: number } } {
    const pieces = {
        white: { K: 0, Q: 0, R: 0, B: 0, N: 0, P: 0 },
        black: { k: 0, q: 0, r: 0, b: 0, n: 0, p: 0 }
    };
    
    // Парсим FEN позицию (первая часть до пробела)
    const positionPart = fenPosition.split(' ')[0];
    
    // Проходим по каждому символу позиции
    for (const char of positionPart) {
        if (char === '/') continue; // Пропускаем разделители рядов
        
        // Если это цифра, пропускаем пустые клетки
        if (char >= '1' && char <= '8') continue;
        
        // Подсчитываем белые фигуры (заглавные)
        if (char === 'K') pieces.white.K++;
        else if (char === 'Q') pieces.white.Q++;
        else if (char === 'R') pieces.white.R++;
        else if (char === 'B') pieces.white.B++;
        else if (char === 'N') pieces.white.N++;
        else if (char === 'P') pieces.white.P++;
        
        // Подсчитываем черные фигуры (строчные)
        else if (char === 'k') pieces.black.k++;
        else if (char === 'q') pieces.black.q++;
        else if (char === 'r') pieces.black.r++;
        else if (char === 'b') pieces.black.b++;
        else if (char === 'n') pieces.black.n++;
        else if (char === 'p') pieces.black.p++;
    }
    
    return pieces;
}

// Функция для проверки недостаточного материала (ничья)
function checkInsufficientMaterial(room: Room): boolean {
    const fen = room.gameState.currentFEN;
    const pieces = countPieces(fen);
    
    // Подсчитываем общее количество фигур каждого цвета (исключая королей)
    const whitePiecesCount = pieces.white.Q + pieces.white.R + pieces.white.B + pieces.white.N + pieces.white.P;
    const blackPiecesCount = pieces.black.q + pieces.black.r + pieces.black.b + pieces.black.n + pieces.black.p;
    
    // Проверка 1: Только короли у обоих игроков
    if (whitePiecesCount === 0 && blackPiecesCount === 0) {
        return true;
    }
    
    // Проверка 2: У одного только король, у другого король + конь
    // Белые: только король, черные: король + конь
    if (whitePiecesCount === 0 && blackPiecesCount === 1 && pieces.black.n === 1) {
        return true;
    }
    
    // Черные: только король, белые: король + конь
    if (blackPiecesCount === 0 && whitePiecesCount === 1 && pieces.white.N === 1) {
        return true;
    }
    
    return false;
}

// Функция для объявления ничьей по недостаточному материалу
function declareDrawByInsufficientMaterial(room: Room, roomId: string) {
    room.gameState.gameEnded = true;
    room.gameState.gameResult = {
        resultType: "draw"
    };
    
    // Очищаем таймер комнаты
    clearRoomTimer(roomId);
    
    // Сохраняем игру в базу данных
    saveGameToDatabase(room, roomId);
    
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
                message: "Insufficient material! Draw by rule!",
                type: "gameEnd"
            });
        }
    }
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

// Функция для безопасной очистки таймера комнаты
function clearRoomTimer(roomId: string) {
  const timer = roomTimers.get(roomId);
  if (timer) {
    try {
      clearInterval(timer);
    } catch (e) {
      console.error(`Error clearing timer for room ${roomId}:`, e);
    }
    roomTimers.delete(roomId);
  }
}

// Функция для создания таймера комнаты
function createRoomTimer(roomId: string) {
  // Очищаем существующий таймер если есть
  clearRoomTimer(roomId);

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

        // Очищаем таймер
        clearRoomTimer(roomId);

        // Сохраняем игру в базу данных
        saveGameToDatabase(room, roomId);

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

        // Очищаем таймер
        clearRoomTimer(roomId);

        // Сохраняем игру в базу данных
        saveGameToDatabase(room, roomId);

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

// Auth endpoints
// Регистрация пользователя
app.post('/api/auth/signup', async ({ body, request, set }) => {
  try {
    const { login, password } = body;

    // Валидация входных данных
    if (!login || !password) {
      return {
        success: false,
        error: 'Login and password are required'
      };
    }

    if (login.length < 3 || login.length > 20) {
      return {
        success: false,
        error: 'Login must be between 3 and 20 characters'
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters'
      };
    }

    // Проверка уникальности логина
    const existingUser = await User.findOne({ login: login.toLowerCase() });
    if (existingUser) {
      return {
        success: false,
        error: 'Login already exists'
      };
    }

    // Проверка IP - можно зарегистрироваться только один раз в день
    const clientIP = getClientIP(request);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Начало дня

    const lastRegistration = await RegistrationAttempt.findOne({
      ip: clientIP,
      lastRegistrationDate: { $gte: today }
    });

    if (lastRegistration) {
      return {
        success: false,
        error: 'You can register only once per day from this IP address'
      };
    }

    // Хешируем пароль
    const hashedPassword = await hashPassword(password);

    // Создаем пользователя
    const user = new User({
      login: login.toLowerCase(),
      password: hashedPassword
    });

    await user.save();

    // Сохраняем информацию о регистрации по IP
    await RegistrationAttempt.findOneAndUpdate(
      { ip: clientIP },
      {
        ip: clientIP,
        lastRegistrationDate: new Date()
      },
      { upsert: true, new: true }
    );

    // Создаем токен
    const userId = (user._id as mongoose.Types.ObjectId).toString();
    const token = await createToken({
      userId: userId,
      login: user.login
    });

    // Сохраняем токен в cookie
    set.headers['Set-Cookie'] = `authToken=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: userId,
        login: user.login
      }
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.message || 'Registration failed'
    };
  }
}, {
  body: t.Object({
    login: t.String(),
    password: t.String()
  })
});

// Логин пользователя
app.post('/api/auth/login', async ({ body, request, set }) => {
  try {
    const { login, password } = body;

    // Валидация входных данных
    if (!login || !password) {
      return {
        success: false,
        error: 'Login and password are required'
      };
    }

    // Ищем пользователя
    const user = await User.findOne({ login: login.toLowerCase() });
    if (!user) {
      return {
        success: false,
        error: 'Invalid login or password'
      };
    }

    // Проверяем пароль
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Invalid login or password'
      };
    }

    // Создаем токен
    const userId = (user._id as mongoose.Types.ObjectId).toString();
    const token = await createToken({
      userId: userId,
      login: user.login
    });

    // Сохраняем токен в cookie
    set.headers['Set-Cookie'] = `authToken=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: userId,
        login: user.login
      }
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message || 'Login failed'
    };
  }
}, {
  body: t.Object({
    login: t.String(),
    password: t.String()
  })
});

// Проверка текущего пользователя
app.get('/api/auth/me', async ({ headers }) => {
  try {
    const cookieHeader = headers.cookie || '';
    const cookies = cookieHeader.split(';').reduce((acc: Record<string, string>, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {});

    const authToken = cookies.authToken;
    if (!authToken) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    const payload = await verifyToken(authToken);
    if (!payload) {
      return {
        success: false,
        error: 'Invalid token'
      };
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      user: {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        login: user.login
      }
    };
  } catch (error: any) {
    console.error('Auth check error:', error);
    return {
      success: false,
      error: error.message || 'Authentication check failed'
    };
  }
});

// Выход из системы
app.post('/api/auth/logout', ({ set }) => {
  // Удаляем cookie, устанавливая его с истекшим сроком действия
  set.headers['Set-Cookie'] = 'authToken=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0';
  return {
    success: true,
    message: 'Logged out successfully'
  };
});

// Metrics endpoint
app.get('/api/metrics', () => {
  updateMetrics();
  return {
    ...metrics,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };
});

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
  // Если currentFEN не передан, пустой или null, используем INITIAL_FEN для обычной игры
  const currentFEN = (timerConfig.currentFEN && timerConfig.currentFEN.trim()) 
    ? timerConfig.currentFEN 
    : INITIAL_FEN;
  // Цвет для первого подключившегося игрока (необязательный)
  const firstPlayerColor = (timerConfig.color === "white" || timerConfig.color === "black") 
    ? timerConfig.color 
    : undefined;

  // {"whiteTimer":60,"blackTimer":60,"increment":5,"currentFEN":"...","color":"white"}
  console.log('TIMER CONFIG BODY', body);
  console.log('TIMER CONFIG', timerConfig);

  // Определяем текущего игрока из FEN
  const currentPlayer = getCurrentPlayerFromFEN(currentFEN);

  // Create empty room with initial game state
  const room = { 
    users: new Map(),
    gameState: {
      currentFEN: currentFEN, // Используем переданный FEN или начальную позицию
      moveHistory: [],
      currentPlayer: currentPlayer,
      currentColor: currentPlayer,
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
    },
    firstPlayerColor: firstPlayerColor,
    hasMobilePlayer: undefined // Будет установлено при подключении мобильного игрока
  };
  rooms.set(roomId, room);
  updateRoomActivity(roomId);
  metrics.roomsCreated++;
  updateMetrics();
  
  console.log('ROOM CREATED WITH TIMER:', room.gameState.timer);
  console.log('ROOM ID:', roomId);
  console.log('ROOM CREATED WITH FEN:', currentFEN);
  
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
  
  updateRoomActivity(roomId);
  
  return {
    gameState: room.gameState
  };
});

// Get games by player ID endpoint - игры конкретного пользователя
// Важно: этот роут должен быть объявлен ПЕРЕД /api/games/:id
app.get('/api/games/player/:id', async ({ params, query }) => {
  try {
    const { id } = params;

    // Проверяем валидность ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return {
        success: false,
        error: 'Invalid user ID'
      };
    }

    const userId = new mongoose.Types.ObjectId(id);

    // Получаем параметры пагинации
    const pageParam = typeof query === 'object' && query !== null && 'page' in query ? query.page : undefined;
    const limitParam = typeof query === 'object' && query !== null && 'limit' in query ? query.limit : undefined;
    const page = parseInt(String(pageParam || '1')) || 1;
    const limit = Math.min(parseInt(String(limitParam || '20')) || 20, 100); // Максимум 100 игр за раз
    const skip = (page - 1) * limit;

    // Строим запрос для игр пользователя
    const queryFilter = {
      $or: [
        { 'whitePlayer.userId': userId },
        { 'blackPlayer.userId': userId }
      ]
    };

    // Получаем игры с пагинацией
    const games = await Game.find(queryFilter)
      .sort({ endedAt: -1 }) // Новые игры сначала
      .skip(skip)
      .limit(limit)
      .lean();

    // Получаем общее количество игр пользователя
    const total = await Game.countDocuments(queryFilter);

    // Преобразуем ObjectId в строки для ответа
    const gamesResponse = games.map(game => {
      // Проверяем moveHistory
      const moveHistory = Array.isArray(game.moveHistory) ? game.moveHistory : [];
      console.log(`📖 Reading game: roomId=${game.roomId}, moveHistory length=${moveHistory.length}`);
      
      return {
        id: (game._id as mongoose.Types.ObjectId).toString(),
        roomId: game.roomId,
        whitePlayer: {
          userId: game.whitePlayer?.userId ? (game.whitePlayer.userId as mongoose.Types.ObjectId).toString() : null,
          userName: game.whitePlayer?.userName,
          avatar: game.whitePlayer?.avatar
        },
        blackPlayer: {
          userId: game.blackPlayer?.userId ? (game.blackPlayer.userId as mongoose.Types.ObjectId).toString() : null,
          userName: game.blackPlayer?.userName,
          avatar: game.blackPlayer?.avatar
        },
        initialFEN: game.initialFEN,
        finalFEN: game.finalFEN,
        moveHistory: moveHistory, // Пустой массив, если ходов не было
        result: game.result,
        timer: game.timer,
        startedAt: game.startedAt,
        endedAt: game.endedAt,
        hasMobilePlayer: game.hasMobilePlayer,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt
      };
    });

    return {
      success: true,
      games: gamesResponse,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error: any) {
    console.error('Get player games error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get player games'
    };
  }
}, {
  query: t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String())
  })
});

// Get games endpoint - список всех игр
app.get('/api/games', async ({ query }) => {
  try {
    // Получаем параметры пагинации
    const pageParam = typeof query === 'object' && query !== null && 'page' in query ? query.page : undefined;
    const limitParam = typeof query === 'object' && query !== null && 'limit' in query ? query.limit : undefined;
    const hasMobilePlayerParam = typeof query === 'object' && query !== null && 'hasMobilePlayer' in query ? query.hasMobilePlayer : undefined;
    const page = parseInt(String(pageParam || '1')) || 1;
    const limit = Math.min(parseInt(String(limitParam || '20')) || 20, 100); // Максимум 100 игр за раз
    const skip = (page - 1) * limit;

    // Формируем фильтр запроса
    const filter: any = {};
    if (hasMobilePlayerParam !== undefined) {
      const hasMobilePlayerValue = String(hasMobilePlayerParam).toLowerCase() === 'true';
      filter.hasMobilePlayer = hasMobilePlayerValue;
    }

    // Получаем все игры с пагинацией
    const games = await Game.find(filter)
      .sort({ endedAt: -1 }) // Новые игры сначала
      .skip(skip)
      .limit(limit)
      .lean();

    // Получаем общее количество игр
    const total = await Game.countDocuments(filter);

    // Преобразуем ObjectId в строки для ответа
    const gamesResponse = games.map(game => ({
      id: (game._id as mongoose.Types.ObjectId).toString(),
      roomId: game.roomId,
      whitePlayer: {
        userId: game.whitePlayer?.userId ? (game.whitePlayer.userId as mongoose.Types.ObjectId).toString() : null,
        userName: game.whitePlayer?.userName,
        avatar: game.whitePlayer?.avatar
      },
      blackPlayer: {
        userId: game.blackPlayer?.userId ? (game.blackPlayer.userId as mongoose.Types.ObjectId).toString() : null,
        userName: game.blackPlayer?.userName,
        avatar: game.blackPlayer?.avatar
      },
      initialFEN: game.initialFEN,
      finalFEN: game.finalFEN,
      moveHistory: Array.isArray(game.moveHistory) ? game.moveHistory : [],
      result: game.result,
      timer: game.timer,
      startedAt: game.startedAt,
      endedAt: game.endedAt,
      hasMobilePlayer: game.hasMobilePlayer,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt
    }));

    return {
      success: true,
      games: gamesResponse,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error: any) {
    console.error('Get games error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get games'
    };
  }
}, {
  query: t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    hasMobilePlayer: t.Optional(t.String())
  })
});

// Delete all games endpoint - очистка всех игр (для тестирования)
// app.delete('/api/games', async () => {
//   try {
//     const result = await Game.deleteMany({});
    
//     console.log(`🗑️ Deleted ${result.deletedCount} games from database`);
    
//     return {
//       success: true,
//       message: `Successfully deleted ${result.deletedCount} games`,
//       deletedCount: result.deletedCount
//     };
//   } catch (error: any) {
//     console.error('Delete games error:', error);
//     return {
//       success: false,
//       error: error.message || 'Failed to delete games'
//     };
//   }
// });



// Get game by ID endpoint - одна игра по ID
app.get('/api/games/:id', async ({ params }) => {
  try {
    const { id } = params;

    // Проверяем валидность ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return {
        success: false,
        error: 'Invalid game ID'
      };
    }

    const game = await Game.findById(id).lean();

    if (!game) {
      return {
        success: false,
        error: 'Game not found'
      };
    }

    // Преобразуем ObjectId в строки для ответа
    const gameResponse = {
      id: (game._id as mongoose.Types.ObjectId).toString(),
      roomId: game.roomId,
      whitePlayer: {
        userId: game.whitePlayer?.userId ? (game.whitePlayer.userId as mongoose.Types.ObjectId).toString() : null,
        userName: game.whitePlayer?.userName,
        avatar: game.whitePlayer?.avatar
      },
      blackPlayer: {
        userId: game.blackPlayer?.userId ? (game.blackPlayer.userId as mongoose.Types.ObjectId).toString() : null,
        userName: game.blackPlayer?.userName,
        avatar: game.blackPlayer?.avatar
      },
      initialFEN: game.initialFEN,
      finalFEN: game.finalFEN,
      moveHistory: game.moveHistory,
      result: game.result,
      timer: game.timer,
      startedAt: game.startedAt,
      endedAt: game.endedAt,
      hasMobilePlayer: game.hasMobilePlayer,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt
    };

    return {
      success: true,
      game: gameResponse
    };
  } catch (error: any) {
    console.error('Get game error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get game'
    };
  }
});

app.ws('/ws/room', {
  query: t.Object({
      roomId: t.String(),
      userName: t.String(),
      avatar: t.String(),
      currentFEN: t.Optional(t.String()),
      color: t.Optional(t.Union([t.Literal("white"), t.Literal("black")])),
      authToken: t.Optional(t.String()), // Опциональный токен аутентификации
      hasMobilePlayer: t.Optional(t.String()) // Необязательный параметр для указания мобильного подключения (строка "true" или "1")
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
      const { roomId, userName, avatar, currentFEN: queryFEN, color: queryColor, authToken, hasMobilePlayer: queryHasMobilePlayer } = ws.data.query;

      // Преобразуем строку "true" или "1" в boolean для hasMobilePlayer
      const hasMobilePlayer: boolean = queryHasMobilePlayer === "true" || queryHasMobilePlayer === "1";

      // Получаем registeredUserId из токена (асинхронно, но не блокируем подключение)
      let registeredUserId: mongoose.Types.ObjectId | undefined;
      if (authToken) {
        verifyToken(authToken).then(payload => {
          if (payload && payload.userId) {
            registeredUserId = new mongoose.Types.ObjectId(payload.userId);
            // Обновляем registeredUserId в данных пользователя, если он уже подключен
            const room = rooms.get(roomId);
            if (room) {
              for (const [userId, userData] of room.users) {
                if (userData.userName === userName && !userData.registeredUserId) {
                  userData.registeredUserId = registeredUserId;
                }
              }
            }
          }
        }).catch(() => {
          // Игнорируем ошибки токена, пользователь может играть без регистрации
        });
      }

      let room = rooms.get(roomId);

      console.log('ROOM ID:', roomId);
      console.log('ROOM FOUND:', !!room);
      console.log('ROOM', room?.gameState);

      if (!room) {
          console.log('ROOM NOT DEFINED - CREATING NEW ROOM WITH DEFAULT TIMERS');  

          // Если currentFEN не передан, пустой или null, используем INITIAL_FEN для обычной игры
          const currentFEN = (queryFEN && queryFEN.trim()) 
            ? queryFEN 
            : INITIAL_FEN;
          
          // Цвет для первого подключившегося игрока (необязательный)
          const firstPlayerColor = (queryColor === "white" || queryColor === "black") 
            ? queryColor 
            : undefined;
          
          // Определяем текущего игрока из FEN
          const currentPlayer = getCurrentPlayerFromFEN(currentFEN);

          room = {
            users: new Map(),
            gameState: {
              currentFEN: currentFEN,
              moveHistory: [],
              currentPlayer: currentPlayer,
              currentColor: currentPlayer,
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
            },
            firstPlayerColor: firstPlayerColor,
            hasMobilePlayer: hasMobilePlayer ? true : undefined
          };
          rooms.set(roomId, room);
          updateRoomActivity(roomId);
          metrics.roomsCreated++;
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
          // Сохраняем registeredUserId если он был установлен ранее или получаем новый
          const currentRegisteredUserId = existingUserData?.registeredUserId || registeredUserId;
          room.users.set(existingUserId, {
              userName: userName,
              avatar: avatar,
              ws: ws,
              isConnected: true,
              color: existingUserData?.color,
              cursorPosition: existingUserData?.cursorPosition,
              registeredUserId: currentRegisteredUserId,
              gameStartedAt: existingUserData?.gameStartedAt
          });

          // Устанавливаем hasMobilePlayer если пользователь переподключился с мобильного приложения
          if (hasMobilePlayer) {
              room.hasMobilePlayer = true;
          }

          updateRoomActivity(roomId);
          updateMetrics();

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

      // Назначаем цвет пользователю
      let assignedColor: "white" | "black";
      if (room.users.size === 0) {
        // Если это первый пользователь и указан цвет при создании комнаты, используем его
        // Иначе назначаем случайный цвет
        assignedColor = room.firstPlayerColor ?? assignRandomColor();
      } else {
        // Если уже есть пользователь, назначаем противоположный цвет
        const existingUserColor = room.users.get(Array.from(room.users.keys())[0] as string)?.color;
        assignedColor = existingUserColor === "white" ? "black" : "white";
      }

      // Сохраняем данные нового пользователя в комнате
      room.users.set(userId, {
          userName: userName,
          avatar: avatar,
          ws: ws,
          isConnected: true,
          color: assignedColor,
          cursorPosition: { x: 0, y: 0 },
          registeredUserId: registeredUserId
      });

      // Устанавливаем hasMobilePlayer если пользователь подключился с мобильного приложения
      if (hasMobilePlayer) {
          room.hasMobilePlayer = true;
      }

      updateRoomActivity(roomId);
      updateMetrics();

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
          room.gameStartedAt = new Date(); // Сохраняем время начала игры
          
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

      // Rate limiting - проверяем лимит сообщений
      if (!checkRateLimit(senderUserId)) {
          ws.send({ 
              system: true, 
              message: "Too many messages. Please slow down.",
              type: "rateLimitExceeded"
          });
          return;
      }

      // Обновляем метрики и активность комнаты
      metrics.totalMessages++;
      messageCountInSecond++;
      updateRoomActivity(roomId);

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

          // Проверяем троекратное повторение позиции
          if (checkThreefoldRepetition(room)) {
              declareDrawByThreefoldRepetition(room, roomId);
              return; // Прерываем обработку, игра завершена
          }

          // Проверяем недостаточный материал (ничья)
          if (checkInsufficientMaterial(room)) {
              declareDrawByInsufficientMaterial(room, roomId);
              return; // Прерываем обработку, игра завершена
          }

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
    clearRoomTimer(roomId);

          // Сохраняем игру в базу данных
          saveGameToDatabase(room, roomId);

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
    clearRoomTimer(roomId);

              // Сохраняем игру в базу данных
              saveGameToDatabase(room, roomId);

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
    clearRoomTimer(roomId);

          // Сохраняем игру в базу данных
          saveGameToDatabase(room, roomId);

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
      clearRoomTimer(roomId);
    }

    updateMetrics();
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

app.listen(PORT);
console.log(`Server is running on port ${PORT}`);