import { Context, Next } from 'hono';

interface RateLimitConfig {
  requests: number;
  windowMs: number;
  message?: string;
  skipOnError?: boolean;
}

interface ClientData {
  count: number;
  resetTime: number;
  firstRequestTime: number;
}

const requestCounts = new Map<string, ClientData>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimitMiddleware(config: RateLimitConfig) {
  const { 
    requests = 100, 
    windowMs = 15 * 60 * 1000, // 15 minutes
    message = 'Too many requests, please try again later',
    skipOnError = false 
  } = config;

  return async (c: Context, next: Next) => {
    try {
      const clientKey = getClientKey(c);
      const now = Date.now();
      
      let clientData = requestCounts.get(clientKey);
      
      // Initialize or reset if window expired
      if (!clientData || now > clientData.resetTime) {
        clientData = {
          count: 1,
          resetTime: now + windowMs,
          firstRequestTime: now
        };
        requestCounts.set(clientKey, clientData);
        return next();
      }
      
      // Check if limit exceeded
      if (clientData.count >= requests) {
        const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
        
        c.header('Retry-After', retryAfter.toString());
        c.header('X-RateLimit-Limit', requests.toString());
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', Math.ceil(clientData.resetTime / 1000).toString());
        
        return c.json({
          error: 'Rate limit exceeded',
          message,
          retryAfter,
          limit: requests,
          window: windowMs / 1000
        }, 429);
      }
      
      // Increment counter
      clientData.count++;
      
      // Add rate limit headers
      c.header('X-RateLimit-Limit', requests.toString());
      c.header('X-RateLimit-Remaining', (requests - clientData.count).toString());
      c.header('X-RateLimit-Reset', Math.ceil(clientData.resetTime / 1000).toString());
      
      await next();
      
    } catch (error) {
      console.error('Rate limiting error:', error);
      
      if (skipOnError) {
        await next();
      } else {
        return c.json({
          error: 'Rate limiting service error',
          message: 'Unable to process rate limiting'
        }, 500);
      }
    }
  };
}

function getClientKey(c: Context): string {
  // Try to get IP from various headers
  const forwarded = c.req.header('x-forwarded-for');
  const realIp = c.req.header('x-real-ip');
  const cfConnectingIp = c.req.header('cf-connecting-ip');
  
  let ip = 'unknown';
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    ip = forwarded.split(',')[0].trim();
  } else if (realIp) {
    ip = realIp;
  } else if (cfConnectingIp) {
    ip = cfConnectingIp;
  }
  
  // For authenticated users, include user ID for more accurate limiting
  const userId = c.get('userId');
  if (userId) {
    return `user:${userId}:${ip}`;
  }
  
  return `ip:${ip}`;
}

// Preset rate limit configurations
export const strictRateLimit = rateLimitMiddleware({
  requests: 20,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests. Please wait before trying again.'
});

export const moderateRateLimit = rateLimitMiddleware({
  requests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Rate limit exceeded. Please try again later.'
});

export const lenientRateLimit = rateLimitMiddleware({
  requests: 1000,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests. Please wait before trying again.'
});

// Specific rate limits for different operations
export const authRateLimit = rateLimitMiddleware({
  requests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
});

export const createRateLimit = rateLimitMiddleware({
  requests: 50,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many creation requests. Please wait before creating more resources.'
});

export const chatRateLimit = rateLimitMiddleware({
  requests: 200,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many chat messages. Please wait before sending more messages.'
});