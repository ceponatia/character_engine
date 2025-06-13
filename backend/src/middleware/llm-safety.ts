import type { Context } from 'hono';

// LLM Safety Configuration for KoboldCpp
export const LLM_CONFIG = {
  TIMEOUT: 60000,           // 60 seconds max for testing
  MAX_TOKENS: 2048,         // Token limit per request
  MAX_PROMPT_LENGTH: 5000,  // Character limit for prompts
  MEMORY_CHECK_INTERVAL: 5000, // Check memory every 5 seconds
  MAX_CONCURRENT: 3,        // Max concurrent LLM requests
  KOBOLD_BASE_URL: 'http://localhost:5001', // KoboldCpp server
  KOBOLD_GENERATE_ENDPOINT: '/api/v1/generate',
  KOBOLD_CHAT_ENDPOINT: '/v1/chat/completions',
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
    stop_sequences?: string[];
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
      prompt: prompt,
      max_length: Math.min(options.max_tokens || 150, 150), // Limit response length for testing
      temperature: options.temperature || 1.2,  // High temp for creativity
      temperature_last: true,
      top_p: 1.0,        // Full probability mass
      top_k: 0,          // Disable top_k
      min_p: 0.1,        // Min probability sampling
      rep_pen: 1.05,     // KoboldCpp uses 'rep_pen' not 'repeat_penalty'
      rep_pen_range: -1, // KoboldCpp format
      stop_sequence: options.stop_sequences || [], // Stop sequences
      trim: true,        // Trim whitespace
      typical_p: 1.0,    // Disable typical_p
      tfs: 1.0,          // Disable tail free sampling
      use_default_badwordsids: false
    };

    console.log(`🔄 Sending request to KoboldCpp:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${LLM_CONFIG.KOBOLD_BASE_URL}${LLM_CONFIG.KOBOLD_GENERATE_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    console.log(`📡 KoboldCpp response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ KoboldCpp error response:`, errorText);
      throw new Error(`LLM API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    let result;
    try {
      const responseText = await response.text();
      console.log('📋 Raw LLM response length:', responseText.length);
      console.log('📋 Raw LLM response preview:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
      
      result = JSON.parse(responseText);
      
      // KoboldCpp returns results array with text field
      if (result.results && result.results[0] && result.results[0].text) {
        console.log('✅ Generated response preview:', result.results[0].text.substring(0, 200) + (result.results[0].text.length > 200 ? '...' : ''));
      }
      
    } catch (parseError: any) {
      console.error(`❌ JSON parse error:`, parseError.message);
      throw new Error(`Failed to parse JSON: ${parseError.message}`);
    }
    const duration = Date.now() - (requestStartTimes.get(requestId) || Date.now());
    
    console.log(`✅ LLM request ${requestId} completed in ${duration}ms`);
    
    // Return consistent response format (adapted from KoboldCpp)
    return {
      response: result.results?.[0]?.text || 'I apologize, but I had trouble generating a response.',
      model: 'koboldcpp',
      eval_count: result.results?.[0]?.completion_tokens || 0,
      prompt_eval_count: result.results?.[0]?.prompt_tokens || 0
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
 * Safe LLM chat request using structured messages (preferred method)
 */
export async function safeLLMChatRequest(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    requestId?: string;
  } = {}
): Promise<any> {
  const requestId = options.requestId || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Check concurrent request limit
  if (activeRequests.size >= LLM_CONFIG.MAX_CONCURRENT) {
    throw new Error(`Too many concurrent requests. Max ${LLM_CONFIG.MAX_CONCURRENT} allowed.`);
  }

  // Validate total message length
  const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
  if (totalLength > LLM_CONFIG.MAX_PROMPT_LENGTH) {
    throw new Error(`Messages too long. Max ${LLM_CONFIG.MAX_PROMPT_LENGTH} characters allowed.`);
  }

  // Track active request
  activeRequests.add(requestId);
  requestStartTimes.set(requestId, Date.now());

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(`🚨 LLM chat request ${requestId} timed out after ${LLM_CONFIG.TIMEOUT}ms`);
    controller.abort();
  }, LLM_CONFIG.TIMEOUT);

  try {
    console.log(`🔄 Starting LLM chat request ${requestId} (${activeRequests.size}/${LLM_CONFIG.MAX_CONCURRENT} active)`);
    
    const chatRequest = {
      model: 'koboldcpp',
      messages: messages,
      stream: false,
      temperature: options.temperature || 1.2,  // High temp for creativity
      max_tokens: options.max_tokens || 512,
      top_p: 1.0,        // Full probability mass
      top_k: 0,          // Disable top_k
      // KoboldCpp specific parameters via 'extra'
      extra: {
        min_p: 0.1,        // Min probability sampling
        rep_pen: 1.05,     // Light repetition penalty
        rep_pen_range: -1,
        temperature_last: true,
        typical_p: 1.0,
        tfs: 1.0,
        use_default_badwordsids: false
      }
    };

    console.log('🔄 Sending chat request to KoboldCpp with', messages.length, 'messages');

    const response = await fetch(`${LLM_CONFIG.KOBOLD_BASE_URL}${LLM_CONFIG.KOBOLD_CHAT_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chatRequest),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📡 KoboldCpp chat response error:', response.status, errorText);
      throw new Error(`KoboldCpp API error: ${response.status} ${errorText}`);
    }

    console.log('📡 KoboldCpp chat response status:', response.status, response.statusText);

    const responseText = await response.text();
    console.log('📋 Raw LLM chat response length:', responseText.length);

    let result;
    try {
      result = JSON.parse(responseText);
      
      // KoboldCpp OpenAI-compatible format: choices[0].message.content
      if (result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) {
        console.log('✅ Generated chat response preview:', result.choices[0].message.content.substring(0, 200) + (result.choices[0].message.content.length > 200 ? '...' : ''));
      }
      
    } catch (parseError: any) {
      console.error(`❌ JSON parse error:`, parseError.message);
      throw new Error(`Failed to parse JSON: ${parseError.message}`);
    }
    
    const duration = Date.now() - (requestStartTimes.get(requestId) || Date.now());
    console.log(`✅ LLM chat request ${requestId} completed in ${duration}ms`);
    
    // Return in consistent format (adapted from KoboldCpp OpenAI format)
    return {
      response: result.choices?.[0]?.message?.content || 'I apologize, but I had trouble generating a response.',
      model: result.model || 'koboldcpp',
      eval_count: result.usage?.completion_tokens || 0,
      prompt_eval_count: result.usage?.prompt_tokens || 0
    };

  } catch (error: any) {
    const duration = Date.now() - (requestStartTimes.get(requestId) || Date.now());
    
    if (error.name === 'AbortError') {
      console.error(`🚨 LLM chat request ${requestId} aborted after ${duration}ms - TIMEOUT`);
      throw new Error('LLM request timed out. Please try a shorter conversation or check system resources.');
    }
    
    console.error(`❌ LLM chat request ${requestId} failed after ${duration}ms:`, error.message);
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

console.log('🛡️  LLM Safety middleware initialized for KoboldCpp');
console.log(`📊 Limits: ${LLM_CONFIG.TIMEOUT}ms timeout, ${LLM_CONFIG.MAX_TOKENS} tokens, ${LLM_CONFIG.MAX_CONCURRENT} concurrent`);
console.log(`🔗 KoboldCpp URL: ${LLM_CONFIG.KOBOLD_BASE_URL}`);