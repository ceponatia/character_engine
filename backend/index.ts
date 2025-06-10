import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/bun';
import * as dotenv from 'dotenv';
import characterRoutes from './src/routes/characters';
import emergencyRoutes from './src/routes/emergency';
import chatSessionRoutes from './src/routes/chat-sessions';
import settingsRoutes from './src/routes/settings';
import locationsRoutes from './src/routes/locations';
import settingLocationsRoutes from './src/routes/setting-locations';
import { healthCheck } from './src/utils/supabase-db';
import { getResourceUsage } from './src/middleware/llm-safety';
import { requestIdMiddleware } from './src/middleware/error-handler';
import { moderateRateLimit } from './src/middleware/rate-limit';
import { optionalAuthMiddleware } from './src/middleware/auth';

dotenv.config();

const app = new Hono();
const PORT = process.env.PORT || 3002; // Use different port for parallel development

// Global middleware
app.use('*', requestIdMiddleware());
app.use('*', logger());

// Enhanced CORS configuration - more permissive for development
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: false, // Temporarily disable for testing
  maxAge: 3600
}));

// Temporarily disable rate limiting for development
// app.use('*', moderateRateLimit);

// Optional authentication disabled for now to fix API access
// app.use('*', optionalAuthMiddleware);

// Health check endpoint with Supabase status and safety metrics
app.get('/health', async (c) => {
  const dbHealth = await healthCheck();
  const resources = await getResourceUsage();
  
  return c.json({ 
    status: 'OK', 
    message: 'RPG Chatbot Hono Backend is running',
    database: dbHealth,
    llm: { 
      status: 'safety_enabled',
      activeRequests: resources.activeRequests,
      memoryUsage: resources.memory
    },
    framework: 'Hono + Bun',
    performance: '10x faster than Express',
    safety: {
      timeoutMs: 30000,
      maxConcurrent: 3,
      memoryLimitMB: 2048
    }
  });
});

// API Routes
app.route('/api/characters', characterRoutes);
app.route('/api/emergency', emergencyRoutes);
app.route('/api/chat-sessions', chatSessionRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/locations', locationsRoutes);
app.route('/api/setting-locations', settingLocationsRoutes);
// app.route('/api/upload', uploadRoutes);

// Serve uploaded files (for future implementation)
// app.use('/uploads/*', serveStatic({ root: './uploads' }));

console.log(`🚀 Hono + Bun server starting on port ${PORT}`);
console.log(`💚 Health check: http://localhost:${PORT}/health`);
console.log(`👥 Characters API: http://localhost:${PORT}/api/characters`);
console.log(`💬 Chat Sessions API: http://localhost:${PORT}/api/chat-sessions`);
console.log(`⚙️  Settings API: http://localhost:${PORT}/api/settings`);
console.log(`📍 Locations API: http://localhost:${PORT}/api/locations`);
console.log(`🚨 Emergency API: http://localhost:${PORT}/api/emergency/status`);
console.log(`🛡️  LLM Safety: Enabled with 30s timeout, 3 max concurrent`);
console.log(`🔥 Ready for high-performance operations!`);

// Start server with Bun
export default {
  port: PORT,
  fetch: app.fetch,
};