import { PrismaClient } from '@prisma/client';

// Initialize Prisma client with logging in development
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Database connection helper
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Graceful disconnect
export async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log('📦 Database disconnected');
}

// Health check function
export async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', database: 'connected' };
  } catch (error) {
    return { status: 'unhealthy', database: 'disconnected', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}