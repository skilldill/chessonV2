import { Elysia, t } from 'elysia';
import { connectDB } from './config/database';
import { ElysiaWS } from 'elysia/ws';
import { v4 as uuidv4 } from 'uuid';

// Connect to MongoDB
connectDB();

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

type Room = {
    users: Map<string, ElysiaWS<any, any>>;
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
      
      // Генерируем уникальный ID для пользователя используя короткий формат
      const userId = generateShortId();
      
      // Сохраняем userId и userName в WebSocket для использования в других методах
      (ws as any).userId = userId;
      (ws as any).userName = userName;

      let room = rooms.get(roomId);
      if (!room) {
          room = { users: new Map() };
          rooms.set(roomId, room);
      }

      // если уже 2 участника → не пускаем
      if (room.users.size >= 2) {
          ws.send({ system: true, message: 'Комната занята' });
          ws.close();
          return;
      }

      room.users.set(userId, ws);

      // приветствие
      ws.send({ system: true, message: `Добро пожаловать в комнату ${roomId}, ${userName}! Ваш ID: ${userId}` });

      // уведомляем второго, если он есть
      for (const [id, socket] of room.users) {
          if (id !== userId) {
              socket.send({ system: true, message: `${userName} подключился` });
          }
      }
  },
  message(ws, { message }) {
      const { roomId } = ws.data.query;
      const userId = (ws as any).userId;
      const userName = (ws as any).userName;
      const room = rooms.get(roomId);
      if (!room) return;

      // пересылаем сообщение другому участнику
      for (const [id, socket] of room.users) {
          if (id !== userId) {
              socket.send({
                  from: userName,
                  userId: userId,
                  message,
                  time: Date.now()
              });
          }
      }
  },
  close(ws) {
      const { roomId } = ws.data.query;
      const userId = (ws as any).userId;
      const userName = (ws as any).userName;
      const room = rooms.get(roomId);
      if (!room) return;

      room.users.delete(userId);

      // уведомляем оставшегося
      for (const socket of room.users.values()) {
          socket.send({ system: true, message: `${userName} отключился` });
      }

      // если комната опустела — удаляем
      if (room.users.size === 0) {
          rooms.delete(roomId);
      }
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

app.listen(PORT);
console.log(`Server is running on port ${PORT}`);