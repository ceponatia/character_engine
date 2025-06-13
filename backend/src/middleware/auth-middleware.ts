import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';

/**
 * Authentication middleware that extracts user ID from session cookie
 * and adds it to request headers and context for downstream use
 */
export async function authMiddleware(c: Context, next: Next) {
  const sessionUserId = getCookie(c, 'session_user_id');
  
  if (sessionUserId) {
    c.req.header('x-user-id', sessionUserId);
    c.set('userId', sessionUserId);
  }
  
  await next();
}

/**
 * Middleware that requires authentication - returns 401 if not logged in
 */
export async function requireAuth(c: Context, next: Next) {
  const sessionUserId = getCookie(c, 'session_user_id');
  
  if (!sessionUserId) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  c.req.header('x-user-id', sessionUserId);
  c.set('userId', sessionUserId);
  await next();
}

/**
 * Helper to get current user ID from request
 */
export function getCurrentUserId(c: Context): string | undefined {
  return c.req.header('x-user-id');
}