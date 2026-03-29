import { Elysia, t } from 'elysia';
import { connectDB } from './config/database';
import { ElysiaWS } from 'elysia/ws';
import { v4 as uuidv4 } from 'uuid';
import { INITIAL_FEN } from './constants/chess';
import { User } from './models/User';
import { Game } from './models/Game';
import { hashPassword, comparePassword } from './utils/password';
import { createToken, verifyToken } from './utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail, sendTestEmail } from './utils/email';
import { chessBot, type BotDifficulty } from './src/modules/chess-bot';
import mongoose from 'mongoose';
import crypto from 'crypto';

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
    withAIhints: boolean;
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
    clientId?: string;
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
    botSettings?: {
      enabled: boolean;
      difficulty: BotDifficulty;
      color?: "white" | "black";
      moveTimeMs: number;
      name: string;
      avatar: string;
      allowAIhints?: boolean;
    };
};

type RandomMatchQueueEntry = {
  userId: string;
  createdAt: number;
  timeKey: string;
};

type RandomMatchAssignment = {
  roomId: string;
  createdAt: number;
  timeKey: string;
};

const rooms = new Map<string, Room>();
const roomTimers = new Map<string, NodeJS.Timeout>();
const roomLastActivity = new Map<string, number>(); // Время последней активности комнаты
const userMessageCounts = new Map<string, { count: number, resetAt: number }>(); // Rate limiting для пользователей
const randomMatchQueueByTime = new Map<string, RandomMatchQueueEntry[]>();
const randomMatchUserToTimeKey = new Map<string, string>();
const randomMatchAssignments = new Map<string, RandomMatchAssignment>();
const botMoveInProgressRooms = new Set<string>();

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
const RANDOM_MATCH_QUEUE_ENTRY_TTL = 10 * 60 * 1000; // 10 минут
const RANDOM_MATCH_ASSIGNMENT_TTL = 10 * 60 * 1000; // 10 минут
const GUEST_CAT_WORDS = [
  "Mad",
  "Fury",
  "Good",
  "Big",
  "Small",
  "Swift",
  "Lucky",
  "Brave",
  "Calm",
  "Wild",
  "Sharp",
  "Rapid",
  "Bold",
  "Mighty",
  "Sneaky",
  "Quiet",
  "Storm",
  "Silver",
  "Golden",
  "Cosmic"
];
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5175',
  'http://127.0.0.1:5175'
];
const CORS_ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS.length > 0 ? CORS_ALLOWED_ORIGINS : DEFAULT_ALLOWED_ORIGINS;
const CORS_ALLOWED_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
const CORS_ALLOWED_HEADERS = 'Content-Type, Authorization, x-admin-secret';
const ADMIN_SECRET_HEADER = 'x-admin-secret';
const ADMIN_SECRET_VALUE = process.env.ADMIN_SECRET_VALUE || 'local-chesson-admin-secret';

function getHeaderValue(headers: unknown, headerName: string): string | undefined {
  if (!headers || typeof headers !== 'object') {
    return undefined;
  }

  const typedHeaders = headers as Record<string, string | undefined>;
  return typedHeaders[headerName] ?? typedHeaders[headerName.toLowerCase()];
}

function hasAdminAccess(headers: unknown): boolean {
  const receivedSecret = getHeaderValue(headers, ADMIN_SECRET_HEADER);
  return receivedSecret === ADMIN_SECRET_VALUE;
}

function clearAuthCookie(set: { headers: Record<string, string> }) {
  set.headers['Set-Cookie'] = 'authToken=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0';
}

