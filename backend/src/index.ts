import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase, healthCheck } from './utils/database';
import characterRoutes from './routes/characters';
import settingRoutes from './routes/settings';
import locationRoutes from './routes/locations';
import chatSessionRoutes from './routes/chat-sessions';
import uploadRoutes from './routes/upload';
import ChatMiddleware from './middleware/chat';
import { llmService } from './services/llm';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// API Routes
app.use('/api/characters', characterRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/chat-sessions', chatSessionRoutes);
app.use('/api/upload', uploadRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  const [dbHealth, llmHealth] = await Promise.all([
    healthCheck(),
    llmService.healthCheck()
  ]);
  
  res.json({ 
    status: 'OK', 
    message: 'RPG Chatbot Backend is running',
    database: dbHealth,
    llm: llmHealth
  });
});

// Initialize chat middleware
const chatMiddleware = new ChatMiddleware(io);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
  
  // Session management
  socket.on('join_session', (sessionId) => chatMiddleware.handleJoinSession(socket, sessionId));
  
  // Chat message handling
  socket.on('chat_message', (data) => chatMiddleware.handleChatMessage(socket, data));
  
  // Typing indicators
  socket.on('typing', (data) => chatMiddleware.handleTyping(socket, data));
  socket.on('stop_typing', () => chatMiddleware.handleTyping(socket, { characterId: '', isTyping: false }));
  
  // Conversation management
  socket.on('get_conversation_history', (data) => chatMiddleware.handleGetConversationHistory(socket, data));
  socket.on('clear_conversation', (data) => chatMiddleware.handleClearConversation(socket, data));
  
  // Character state management
  socket.on('get_character_state', (data) => chatMiddleware.handleGetCharacterState(socket, data));
  
  // Health check
  socket.on('chat_health_check', () => chatMiddleware.handleHealthCheck(socket));
});

// Start server with database connection
async function startServer() {
  try {
    await connectDatabase();
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Character API: http://localhost:${PORT}/api/characters`);
      console.log(`Settings API: http://localhost:${PORT}/api/settings`);
      console.log(`Locations API: http://localhost:${PORT}/api/locations`);
      console.log(`Chat Sessions API: http://localhost:${PORT}/api/chat-sessions`);
      console.log(`Upload API: http://localhost:${PORT}/api/upload`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await disconnectDatabase();
  process.exit(0);
});

startServer();

export default app;