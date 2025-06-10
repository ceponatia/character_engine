import { Context, Next } from 'hono';
import { supabase } from '../utils/supabase-db';

export async function authMiddleware(c: Context, next: Next) {
  try {
    const authorization = c.req.header('Authorization');
    
    if (!authorization?.startsWith('Bearer ')) {
      return c.json({ 
        error: 'Authentication required',
        message: 'Please provide a valid authorization token'
      }, 401);
    }

    const token = authorization.slice(7);
    
    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return c.json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      }, 401);
    }

    // Add user context to request
    c.set('user', user);
    c.set('userId', user.id);
    c.set('userEmail', user.email);
    
    await next();
  } catch (error) {
    console.error('Authentication error:', error);
    return c.json({ 
      error: 'Authentication failed',
      message: 'Unable to verify authentication'
    }, 401);
  }
}

export async function optionalAuthMiddleware(c: Context, next: Next) {
  try {
    const authorization = c.req.header('Authorization');
    
    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.slice(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        c.set('user', user);
        c.set('userId', user.id);
        c.set('userEmail', user.email);
      }
    }
    
    await next();
  } catch (error) {
    // Log error but continue without auth
    console.warn('Optional auth failed:', error);
    await next();
  }
}

export function requireAdmin(c: Context, next: Next) {
  const user = c.get('user');
  
  if (!user?.app_metadata?.role === 'admin') {
    return c.json({
      error: 'Admin access required',
      message: 'This operation requires administrator privileges'
    }, 403);
  }
  
  return next();
}