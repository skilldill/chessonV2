import { Elysia, t } from 'elysia'
import { connectDB } from './config/database'
import { ElysiaWS } from 'elysia/ws';

// Connect to MongoDB
connectDB()

const app = new Elysia()

type Room = {
    users: Map<string, ElysiaWS<any, any>>
}

const rooms = new Map<string, Room>();

// Healthcheck endpoint
app.get('/api/health', () => ({
  status: 'ok',
  timestamp: new Date().toISOString()
}));

app.ws('/ws/room', {
  query: t.Object({
      roomId: t.String(),
      userId: t.String()
  }),
  body: t.Object({
      message: t.String()
  }),
  open(ws) {
      const { roomId, userId } = ws.data.query

      let room = rooms.get(roomId)
      if (!room) {
          room = { users: new Map() }
          rooms.set(roomId, room)
      }

      // если уже 2 участника → не пускаем
      if (room.users.size >= 2) {
          ws.send({ system: true, message: 'Комната занята' })
          ws.close()
          return
      }

      room.users.set(userId, ws)

      // приветствие
      ws.send({ system: true, message: `Добро пожаловать в комнату ${roomId}` })

      // уведомляем второго, если он есть
      for (const [id, socket] of room.users) {
          if (id !== userId) {
              socket.send({ system: true, message: `${userId} подключился` })
          }
      }
  },
  message(ws, { message }) {
      const { roomId, userId } = ws.data.query
      const room = rooms.get(roomId)
      if (!room) return

      // пересылаем сообщение другому участнику
      for (const [id, socket] of room.users) {
          if (id !== userId) {
              socket.send({
                  from: userId,
                  message,
                  time: Date.now()
              })
          }
      }
  },
  close(ws) {
      const { roomId, userId } = ws.data.query
      const room = rooms.get(roomId)
      if (!room) return

      room.users.delete(userId)

      // уведомляем оставшегося
      for (const socket of room.users.values()) {
          socket.send({ system: true, message: `${userId} отключился` })
      }

      // если комната опустела — удаляем
      if (room.users.size === 0) {
          rooms.delete(roomId)
      }
  }
})

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000

app.listen(PORT);
console.log(`Server is running on port ${PORT}`);