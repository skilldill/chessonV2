import { Elysia } from 'elysia'
import { connectDB } from './config/database'
import { websocket } from 'elysia/ws';

// Connect to MongoDB
connectDB()

const app = new Elysia()

// Healthcheck endpoint
app.get('/api/health', () => ({
  status: 'ok',
  timestamp: new Date().toISOString()
}));

app.ws('/ws', {
  message: (ws, message) => {
    ws.send('OK this is read' + JSON.stringify(message));
  },
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 4000
console.log(`Server is running on port ${port}`);
app.listen(port)