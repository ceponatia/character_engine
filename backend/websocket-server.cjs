// Simple WebSocket server for testing
const { createServer } = require('http');
const { Server } = require('socket.io');

const PORT = 3003; // Different port to avoid conflicts

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

console.log('🔌 Starting WebSocket server on port', PORT);

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join session room
  socket.on('join_session', (sessionId) => {
    socket.join(`session_${sessionId}`);
    console.log(`👥 Client ${socket.id} joined session ${sessionId}`);
  });

  // Handle chat messages
  socket.on('chat_message', async (data) => {
    try {
      const { sessionId, characterId, message, userId } = data;
      
      console.log(`💬 Chat message from ${userId} in session ${sessionId}: ${message}`);
      
      // Emit typing indicator
      io.to(`session_${sessionId}`).emit('character_typing', { isTyping: true });
      
      // Simple response after delay
      setTimeout(() => {
        const response = `Luna whispers: "I hear you saying '${message}'. How intriguing..."`;
        
        io.to(`session_${sessionId}`).emit('chat_response', {
          message: response,
          characterId: characterId,
          messageId: Date.now().toString()
        });
        
        io.to(`session_${sessionId}`).emit('character_typing', { isTyping: false });
      }, 2000); // 2 second delay to simulate AI processing
      
    } catch (error) {
      console.error('Chat message error:', error);
      socket.emit('chat_error', { error: 'Failed to process message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`🔌 WebSocket: Real-time chat enabled`);
  console.log(`💬 Connect from frontend using: http://localhost:${PORT}`);
});