function formatAdminUser(user: any, gamesPlayed = 0) {
  return {
    id: (user._id as mongoose.Types.ObjectId).toString(),
    login: user.login,
    email: user.email,
    name: user.name || null,
    avatar: user.avatar || '0',
    emailVerified: user.emailVerified,
    isBlocked: Boolean(user.isBlocked),
    blockedReason: user.blockedReason || null,
    blockedAt: user.blockedAt || null,
    gamesPlayed,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function buildCorsHeaders(origin?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': CORS_ALLOWED_METHODS,
    'Access-Control-Allow-Headers': CORS_ALLOWED_HEADERS,
    Vary: 'Origin'
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

app.onRequest(({ request, headers }) => {
  if (request.method !== 'OPTIONS') {
    return;
  }

  const origin = getHeaderValue(headers, 'origin');
  return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(origin)
  });
});

app.onAfterHandle(({ headers, set }) => {
  const origin = getHeaderValue(headers, 'origin');
  const corsHeaders = buildCorsHeaders(origin);

  for (const [key, value] of Object.entries(corsHeaders)) {
    set.headers[key] = value;
  }
});

function getOngoingGamesCount(): number {
  let count = 0;

  for (const [, room] of rooms) {
    if (room.gameState.gameStarted && !room.gameState.gameEnded) {
      count++;
    }
  }

  return count;
}

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

function getRandomMatchTimeConfig(rawTimeMinutes?: unknown, rawIncrementSeconds?: unknown) {
  const parsedTimeMinutes = Number(rawTimeMinutes);
  const parsedIncrementSeconds = Number(rawIncrementSeconds);

  const timeMinutes = Number.isFinite(parsedTimeMinutes) && parsedTimeMinutes > 0
    ? Math.min(Math.floor(parsedTimeMinutes), 120)
    : 10;
  const incrementSeconds = Number.isFinite(parsedIncrementSeconds) && parsedIncrementSeconds >= 0
    ? Math.min(Math.floor(parsedIncrementSeconds), 120)
    : 0;

  return { timeMinutes, incrementSeconds };
}

function getRandomMatchTimeKey(timeMinutes: number, incrementSeconds: number): string {
  return `${timeMinutes}+${incrementSeconds}`;
}

function getTotalRandomMatchQueueCount(): number {
  let total = 0;
  for (const queue of randomMatchQueueByTime.values()) {
    total += queue.length;
  }
  return total;
}

function cleanupRandomMatchState() {
  const now = Date.now();
  randomMatchUserToTimeKey.clear();

  for (const [timeKey, queue] of randomMatchQueueByTime.entries()) {
    const filteredQueue = queue.filter((entry) => now - entry.createdAt <= RANDOM_MATCH_QUEUE_ENTRY_TTL);

    if (filteredQueue.length === 0) {
      randomMatchQueueByTime.delete(timeKey);
    } else {
      randomMatchQueueByTime.set(timeKey, filteredQueue);
      for (const entry of filteredQueue) {
        randomMatchUserToTimeKey.set(entry.userId, timeKey);
      }
    }
  }

  for (const [userId, assignment] of randomMatchAssignments.entries()) {
    if (now - assignment.createdAt > RANDOM_MATCH_ASSIGNMENT_TTL) {
      randomMatchAssignments.delete(userId);
    }
  }
}

function removeUserFromRandomMatchQueue(userId: string) {
  const existingTimeKey = randomMatchUserToTimeKey.get(userId);
  if (!existingTimeKey) {
    return;
  }

  const queue = randomMatchQueueByTime.get(existingTimeKey);
  if (!queue) {
    randomMatchUserToTimeKey.delete(userId);
    return;
  }

  const filteredQueue = queue.filter((entry) => entry.userId !== userId);

  if (filteredQueue.length === 0) {
    randomMatchQueueByTime.delete(existingTimeKey);
  } else {
    randomMatchQueueByTime.set(existingTimeKey, filteredQueue);
  }

  randomMatchUserToTimeKey.delete(userId);
}

function parseTimerConfig(rawConfig: any) {
  const whiteTimer = Number(rawConfig?.whiteTimer ?? DEFAULT_TIME_SECONDS);
  const blackTimer = Number(rawConfig?.blackTimer ?? DEFAULT_TIME_SECONDS);
  const increment = Number(rawConfig?.increment ?? 0);

  const normalizedWhiteTimer = Number.isFinite(whiteTimer) && whiteTimer > 0 ? Math.floor(whiteTimer) : DEFAULT_TIME_SECONDS;
  const normalizedBlackTimer = Number.isFinite(blackTimer) && blackTimer > 0 ? Math.floor(blackTimer) : DEFAULT_TIME_SECONDS;
  const normalizedIncrement = Number.isFinite(increment) && increment >= 0 ? Math.floor(increment) : 0;

  const currentFEN = (rawConfig?.currentFEN && typeof rawConfig.currentFEN === 'string' && rawConfig.currentFEN.trim())
    ? rawConfig.currentFEN
    : INITIAL_FEN;
  const firstPlayerColor = (rawConfig?.color === "white" || rawConfig?.color === "black")
    ? rawConfig.color
    : undefined;
  const botEnabled = rawConfig?.vsBot === true || rawConfig?.vsBot === 'true';
  const forceDisableAIhints = rawConfig?.forceDisableAIhints === true || rawConfig?.forceDisableAIhints === 'true';
  const botDifficulty: BotDifficulty = rawConfig?.botDifficulty === 'super_easy' || rawConfig?.botDifficulty === 'easy' || rawConfig?.botDifficulty === 'hard'
    ? rawConfig.botDifficulty
    : 'medium';
  const botMoveTimeMsRaw = Number(rawConfig?.botMoveTimeMs ?? 800);
  const botMoveTimeMs = Number.isFinite(botMoveTimeMsRaw) && botMoveTimeMsRaw > 0
    ? Math.floor(botMoveTimeMsRaw)
    : 800;
  const withAIhints = forceDisableAIhints
    ? false
    : (botEnabled || rawConfig?.withAIhints === true || rawConfig?.withAIhints === 'true');

  return {
    whiteTimer: normalizedWhiteTimer,
    blackTimer: normalizedBlackTimer,
    increment: normalizedIncrement,
    currentFEN,
    firstPlayerColor,
    botEnabled,
    botDifficulty,
    botMoveTimeMs,
    withAIhints,
    forceDisableAIhints
  };
}

function buildUniqueUserNameInRoom(room: Room, requestedName: string): string {
  const trimmed = requestedName.trim();
  const baseName = trimmed || "Anonymous cat";

  const usedNames = new Set(
    Array.from(room.users.values()).map((user) => user.userName.toLowerCase())
  );

  if (!usedNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  const guestCandidates = GUEST_CAT_WORDS.map((word) => `${word} cat`);
  for (const candidate of guestCandidates) {
    if (!usedNames.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  let suffix = 2;
  while (usedNames.has(`${baseName} ${suffix}`.toLowerCase())) {
    suffix++;
  }

  return `${baseName} ${suffix}`;
}

function generateGuestCatName(excludedNames: Set<string> = new Set()): string {
  const candidates = GUEST_CAT_WORDS.map((word) => `${word} cat`);
  const normalizedExcluded = new Set(Array.from(excludedNames).map((name) => name.toLowerCase()));
  const available = candidates.filter((candidate) => !normalizedExcluded.has(candidate.toLowerCase()));

  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)] as string;
  }

  const fallbackBase = candidates[Math.floor(Math.random() * candidates.length)] as string;
  let suffix = 2;
  while (normalizedExcluded.has(`${fallbackBase} ${suffix}`.toLowerCase())) {
    suffix++;
  }
  return `${fallbackBase} ${suffix}`;
}

function createRoomWithConfig(rawConfig: any) {
  const roomId = generateShortId();
  const timerConfig = parseTimerConfig(rawConfig);
  const currentPlayer = getCurrentPlayerFromFEN(timerConfig.currentFEN);

  const room: Room = {
    users: new Map(),
    gameState: {
      currentFEN: timerConfig.currentFEN,
      moveHistory: [],
      currentPlayer: currentPlayer,
      currentColor: currentPlayer,
      withAIhints: timerConfig.withAIhints,
      gameStarted: false,
      gameEnded: false,
      gameResult: undefined,
      drawOffer: undefined,
      drawOfferCount: {},
      timer: {
        whiteTime: timerConfig.whiteTimer,
        blackTime: timerConfig.blackTimer,
        whiteIncrement: timerConfig.increment,
        blackIncrement: timerConfig.increment,
        initialWhiteTime: timerConfig.whiteTimer,
        initialBlackTime: timerConfig.blackTimer,
      }
    },
    firstPlayerColor: timerConfig.firstPlayerColor,
    hasMobilePlayer: undefined,
    botSettings: timerConfig.botEnabled ? {
      enabled: true,
      difficulty: timerConfig.botDifficulty,
      moveTimeMs: timerConfig.botMoveTimeMs,
      name: typeof rawConfig?.botName === 'string' && rawConfig.botName.trim()
        ? rawConfig.botName.trim()
        : 'Chesson Bot',
      avatar: '0',
      allowAIhints: !timerConfig.forceDisableAIhints
    } : undefined
  };

  rooms.set(roomId, room);
  updateRoomActivity(roomId);
  metrics.roomsCreated++;
  updateMetrics();

  return {
    roomId,
    room,
    timerConfig
  };
}

function parseCookiesFromHeader(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(';').reduce((acc: Record<string, string>, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

async function getAuthenticatedUserFromHeaders(headers: Record<string, string | undefined>) {
  const cookieHeader = headers.cookie || '';
  const cookies = parseCookiesFromHeader(cookieHeader);
  const authToken = cookies.authToken;

  if (!authToken) {
    return null;
  }

  const payload = await verifyToken(authToken);
  if (!payload?.userId) {
    return null;
  }

  const user = await User.findById(payload.userId);
  if (!user || (user as any).isBlocked) {
    return null;
  }

  return {
    userId: (user._id as mongoose.Types.ObjectId).toString(),
    userName: user.name || user.login,
    avatar: user.avatar || '0'
  };
}

function normalizeGuestId(guestIdRaw: unknown): string | null {
  if (typeof guestIdRaw !== 'string') {
    return null;
  }

  const guestId = guestIdRaw.trim();
  if (!guestId) {
    return null;
  }

  if (!/^[a-zA-Z0-9_-]{6,80}$/.test(guestId)) {
    return null;
  }

  return guestId;
}

async function getRandomMatchParticipant(headers: Record<string, string | undefined>, guestIdRaw?: unknown) {
  const authUser = await getAuthenticatedUserFromHeaders(headers);
  if (authUser) {
    return {
      participantId: `user:${authUser.userId}`,
      userName: authUser.userName,
      avatar: authUser.avatar
    };
  }

  const guestId = normalizeGuestId(guestIdRaw);
  if (!guestId) {
    return null;
  }

  return {
    participantId: `guest:${guestId}`,
    userName: 'Anonymous Cat',
    avatar: '0'
  };
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
    const withAIhints = room.gameState.withAIhints === true;
    const userData = room.users.get(userId);
    if (!userData) {
        // Если пользователь не найден, возвращаем базовый gameState без player/opponent
        return { ...room.gameState, withAIhints };
    }

    const userColor = userData.color;
    if (!userColor) {
        // Если у пользователя нет цвета, возвращаем базовый gameState
        return { ...room.gameState, withAIhints };
    }

    // Находим соперника
    const opponent = Array.from(room.users.entries()).find(
        ([id, user]) => id !== userId && user.color && user.color !== userColor
    );

    if (!opponent) {
        if (room.botSettings?.enabled && room.botSettings.color && room.botSettings.color !== userColor) {
            return {
                ...room.gameState,
                withAIhints,
                player: {
                    userId: userId,
                    userName: userData.userName,
                    avatar: userData.avatar,
                    color: userColor
                },
                opponent: {
                    userId: 'bot',
                    userName: room.botSettings.name,
                    avatar: room.botSettings.avatar,
                    color: room.botSettings.color
                }
            };
        }

        // Если соперник не найден, возвращаем gameState только с player
        return {
            ...room.gameState,
            withAIhints,
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
        withAIhints,
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

function startRoomGame(room: Room, roomId: string) {
  if (room.gameState.gameStarted || room.gameState.gameEnded) {
    return;
  }

  room.gameState.gameStarted = true;
  room.gameStartedAt = new Date();

  createRoomTimer(roomId);

  for (const [id, userData] of room.users) {
    if (userData.isConnected && userData.ws) {
      userData.ws.send({
        system: true,
        message: "Game started! White moves first.",
        type: "gameStart",
        gameState: getPersonalizedGameState(room, id)
      });
    }
  }
}

async function triggerBotMoveIfNeeded(roomId: string) {
  const room = rooms.get(roomId);
  if (!room || !room.botSettings?.enabled || room.gameState.gameEnded || !room.gameState.gameStarted) {
    return;
  }

  if (!room.botSettings.color || room.gameState.currentPlayer !== room.botSettings.color) {
    return;
  }

  if (botMoveInProgressRooms.has(roomId)) {
    return;
  }

  botMoveInProgressRooms.add(roomId);

  try {
    const botMove = await chessBot.getRoomMove({
      fen: room.gameState.currentFEN,
      difficulty: room.botSettings.difficulty,
      moveTimeMs: room.botSettings.moveTimeMs
    });

    room.gameState.currentFEN = botMove.moveData.FEN;
    room.gameState.moveHistory.push(botMove.moveData);

    if (room.gameState.timer && room.botSettings.color === "white" && room.gameState.timer.whiteIncrement) {
      room.gameState.timer.whiteTime += room.gameState.timer.whiteIncrement;
    } else if (room.gameState.timer && room.botSettings.color === "black" && room.gameState.timer.blackIncrement) {
      room.gameState.timer.blackTime += room.gameState.timer.blackIncrement;
    }

    room.gameState.currentPlayer = room.gameState.currentPlayer === "white" ? "black" : "white";
    syncCurrentColor(room);

    if (checkThreefoldRepetition(room)) {
      declareDrawByThreefoldRepetition(room, roomId);
      return;
    }

    if (checkInsufficientMaterial(room)) {
      declareDrawByInsufficientMaterial(room, roomId);
      return;
    }

    for (const [id, userData] of room.users) {
      if (userData.isConnected && userData.ws) {
        userData.ws.send({
          type: "move",
          moveData: botMove.moveData,
          from: room.botSettings.name,
          userId: 'bot',
          gameState: getPersonalizedGameState(room, id),
          time: Date.now()
        });
      }
    }
  } catch (error) {
    console.error('[chess-bot] Failed to make bot move:', error);
  } finally {
    botMoveInProgressRooms.delete(roomId);
  }
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

// Chess bot endpoint (for Postman/local testing)
app.post('/api/bot/move', async ({ body, set }) => {
  try {
    const fen = body.fen ?? body.moveData?.FEN;
    if (!fen) {
      set.status = 400;
      return {
        success: false,
        error: 'Either fen or moveData.FEN is required',
      };
    }

    const playerMoveUci = body.moveData ? chessBot.roomMoveToUci(body.moveData) : undefined;

    const result = await chessBot.getRoomMove({
      fen,
      difficulty: body.difficulty,
      moveTimeMs: body.moveTimeMs,
    });

    return {
      success: true,
      inputMoveUci: playerMoveUci,
      ...result,
    };
  } catch (error) {
    set.status = 400;
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}, {
  body: t.Object({
    fen: t.Optional(t.String()),
    moveData: t.Optional(t.Object({
      FEN: t.String(),
      from: t.Tuple([t.Number(), t.Number()]),
      to: t.Tuple([t.Number(), t.Number()]),
      figure: t.Object({
        color: t.Union([t.Literal('white'), t.Literal('black')]),
        type: t.Union([
          t.Literal('pawn'),
          t.Literal('bishop'),
          t.Literal('knight'),
          t.Literal('rook'),
          t.Literal('queen'),
          t.Literal('king'),
        ]),
      }),
    })),
    difficulty: t.Optional(t.Union([
      t.Literal('super_easy'),
      t.Literal('easy'),
      t.Literal('medium'),
      t.Literal('hard'),
    ])),
    moveTimeMs: t.Numeric({ minimum: 1 }),
  })
});

// Auth endpoints
// Регистрация пользователя
app.post('/api/auth/signup', async ({ body, request, set }) => {
  try {
    const { login, password, email } = body;

    // Валидация входных данных
    if (!login || !password || !email) {
      return {
        success: false,
        error: 'Login, password and email are required'
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

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: 'Invalid email format'
      };
    }

    // Проверка уникальности логина
    const existingUserByLogin = await User.findOne({ login: login.toLowerCase() });
    if (existingUserByLogin) {
      return {
        success: false,
        error: 'Login already exists'
      };
    }

    // Проверка уникальности email
    const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingUserByEmail) {
      return {
        success: false,
        error: 'Email already exists'
      };
    }

    // Хешируем пароль
    const hashedPassword = await hashPassword(password);

    // Генерируем токен для подтверждения email
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Создаем пользователя
    const user = new User({
      login: login.toLowerCase(),
      password: hashedPassword,
      email: email.toLowerCase(),
      emailVerified: false,
      emailVerificationToken: emailVerificationToken
    });

    await user.save();

    // Отправляем email с подтверждением
    try {
      await sendVerificationEmail(email.toLowerCase(), login, emailVerificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Не блокируем регистрацию, если email не отправился
    }

    return {
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        login: user.login,
        email: user.email,
        emailVerified: user.emailVerified
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
    password: t.String(),
    email: t.String()
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

    if ((user as any).isBlocked) {
      return {
        success: false,
        error: 'Your account is blocked'
      };
    }

    // Проверяем, подтвержден ли email
    if (!user.emailVerified) {
      try {
        const verificationToken = user.emailVerificationToken || crypto.randomBytes(32).toString('hex');

        if (!user.emailVerificationToken) {
          user.emailVerificationToken = verificationToken;
          await user.save();
        }

        await sendVerificationEmail(user.email, user.login, verificationToken);
      } catch (emailError) {
        console.error('Failed to resend verification email on login:', emailError);
      }

      return {
        success: false,
        error: 'Please verify your email before logging in',
        requiresEmailVerification: true
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
        login: user.login,
        email: user.email,
        name: user.name || user.login,
        avatar: user.avatar || '0',
        emailVerified: user.emailVerified
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
app.get('/api/auth/me', async ({ headers, set }) => {
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

    if ((user as any).isBlocked) {
      clearAuthCookie(set);
      return {
        success: false,
        error: 'User is blocked'
      };
    }

    const appearance = (user as any).appearance || {};
    return {
      success: true,
      user: {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        login: user.login,
        email: user.email,
        name: user.name || user.login,
        avatar: user.avatar || '0',
        emailVerified: user.emailVerified,
        appearance: {
          chessboardTheme: appearance.chessboardTheme || 'default'
        }
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

// Получение токена для WebSocket подключения
app.get('/api/auth/ws-token', async ({ headers, set }) => {
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

    // Проверяем валидность токена
    const payload = await verifyToken(authToken);
    if (!payload) {
      return {
        success: false,
        error: 'Invalid token'
      };
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      clearAuthCookie(set);
      return {
        success: false,
        error: 'User not found'
      };
    }

    if ((user as any).isBlocked) {
      clearAuthCookie(set);
      return {
        success: false,
        error: 'User is blocked'
      };
    }

    // Возвращаем токен для использования в WebSocket
    return {
      success: true,
      token: authToken,
      userId: payload.userId
    };
  } catch (error: any) {
    console.error('WS token error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get WS token'
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

// Обновление профиля пользователя
app.put('/api/auth/profile', async ({ body, headers, set }) => {
  try {
    const { name, avatar, appearance } = body;

    // Получаем токен из cookie
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

    if ((user as any).isBlocked) {
      clearAuthCookie(set);
      return {
        success: false,
        error: 'User is blocked'
      };
    }

    // Обновляем поля профиля
    if (name !== undefined) {
      if (name.length > 50) {
        return {
          success: false,
          error: 'Name must be less than 50 characters'
        };
      }
      user.name = name.trim() || undefined;
    }

    if (avatar !== undefined) {
      // Проверяем, что avatar - это валидный ID (0-7)
      const avatarId = parseInt(avatar);
      if (isNaN(avatarId) || avatarId < 0 || avatarId > 7) {
        return {
          success: false,
          error: 'Invalid avatar ID. Must be between 0 and 7'
        };
      }
      user.avatar = avatar.toString();
    }

    if (appearance !== undefined && typeof appearance === 'object') {
      const userAppearance = (user as any).appearance || {};
      if (appearance.chessboardTheme !== undefined) {
        const theme = String(appearance.chessboardTheme).trim();
        if (theme.length <= 50) {
          const nextAppearance = {
            ...userAppearance,
            chessboardTheme: theme || 'default'
          };
          (user as any).appearance = nextAppearance;
          user.markModified('appearance');
        }
      }
    }

    await user.save();

    const savedAppearance = (user as any).appearance || {};
    return {
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        login: user.login,
        email: user.email,
        name: user.name || user.login,
        avatar: user.avatar || '0',
        emailVerified: user.emailVerified,
        appearance: {
          chessboardTheme: savedAppearance.chessboardTheme || 'default'
        }
      }
    };
  } catch (error: any) {
    console.error('Profile update error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update profile'
    };
  }
}, {
  body: t.Object({
    name: t.Optional(t.String()),
    avatar: t.Optional(t.String()),
    appearance: t.Optional(t.Object({
      chessboardTheme: t.Optional(t.String())
    }))
  })
});

// Получение списка игр текущего пользователя
app.get('/api/auth/my-games', async ({ headers, query }) => {
  try {
    // Получаем токен из cookie
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

    const userId = new mongoose.Types.ObjectId(payload.userId);

    // Получаем параметры пагинации
    const pageParam = typeof query === 'object' && query !== null && 'page' in query ? query.page : undefined;
    const limitParam = typeof query === 'object' && query !== null && 'limit' in query ? query.limit : undefined;
    const page = parseInt(String(pageParam || '1')) || 1;
    const limit = Math.min(parseInt(String(limitParam || '10')) || 10, 50); // Максимум 50 игр за раз
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
      const moveHistory = Array.isArray(game.moveHistory) ? game.moveHistory : [];
      
      // Определяем цвет пользователя в игре
      const userColor = game.whitePlayer?.userId?.toString() === payload.userId ? 'white' : 'black';
      const opponent = userColor === 'white' ? game.blackPlayer : game.whitePlayer;
      
      // Определяем результат для пользователя
      let userResult: 'win' | 'loss' | 'draw' = 'draw';
      if (game.result.winColor) {
        if (game.result.winColor === userColor) {
          userResult = 'win';
        } else {
          userResult = 'loss';
        }
      }

      return {
        id: (game._id as mongoose.Types.ObjectId).toString(),
        roomId: game.roomId,
        userColor,
        opponent: {
          userName: opponent?.userName || 'Unknown',
          avatar: opponent?.avatar || '0'
        },
        result: {
          ...game.result,
          userResult
        },
        moveCount: moveHistory.length,
        startedAt: game.startedAt,
        endedAt: game.endedAt
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
    console.error('Get my games error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get games'
    };
  }
}, {
  query: t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String())
  })
});

// Подтверждение email
app.post('/api/auth/verify-email', async ({ body }) => {
  try {
    const { token } = body;

    if (!token) {
      return {
        success: false,
        error: 'Verification token is required'
      };
    }

    // Ищем пользователя с данным токеном подтверждения
    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return {
        success: false,
        error: 'Invalid verification token'
      };
    }

    // Если email уже подтвержден
    if (user.emailVerified) {
      return {
        success: true,
        message: 'Email already verified'
      };
    }

    // Подтверждаем email
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    return {
      success: true,
      message: 'Email verified successfully'
    };
  } catch (error: any) {
    console.error('Email verification error:', error);
    return {
      success: false,
      error: error.message || 'Email verification failed'
    };
  }
}, {
  body: t.Object({
    token: t.String()
  })
});

// Запрос на восстановление пароля
app.post('/api/auth/forgot-password', async ({ body }) => {
  try {
    const { email } = body;

    // Валидация входных данных
    if (!email) {
      return {
        success: false,
        error: 'Email is required'
      };
    }

    // Ищем пользователя по email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Для безопасности не сообщаем, существует ли пользователь
    if (!user) {
      return {
        success: true,
        message: 'If a user with this email exists, a password reset link has been sent'
      };
    }

    // Генерируем токен восстановления пароля
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 час

    // Сохраняем токен в базе данных
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // Отправляем email с токеном восстановления
    try {
      await sendPasswordResetEmail(user.email, user.login, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Очищаем токен, если email не отправился
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return {
        success: false,
        error: 'Failed to send password reset email'
      };
    }

    return {
      success: true,
      message: 'If a user with this email exists, a password reset link has been sent'
    };
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process password reset request'
    };
  }
}, {
  body: t.Object({
    email: t.String()
  })
});

// Сброс пароля с использованием токена
app.post('/api/auth/reset-password', async ({ body }) => {
  try {
    const { token, newPassword } = body;

    // Валидация входных данных
    if (!token || !newPassword) {
      return {
        success: false,
        error: 'Token and new password are required'
      };
    }

    if (newPassword.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters'
      };
    }

    // Ищем пользователя с валидным токеном
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return {
        success: false,
        error: 'Invalid or expired reset token'
      };
    }

    // Хешируем новый пароль
    const hashedPassword = await hashPassword(newPassword);

    // Обновляем пароль и очищаем токен восстановления
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return {
      success: true,
      message: 'Password has been reset successfully'
    };
  } catch (error: any) {
    console.error('Reset password error:', error);
    return {
      success: false,
      error: error.message || 'Failed to reset password'
    };
  }
}, {
  body: t.Object({
    token: t.String(),
    newPassword: t.String()
  })
});

// Отправка тестового сообщения на email
app.post('/api/auth/test-email', async ({ body }) => {
  try {
    const { email } = body;

    // Валидация входных данных
    if (!email) {
      return {
        success: false,
        error: 'Email is required'
      };
    }

    // Валидация формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: 'Invalid email format'
      };
    }

    // Отправляем тестовое сообщение
    try {
      await sendTestEmail(email.toLowerCase());
      return {
        success: true,
        message: `Test email sent successfully to ${email}`
      };
    } catch (emailError: any) {
      console.error('Failed to send test email:', emailError);
      return {
        success: false,
        error: emailError.message || 'Failed to send test email'
      };
    }
  } catch (error: any) {
    console.error('Test email error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process test email request'
    };
  }
}, {
  body: t.Object({
    email: t.String()
  })
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

app.get('/api/admin/stats/games', async ({ headers, set }) => {
  if (!hasAdminAccess(headers)) {
    set.status = 401;
    return {
      success: false,
      error: 'Unauthorized'
    };
  }

  try {
    const gamesWithResult = await Game.countDocuments({ 'result.resultType': { $exists: true } });
    const gamesWithoutResult = getOngoingGamesCount();

    return {
      success: true,
      stats: {
        totalGames: gamesWithResult + gamesWithoutResult,
        gamesWithResult,
        gamesWithoutResult
      }
    };
  } catch (error: any) {
    console.error('Admin games stats error:', error);
    set.status = 500;
    return {
      success: false,
      error: error.message || 'Failed to get admin games stats'
    };
  }
});

app.get('/api/admin/stats/users', async ({ headers, set }) => {
  if (!hasAdminAccess(headers)) {
    set.status = 401;
    return {
      success: false,
      error: 'Unauthorized'
    };
  }

  try {
    const totalRegisteredUsers = await User.countDocuments({});
    return {
      success: true,
      stats: {
        totalRegisteredUsers
      }
    };
  } catch (error: any) {
    console.error('Admin users stats error:', error);
    set.status = 500;
    return {
      success: false,
      error: error.message || 'Failed to get admin users stats'
    };
  }
});

app.get('/api/admin/stats/overview', async ({ headers, set }) => {
  if (!hasAdminAccess(headers)) {
    set.status = 401;
    return {
      success: false,
      error: 'Unauthorized'
    };
  }

  try {
    const [gamesWithResult, totalRegisteredUsers] = await Promise.all([
      Game.countDocuments({ 'result.resultType': { $exists: true } }),
      User.countDocuments({})
    ]);
    const gamesWithoutResult = getOngoingGamesCount();

    return {
      success: true,
      stats: {
        totalGames: gamesWithResult + gamesWithoutResult,
        gamesWithResult,
        gamesWithoutResult,
        totalRegisteredUsers
      }
    };
  } catch (error: any) {
    console.error('Admin overview stats error:', error);
    set.status = 500;
    return {
      success: false,
      error: error.message || 'Failed to get admin overview stats'
    };
  }
});

app.get('/api/admin/users', async ({ headers, query, set }) => {
  if (!hasAdminAccess(headers)) {
    set.status = 401;
    return {
      success: false,
      error: 'Unauthorized'
    };
  }

  try {
    const pageParam = typeof query === 'object' && query !== null && 'page' in query ? query.page : undefined;
    const limitParam = typeof query === 'object' && query !== null && 'limit' in query ? query.limit : undefined;
    const searchParam = typeof query === 'object' && query !== null && 'search' in query ? query.search : undefined;
    const blockedParam = typeof query === 'object' && query !== null && 'blocked' in query ? query.blocked : undefined;
    const verifiedParam = typeof query === 'object' && query !== null && 'verified' in query ? query.verified : undefined;

    const page = Math.max(parseInt(String(pageParam || '1')) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(limitParam || '20')) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const search = String(searchParam || '').trim();
    const blocked = String(blockedParam || 'all').toLowerCase();
    const verified = String(verifiedParam || 'all').toLowerCase();

    const filter: any = {};

    if (blocked === 'blocked') {
      filter.isBlocked = true;
    } else if (blocked === 'active') {
      filter.isBlocked = { $ne: true };
    }

    if (verified === 'verified') {
      filter.emailVerified = true;
    } else if (verified === 'unverified') {
      filter.emailVerified = false;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { login: regex },
        { email: regex },
        { name: regex }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    const userIds = users.map((user) => user._id as mongoose.Types.ObjectId);
    let gamesPlayedByUserId = new Map<string, number>();

    if (userIds.length > 0) {
      const gamesPlayedStats = await Game.aggregate<{
        _id: mongoose.Types.ObjectId;
        gamesPlayed: number;
      }>([
        {
          $match: {
            $or: [
              { 'whitePlayer.userId': { $in: userIds } },
              { 'blackPlayer.userId': { $in: userIds } }
            ]
          }
        },
        {
          $project: {
            participants: ['$whitePlayer.userId', '$blackPlayer.userId']
          }
        },
        { $unwind: '$participants' },
        {
          $match: {
            participants: { $in: userIds }
          }
        },
        {
          $group: {
            _id: '$participants',
            gamesPlayed: { $sum: 1 }
          }
        }
      ]);

      gamesPlayedByUserId = new Map(
        gamesPlayedStats.map((item) => [item._id.toString(), item.gamesPlayed])
      );
    }

    return {
      success: true,
      users: users.map((user) =>
        formatAdminUser(
          user,
          gamesPlayedByUserId.get((user._id as mongoose.Types.ObjectId).toString()) ?? 0
        )
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error: any) {
    console.error('Admin users list error:', error);
    set.status = 500;
    return {
      success: false,
      error: error.message || 'Failed to get users'
    };
  }
}, {
  query: t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    search: t.Optional(t.String()),
    blocked: t.Optional(t.String()),
    verified: t.Optional(t.String())
  })
});

app.get('/api/admin/users/:id', async ({ headers, params, set }) => {
  if (!hasAdminAccess(headers)) {
    set.status = 401;
    return {
      success: false,
      error: 'Unauthorized'
    };
  }

  try {
    const user = await User.findById(params.id);
    if (!user) {
      set.status = 404;
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      user: formatAdminUser(user)
    };
  } catch (error: any) {
    console.error('Admin user details error:', error);
    set.status = 500;
    return {
      success: false,
      error: error.message || 'Failed to get user'
    };
  }
}, {
  params: t.Object({
    id: t.String()
  })
});

app.patch('/api/admin/users/:id', async ({ headers, params, body, set }) => {
  if (!hasAdminAccess(headers)) {
    set.status = 401;
    return {
      success: false,
      error: 'Unauthorized'
    };
  }

  try {
    const user = await User.findById(params.id);
    if (!user) {
      set.status = 404;
      return {
        success: false,
        error: 'User not found'
      };
    }

    const updateData: Record<string, any> = {};

    if (body.name !== undefined) {
      const normalizedName = body.name.trim();
      updateData.name = normalizedName || undefined;
    }

    if (body.avatar !== undefined) {
      updateData.avatar = body.avatar.trim() || '0';
    }

    if (body.emailVerified !== undefined) {
      updateData.emailVerified = body.emailVerified;
      if (body.emailVerified) {
        updateData.emailVerificationToken = undefined;
      }
    }

    Object.assign(user, updateData);
    await user.save();

    return {
      success: true,
      message: 'User updated',
      user: formatAdminUser(user)
    };
  } catch (error: any) {
    console.error('Admin update user error:', error);
    set.status = 500;
    return {
      success: false,
      error: error.message || 'Failed to update user'
    };
  }
}, {
  params: t.Object({
    id: t.String()
  }),
  body: t.Object({
    name: t.Optional(t.String()),
    avatar: t.Optional(t.String()),
    emailVerified: t.Optional(t.Boolean())
  })
});

app.patch('/api/admin/users/:id/resend-verification', async ({ headers, params, set }) => {
  if (!hasAdminAccess(headers)) {
    set.status = 401;
    return {
      success: false,
      error: 'Unauthorized'
    };
  }

  try {
    const user = await User.findById(params.id);
    if (!user) {
      set.status = 404;
      return {
        success: false,
        error: 'User not found'
      };
    }

    if (user.emailVerified) {
      set.status = 400;
      return {
        success: false,
        error: 'Email already verified'
      };
    }

    const verificationToken = user.emailVerificationToken || crypto.randomBytes(32).toString('hex');
    if (!user.emailVerificationToken) {
      user.emailVerificationToken = verificationToken;
      await user.save();
    }

    await sendVerificationEmail(user.email, user.login, verificationToken);

    return {
      success: true,
      message: 'Verification email sent',
      user: formatAdminUser(user)
    };
  } catch (error: any) {
    console.error('Admin resend verification error:', error);
    set.status = 500;
    return {
      success: false,
      error: error.message || 'Failed to resend verification email'
    };
  }
}, {
  params: t.Object({
    id: t.String()
  })
});

app.patch('/api/admin/users/:id/block', async ({ headers, params, body, set }) => {
  if (!hasAdminAccess(headers)) {
    set.status = 401;
    return {
      success: false,
      error: 'Unauthorized'
    };
  }

  try {
    const user = await User.findById(params.id);
    if (!user) {
      set.status = 404;
      return {
        success: false,
        error: 'User not found'
      };
    }

    user.set({
      isBlocked: true,
      blockedReason: body.reason?.trim() || null,
      blockedAt: new Date()
    });
    await user.save();

    return {
      success: true,
      message: 'User blocked',
      user: formatAdminUser(user)
    };
  } catch (error: any) {
    console.error('Admin block user error:', error);
    set.status = 500;
    return {
      success: false,
      error: error.message || 'Failed to block user'
    };
  }
}, {
  params: t.Object({
    id: t.String()
  }),
  body: t.Object({
    reason: t.Optional(t.String())
  })
});

app.patch('/api/admin/users/:id/unblock', async ({ headers, params, set }) => {
  if (!hasAdminAccess(headers)) {
    set.status = 401;
    return {
      success: false,
      error: 'Unauthorized'
    };
  }

  try {
    const user = await User.findById(params.id);
    if (!user) {
      set.status = 404;
      return {
        success: false,
        error: 'User not found'
      };
    }

    user.set({
      isBlocked: false,
      blockedReason: null,
      blockedAt: null
    });
    await user.save();

    return {
      success: true,
      message: 'User unblocked',
      user: formatAdminUser(user)
    };
  } catch (error: any) {
    console.error('Admin unblock user error:', error);
    set.status = 500;
    return {
      success: false,
      error: error.message || 'Failed to unblock user'
    };
  }
}, {
  params: t.Object({
    id: t.String()
  })
});

app.delete('/api/admin/users/:id', async ({ headers, params, set }) => {
  if (!hasAdminAccess(headers)) {
    set.status = 401;
    return {
      success: false,
      error: 'Unauthorized'
    };
  }

  try {
    const user = await User.findById(params.id);
    if (!user) {
      set.status = 404;
      return {
        success: false,
        error: 'User not found'
      };
    }

    await User.deleteOne({ _id: params.id });

    return {
      success: true,
      message: 'User deleted',
      deletedUserId: params.id
    };
  } catch (error: any) {
    console.error('Admin delete user error:', error);
    set.status = 500;
    return {
      success: false,
      error: error.message || 'Failed to delete user'
    };
  }
}, {
  params: t.Object({
    id: t.String()
  })
});

app.post('/api/random-match/join', async ({ body, headers, set }) => {
  try {
    cleanupRandomMatchState();

    let payload: any = {};
    if (typeof body === 'string') {
      try {
        payload = JSON.parse(body);
      } catch (error) {
        payload = {};
      }
    } else if (body && typeof body === 'object') {
      payload = body;
    }

    const participant = await getRandomMatchParticipant(
      headers as Record<string, string | undefined>,
      payload.guestId
    );
    if (!participant) {
      set.status = 400;
      return {
        success: false,
        error: 'Missing guestId for anonymous queue join'
      };
    }

    const { timeMinutes, incrementSeconds } = getRandomMatchTimeConfig(payload.timeMinutes, payload.incrementSeconds);
    const timeKey = getRandomMatchTimeKey(timeMinutes, incrementSeconds);

    const existingAssignment = randomMatchAssignments.get(participant.participantId);
    if (existingAssignment) {
      return {
        success: true,
        status: 'matched',
        roomId: existingAssignment.roomId,
        queueCountForTimeControl: randomMatchQueueByTime.get(existingAssignment.timeKey)?.length ?? 0,
        totalPlayersInRandomQueue: getTotalRandomMatchQueueCount(),
        timeControl: { timeMinutes, incrementSeconds }
      };
    }

    removeUserFromRandomMatchQueue(participant.participantId);

    const queue = randomMatchQueueByTime.get(timeKey) ?? [];
    const opponent = queue.find((entry) => entry.userId !== participant.participantId);

    if (opponent) {
      const filteredQueue = queue.filter((entry) => entry.userId !== opponent.userId);
      if (filteredQueue.length === 0) {
        randomMatchQueueByTime.delete(timeKey);
      } else {
        randomMatchQueueByTime.set(timeKey, filteredQueue);
      }
      randomMatchUserToTimeKey.delete(opponent.userId);

      const totalTimeSeconds = timeMinutes * 60;
      const { roomId } = createRoomWithConfig({
        whiteTimer: totalTimeSeconds,
        blackTimer: totalTimeSeconds,
        increment: incrementSeconds,
        forceDisableAIhints: true
      });

      const assignment: RandomMatchAssignment = {
        roomId,
        createdAt: Date.now(),
        timeKey
      };
      randomMatchAssignments.set(participant.participantId, assignment);
      randomMatchAssignments.set(opponent.userId, assignment);

      return {
        success: true,
        status: 'matched',
        roomId,
        queueCountForTimeControl: randomMatchQueueByTime.get(timeKey)?.length ?? 0,
        totalPlayersInRandomQueue: getTotalRandomMatchQueueCount(),
        timeControl: { timeMinutes, incrementSeconds }
      };
    }

    // Fallback: if no human opponent is waiting, add a short "searching" delay
    // before starting a game vs bot so quick play feels natural.
    const botMatchDelayMs = 900 + Math.floor(Math.random() * 900); // 900-1800ms
    await new Promise((resolve) => setTimeout(resolve, botMatchDelayMs));

    // Start a game vs bot.
    const totalTimeSeconds = timeMinutes * 60;
    const botName = generateGuestCatName(new Set([participant.userName]));
    const { roomId } = createRoomWithConfig({
      whiteTimer: totalTimeSeconds,
      blackTimer: totalTimeSeconds,
      increment: incrementSeconds,
      forceDisableAIhints: true,
      vsBot: true,
      botDifficulty: 'medium',
      botMoveTimeMs: 800,
      botName
    });

    const assignment: RandomMatchAssignment = {
      roomId,
      createdAt: Date.now(),
      timeKey
    };
    randomMatchAssignments.set(participant.participantId, assignment);

    return {
      success: true,
      status: 'matched',
      roomId,
      queueCountForTimeControl: randomMatchQueueByTime.get(timeKey)?.length ?? 0,
      totalPlayersInRandomQueue: getTotalRandomMatchQueueCount(),
      timeControl: { timeMinutes, incrementSeconds }
    };
  } catch (error: any) {
    console.error('Random match join error:', error);
    set.status = 500;
    return {
      success: false,
      error: error.message || 'Failed to join random match queue'
    };
  }
});

app.get('/api/random-match/status', async ({ query, headers, set }) => {
  try {
    cleanupRandomMatchState();

    const { timeMinutes, incrementSeconds } = getRandomMatchTimeConfig(
      (query as any)?.timeMinutes,
      (query as any)?.incrementSeconds
    );
    const timeKey = getRandomMatchTimeKey(timeMinutes, incrementSeconds);

    const participant = await getRandomMatchParticipant(
      headers as Record<string, string | undefined>,
      (query as any)?.guestId
    );
    const assignment = participant ? randomMatchAssignments.get(participant.participantId) : undefined;
    const isInQueue = participant ? randomMatchUserToTimeKey.has(participant.participantId) : false;

    return {
      success: true,
      status: assignment ? 'matched' : (isInQueue ? 'waiting' : 'idle'),
      roomId: assignment?.roomId,
      queueCountForTimeControl: randomMatchQueueByTime.get(timeKey)?.length ?? 0,
      totalPlayersInRandomQueue: getTotalRandomMatchQueueCount(),
      timeControl: { timeMinutes, incrementSeconds }
    };
  } catch (error: any) {
    console.error('Random match status error:', error);
    set.status = 500;
    return {
      success: false,
      error: error.message || 'Failed to fetch random match status'
    };
  }
});

app.delete('/api/random-match/leave', async ({ headers, query, set }) => {
  try {
    cleanupRandomMatchState();

    const participant = await getRandomMatchParticipant(
      headers as Record<string, string | undefined>,
      (query as any)?.guestId
    );

    if (participant) {
      removeUserFromRandomMatchQueue(participant.participantId);
      randomMatchAssignments.delete(participant.participantId);
    }

    return {
      success: true,
      status: 'left',
      totalPlayersInRandomQueue: getTotalRandomMatchQueueCount()
    };
  } catch (error: any) {
    console.error('Random match leave error:', error);
    set.status = 500;
    return {
      success: false,
      error: error.message || 'Failed to leave random match queue'
    };
  }
});

// Create room endpoint
app.post('/api/rooms', async ({ body }) => {
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

  // {"whiteTimer":60,"blackTimer":60,"increment":5,"currentFEN":"...","color":"white"}
  console.log('TIMER CONFIG BODY', body);
  console.log('TIMER CONFIG', timerConfig);

  const { roomId, room, timerConfig: normalizedConfig } = createRoomWithConfig(timerConfig);
  
  console.log('ROOM CREATED WITH TIMER:', room.gameState.timer);
  console.log('ROOM ID:', roomId);
  console.log('ROOM CREATED WITH FEN:', normalizedConfig.currentFEN);
  
  return {
    success: true,
    roomId,
    message: 'Room created successfully',
    vsBot: room.botSettings?.enabled ?? false,
    withAIhints: room.gameState.withAIhints,
    botDifficulty: room.botSettings?.difficulty,
    botMoveTimeMs: room.botSettings?.moveTimeMs,
    timerConfig: {
      whiteTimer: normalizedConfig.whiteTimer,
      blackTimer: normalizedConfig.blackTimer,
      increment: normalizedConfig.increment,
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
      clientId: t.Optional(t.String()),
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
      type: t.Literal("hintAI")
    }),
    t.Object({
      type: t.Literal("resign")
    }),
    t.Object({
      type: t.Literal("timerTick")
    })
  ]),

  async open(ws) {
      const { roomId, userName, avatar, clientId, currentFEN: queryFEN, color: queryColor, authToken, hasMobilePlayer: queryHasMobilePlayer } = ws.data.query;
      const normalizedUserName = userName?.trim() || "Anonymous cat";

      // Преобразуем строку "true" или "1" в boolean для hasMobilePlayer
      const hasMobilePlayer: boolean = queryHasMobilePlayer === "true" || queryHasMobilePlayer === "1";

      // Получаем registeredUserId из токена синхронно перед сохранением пользователя
      let registeredUserId: mongoose.Types.ObjectId | undefined;
      if (authToken) {
        try {
          const payload = await verifyToken(authToken);
          if (payload && payload.userId) {
            registeredUserId = new mongoose.Types.ObjectId(payload.userId);
            console.log(`✅ User authenticated: ${userName}, userId: ${registeredUserId.toString()}`);
          }
        } catch (error) {
          // Игнорируем ошибки токена, пользователь может играть без регистрации
          console.log('Token verification failed, user will play without registration:', error);
        }
      } else {
        console.log(`ℹ️ User connecting without auth: ${userName}`);
      }

      let room = rooms.get(roomId);

      console.log('ROOM ID:', roomId);
      console.log('ROOM FOUND:', !!room);
      console.log('ROOM', room?.gameState);

      if (room && typeof room.gameState.withAIhints !== 'boolean') {
          room.gameState.withAIhints = room.botSettings?.enabled
            ? room.botSettings.allowAIhints !== false
            : false;
      }
      if (room?.botSettings?.enabled && room.botSettings.allowAIhints !== false && room.gameState.withAIhints !== true) {
          room.gameState.withAIhints = true;
      }

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
              withAIhints: false,
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

      // Проверяем, есть ли уже такой пользователь в комнате (clientId/registeredUserId),
      // а userName используем только как legacy fallback
      let existingUserId: string | null = null;
      for (const [userId, userData] of room.users) {
          const sameClientId = !!clientId && userData.clientId === clientId;
          const sameRegisteredUser = !!registeredUserId
            && !!userData.registeredUserId
            && userData.registeredUserId.toString() === registeredUserId.toString();
          const sameUserNameLegacy = !clientId && !registeredUserId && userData.userName === userName;

          if (sameClientId || sameRegisteredUser || sameUserNameLegacy) {
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
          // Приоритет: новый registeredUserId > существующий registeredUserId
          const currentRegisteredUserId = registeredUserId || existingUserData?.registeredUserId;
          room.users.set(existingUserId, {
              userName: existingUserData?.userName || normalizedUserName,
              avatar: avatar,
              clientId: clientId || existingUserData?.clientId,
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
            message: `Welcome back to room ${roomId}, ${existingUserData?.userName || normalizedUserName}! Your ID: ${existingUserId}`,
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
                  userData.ws.send({ system: true, message: `${existingUserData?.userName || normalizedUserName} rejoined the room` });
              }
          }

          if (room.botSettings?.enabled) {
            void triggerBotMoveIfNeeded(roomId);
          }
          return;
      }

      const maxRoomUsers = room.botSettings?.enabled ? 1 : 2;

      // Если комната заполнена → не пускаем
      if (room.users.size >= maxRoomUsers) {
          ws.send({ system: true, message: 'Room is full' });
          ws.close();
          return;
      }

      // Генерируем новый ID для нового пользователя
      const userId = generateShortId();

      // Назначаем цвет пользователю
      let assignedColor: "white" | "black";
      if (room.users.size === 0) {
        // Если это первый пользователь, фиксируем цвет в комнате один раз,
        // чтобы при обновлении страницы (и повторном подключении) сторона не менялась.
        if (!room.firstPlayerColor) {
          if (room.botSettings?.enabled && room.botSettings.color) {
            room.firstPlayerColor = room.botSettings.color === "white" ? "black" : "white";
          } else {
            room.firstPlayerColor = assignRandomColor();
          }
        }
        assignedColor = room.firstPlayerColor;
        if (room.botSettings?.enabled) {
          room.botSettings.color = assignedColor === "white" ? "black" : "white";
        }
      } else {
        // Если уже есть пользователь, назначаем противоположный цвет
        const existingUserColor = room.users.get(Array.from(room.users.keys())[0] as string)?.color;
        assignedColor = existingUserColor === "white" ? "black" : "white";
      }

      // Сохраняем данные нового пользователя в комнате
      const finalUserName = buildUniqueUserNameInRoom(room, normalizedUserName);
      if (room.botSettings?.enabled && room.botSettings.name.toLowerCase() === finalUserName.toLowerCase()) {
        room.botSettings.name = generateGuestCatName(new Set([finalUserName]));
      }

      room.users.set(userId, {
          userName: finalUserName,
          avatar: avatar,
          clientId: clientId,
          ws: ws,
          isConnected: true,
          color: assignedColor,
          cursorPosition: { x: 0, y: 0 },
          registeredUserId: registeredUserId
      });
      
      if (registeredUserId) {
        console.log(`✅ User ${userName} connected with registeredUserId: ${registeredUserId.toString()}`);
      }

      // Устанавливаем hasMobilePlayer если пользователь подключился с мобильного приложения
      if (hasMobilePlayer) {
          room.hasMobilePlayer = true;
      }

      updateRoomActivity(roomId);
      updateMetrics();

      // приветствие для нового пользователя
      ws.send({
        system: true, 
        message: `Welcome to room ${roomId}, ${finalUserName}! Your ID: ${userId}`,
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
                      message: `${finalUserName} connected`,
                      opponentColor: assignedColor
                  });
              }
      }

      // Запускаем игру: в обычной комнате после 2 игроков, в bot-комнате после 1 игрока
      if (room.users.size === 2 || (room.botSettings?.enabled && room.users.size === 1)) {
          startRoomGame(room, roomId);

          if (room.botSettings?.enabled) {
            void triggerBotMoveIfNeeded(roomId);
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
      const currentClientId = ws.data.query.clientId;
      
      for (const [userId, userData] of room.users) {
          const sameClientId = !!currentClientId && userData.clientId === currentClientId;
          const sameUserNameLegacy = !currentClientId && userData.userName === ws.data.query.userName;

          if (sameClientId || sameUserNameLegacy) {
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

          if (room.botSettings?.enabled) {
            void triggerBotMoveIfNeeded(roomId);
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
      } else if (data.type === "hintAI") {
          if (!room.gameState.gameStarted) {
              ws.send({ system: true, message: "Game has not started yet" });
              return;
          }

          if (room.gameState.gameEnded) {
              ws.send({ system: true, message: "Game is already finished" });
              return;
          }

          if (!room.gameState.withAIhints) {
              ws.send({ system: true, message: "AI hints are disabled for this room" });
              return;
          }

          const difficulty = room.botSettings?.difficulty ?? "medium";
          const moveTimeMs = room.botSettings?.moveTimeMs ?? 600;

          void (async () => {
              try {
                  const hint = await chessBot.getRoomMove({
                      fen: room.gameState.currentFEN,
                      difficulty,
                      moveTimeMs
                  });

                  if (!senderUserData?.isConnected || !senderUserData.ws) {
                      return;
                  }

                  senderUserData.ws.send({
                      type: "hintAI",
                      from: "Stockfish",
                      hint: {
                          from: hint.moveData.from,
                          to: hint.moveData.to
                      },
                      time: Date.now()
                  });
              } catch (error) {
                  ws.send({
                      system: true,
                      message: "Failed to get AI hint"
                  });
              }
          })();
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

              // В играх против бота бот всегда принимает ничью.
              if (room.botSettings?.enabled) {
                  room.gameState.drawOffer = {
                      from: senderUserId,
                      to: "bot",
                      status: "accepted"
                  };

                  room.gameState.gameEnded = true;
                  room.gameState.gameResult = {
                      resultType: "draw"
                  };

                  clearRoomTimer(roomId);
                  saveGameToDatabase(room, roomId);

                  for (const [id, userData] of room.users) {
                      if (userData.isConnected && userData.ws) {
                          userData.ws.send({
                              type: "gameResult",
                              gameResult: room.gameState.gameResult,
                              from: room.botSettings.name,
                              userId: senderUserId,
                              gameState: getPersonalizedGameState(room, id),
                              time: Date.now()
                          });
                      }
                  }

                  for (const [_, userData] of room.users) {
                      if (userData.isConnected && userData.ws) {
                          userData.ws.send({
                              system: true,
                              message: `${room.botSettings.name} accepted draw offer. Game ended in a draw.`,
                              type: "gameEnd"
                          });
                      }
                  }

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

    const currentClientId = ws.data.query.clientId;
    let disconnectedUserId: string | null = null;
    let disconnectedUserName = ws.data.query.userName;

    for (const [userId, userData] of room.users) {
      const sameClientId = !!currentClientId && userData.clientId === currentClientId;
      const sameUserNameLegacy = !currentClientId && userData.userName === ws.data.query.userName;
      if (sameClientId || sameUserNameLegacy) {
        disconnectedUserId = userId;
        disconnectedUserName = userData.userName;
        break;
      }
    }

    // Проверяем, остались ли подключенные игроки
    let connectedUsers = 0;
    for (const [userId, userData] of room.users) {
      if (userId !== disconnectedUserId) {
        if (userData.isConnected) {
          connectedUsers++;
          userData.ws.send({ system: true, message: `${disconnectedUserName} disconnected` });
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

try {
  await chessBot.start();
  console.log('[chess-bot] Stockfish engine started');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[chess-bot] Failed to start Stockfish engine:', message);
  process.exit(1);
}

app.listen(PORT);
console.log(`Server is running on port ${PORT}`);

let isShuttingDown = false;

const shutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`Received ${signal}. Shutting down...`);

  try {
    await chessBot.stop();
    console.log('[chess-bot] Stockfish engine stopped');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[chess-bot] Error during shutdown:', message);
  }

  process.exit(0);
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
