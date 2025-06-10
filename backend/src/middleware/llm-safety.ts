import type { Context } from 'hono';

// LLM Safety Configuration
export const LLM_CONFIG = {
  TIMEOUT: 30000,           // 30 seconds max
  MAX_TOKENS: 2048,         // Token limit per request
  MAX_PROMPT_LENGTH: 5000,  // Character limit for prompts
  MEMORY_CHECK_INTERVAL: 5000, // Check memory every 5 seconds
  MAX_CONCURRENT: 3,        // Max concurrent LLM requests
} as const;

// Request tracking
const activeRequests = new Set<string>();
const requestStartTimes = new Map<string, number>();

// Memory monitoring
let memoryWarningLogged = false;

/**
 * Safe LLM request wrapper with timeout and abort controls
 */
export async function safeLLMRequest(
  prompt: string, 
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    requestId?: string;
  } = {}
): Promise<any> {
  const requestId = options.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Check concurrent request limit
  if (activeRequests.size >= LLM_CONFIG.MAX_CONCURRENT) {
    throw new Error(`Too many concurrent requests. Max ${LLM_CONFIG.MAX_CONCURRENT} allowed.`);
  }

  // Validate prompt length
  if (prompt.length > LLM_CONFIG.MAX_PROMPT_LENGTH) {
    throw new Error(`Prompt too long. Max ${LLM_CONFIG.MAX_PROMPT_LENGTH} characters allowed.`);
  }

  // Track active request
  activeRequests.add(requestId);
  requestStartTimes.set(requestId, Date.now());

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(`🚨 LLM request ${requestId} timed out after ${LLM_CONFIG.TIMEOUT}ms`);
    controller.abort();
  }, LLM_CONFIG.TIMEOUT);

  try {
    console.log(`🔄 Starting LLM request ${requestId} (${activeRequests.size}/${LLM_CONFIG.MAX_CONCURRENT} active)`);
    
    const requestBody = {
      model: options.model || 'pygmalion2-7b', // Default to available model
      prompt: prompt, // Use the formatted prompt directly
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        num_predict: Math.min(options.max_tokens || LLM_CONFIG.MAX_TOKENS, LLM_CONFIG.MAX_TOKENS)
      }
    };

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    let result;
    try {
      const responseText = await response.text();
      console.log('DEBUG: Raw LLM response:', responseText);
      result = JSON.parse(responseText);
    } catch (parseError: any) {
      throw new Error(`Failed to parse JSON: ${parseError.message}`);
    }
    const duration = Date.now() - (requestStartTimes.get(requestId) || Date.now());
    
    console.log(`✅ LLM request ${requestId} completed in ${duration}ms`);
    
    // Return generate API response format
    return {
      response: result.response || 'I apologize, but I had trouble generating a response.',
      model: result.model,
      eval_count: result.eval_count,
      prompt_eval_count: result.prompt_eval_count
    };

  } catch (error: any) {
    const duration = Date.now() - (requestStartTimes.get(requestId) || Date.now());
    
    if (error.name === 'AbortError') {
      console.error(`🚨 LLM request ${requestId} aborted after ${duration}ms - TIMEOUT`);
      throw new Error('LLM request timed out. Please try a shorter prompt or check system resources.');
    }
    
    console.error(`❌ LLM request ${requestId} failed after ${duration}ms:`, error.message);
    throw error;
  } finally {
    // Cleanup
    clearTimeout(timeoutId);
    activeRequests.delete(requestId);
    requestStartTimes.delete(requestId);
  }
}

/**
 * Emergency stop all LLM processes
 */
export async function emergencyStopLLM(): Promise<{ stopped: string[], errors: string[] }> {
  console.log('🚨 EMERGENCY: Stopping all LLM processes...');
  
  const stopped: string[] = [];
  const errors: string[] = [];

  // Cancel all active requests
  for (const requestId of activeRequests) {
    try {
      activeRequests.delete(requestId);
      requestStartTimes.delete(requestId);
      stopped.push(`Request ${requestId}`);
    } catch (error: any) {
      errors.push(`Request ${requestId}: ${error.message}`);
    }
  }

  // Try to kill Ollama processes
  try {
    const { spawn } = await import('child_process');
    const killProcess = spawn('pkill', ['-f', 'ollama']);
    
    await new Promise((resolve, reject) => {
      killProcess.on('close', (code) => {
        if (code === 0 || code === 1) { // 1 means no processes found - ok
          stopped.push('Ollama processes');
          resolve(code);
        } else {
          reject(new Error(`pkill failed with code ${code}`));
        }
      });
      killProcess.on('error', reject);
    });
  } catch (error: any) {
    errors.push(`Ollama kill: ${error.message}`);
  }

  return { stopped, errors };
}

/**
 * Get system resource usage
 */
export async function getResourceUsage(): Promise<any> {
  try {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    };

    // Check if memory usage is concerning
    const totalMemoryMB = memUsageMB.rss;
    if (totalMemoryMB > 1024 && !memoryWarningLogged) { // 1GB threshold
      console.warn(`⚠️  High memory usage detected: ${totalMemoryMB}MB RSS`);
      memoryWarningLogged = true;
    }

    return {
      memory: memUsageMB,
      activeRequests: activeRequests.size,
      requestQueue: Array.from(activeRequests),
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('Error getting resource usage:', error.message);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Middleware to check system resources before LLM requests
 */
export async function resourceCheckMiddleware(c: Context, next: () => Promise<void>) {
  const resources = await getResourceUsage();
  
  // Block requests if too many active
  if (resources.activeRequests >= LLM_CONFIG.MAX_CONCURRENT) {
    return c.json({
      error: 'System overloaded',
      message: `Too many active requests (${resources.activeRequests}/${LLM_CONFIG.MAX_CONCURRENT})`,
      retryAfter: 30
    }, 429);
  }

  // Block if memory usage is critical (over 2GB)
  if (resources.memory?.rss > 2048) {
    console.error(`🚨 Critical memory usage: ${resources.memory.rss}MB - Blocking new requests`);
    return c.json({
      error: 'System overloaded',
      message: 'Memory usage too high. Please try again later.',
      retryAfter: 60
    }, 503);
  }

  await next();
}

// Periodic memory monitoring
setInterval(async () => {
  const resources = await getResourceUsage();
  if (resources.memory?.rss > 1536) { // 1.5GB warning
    console.warn(`⚠️  Memory usage: ${resources.memory.rss}MB RSS, ${resources.activeRequests} active requests`);
  }
}, LLM_CONFIG.MEMORY_CHECK_INTERVAL);

console.log('🛡️  LLM Safety middleware initialized');
console.log(`📊 Limits: ${LLM_CONFIG.TIMEOUT}ms timeout, ${LLM_CONFIG.MAX_TOKENS} tokens, ${LLM_CONFIG.MAX_CONCURRENT} concurrent`);