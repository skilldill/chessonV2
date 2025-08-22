import { Elysia } from 'elysia'
import { connectDB } from './config/database'

// Connect to MongoDB
connectDB()

const app = new Elysia()

// Healthcheck endpoint
app.get('/api/health', () => ({
  status: 'ok',
  timestamp: new Date().toISOString()
}));
