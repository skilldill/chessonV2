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

type UserData = {
    userName: string;
    ws: ElysiaWS<any, any>;
    isConnected: boolean;
};

type Room = {
    users: Map<string, UserData>;
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
  
  // Create empty room
  const room = { users: new Map() };
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

  body: t.Object({
      message: t.String()
  }),

  open(ws) {
      const { roomId, userName } = ws.data.query;

      let room = rooms.get(roomId);
      if (!room) {
          room = { users: new Map() };
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
              isConnected: true
          });

          // Приветствие для вернувшегося пользователя
          ws.send({ system: true, message: `Добро пожаловать обратно в комнату ${roomId}, ${userName}! Ваш ID: ${existingUserId}` });

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

      // Сохраняем данные нового пользователя в комнате
      room.users.set(userId, {
          userName: userName,
          ws: ws,
          isConnected: true
      });

      // приветствие для нового пользователя
      ws.send({ system: true, message: `Добро пожаловать в комнату ${roomId}, ${userName}! Ваш ID: ${userId}` });

      // уведомляем других пользователей о подключении
      for (const [id, userData] of room.users) {
          if (id !== userId) {
              userData.ws.send({ system: true, message: `${userName} подключился` });
          }
      }
  },
  message(ws, { message }) {
      const { roomId } = ws.data.query;
      const room = rooms.get(roomId);
      if (!room) return;

      // Находим пользователя по WebSocket соединению
      let senderUserId: string | null = null;
      let senderUserName: string | null = null;
      
      for (const [userId, userData] of room.users) {
          if (userData.ws === ws) {
              senderUserId = userId;
              senderUserName = userData.userName;
              break;
          }
      }

      if (!senderUserId || !senderUserName) return;

      // пересылаем сообщение другим подключенным участникам
      for (const [id, userData] of room.users) {
          if (id !== senderUserId && userData.isConnected && userData.ws) {
              userData.ws.send({
                  from: senderUserName,
                  userId: senderUserId,
                  message,
                  time: Date.now()
              });
          }
      }
  },
  close(ws) {
      const { roomId } = ws.data.query;
      const room = rooms.get(roomId);
      if (!room) return;

      // Находим пользователя по WebSocket соединению
      let disconnectedUserId: string | null = null;
      let disconnectedUserName: string | null = null;
      
      for (const [userId, userData] of room.users) {
          if (userData.ws === ws) {
              disconnectedUserId = userId;
              disconnectedUserName = userData.userName;
              break;
          }
      }

      if (!disconnectedUserId || !disconnectedUserName) return;

      // Помечаем пользователя как отключенного, но не удаляем из комнаты
      const userData = room.users.get(disconnectedUserId);
      if (userData) {
          userData.isConnected = false;
          userData.ws = null as any; // Очищаем ссылку на WebSocket
      }

      // уведомляем подключенных пользователей об отключении
      for (const [id, userData] of room.users) {
          if (id !== disconnectedUserId && userData.isConnected && userData.ws) {
              userData.ws.send({ system: true, message: `${disconnectedUserName} отключился` });
          }
      }

      // Проверяем, есть ли подключенные пользователи
      const connectedUsers = Array.from(room.users.values()).filter(user => user.isConnected);
      
      // если нет подключенных пользователей — удаляем комнату через 5 минут
      if (connectedUsers.length === 0) {
          setTimeout(() => {
              const room = rooms.get(roomId);
              if (room) {
                  const stillConnected = Array.from(room.users.values()).filter(user => user.isConnected);
                  if (stillConnected.length === 0) {
                      rooms.delete(roomId);
                      console.log(`Комната ${roomId} удалена из-за отсутствия подключенных пользователей`);
                  }
              }
          }, 5 * 60 * 1000); // 5 минут
      }
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

app.listen(PORT);
console.log(`Server is running on port ${PORT}`);