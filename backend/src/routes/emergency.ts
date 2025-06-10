import { Hono } from 'hono';
import { emergencyStopLLM, getResourceUsage } from '../middleware/llm-safety';

const app = new Hono();

/**
 * Emergency stop all LLM processes
 * POST /api/emergency/stop-llm
 */
app.post('/stop-llm', async (c) => {
  try {
    console.log('🚨 Emergency stop requested via API');
    const result = await emergencyStopLLM();
    
    return c.json({
      success: true,
      message: 'Emergency stop executed',
      stopped: result.stopped,
      errors: result.errors,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Emergency stop failed:', error);
    return c.json({
      success: false,
      error: 'Emergency stop failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

/**
 * Get system resource usage and LLM status
 * GET /api/emergency/status
 */
app.get('/status', async (c) => {
  try {
    const resources = await getResourceUsage();
    
    // Check Ollama status
    let ollamaStatus = 'unknown';
    try {
      const ollamaResponse = await fetch('http://localhost:11434/api/tags', {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      ollamaStatus = ollamaResponse.ok ? 'running' : 'error';
    } catch {
      ollamaStatus = 'offline';
    }

    // Determine overall system health
    const memoryMB = resources.memory?.rss || 0;
    const isHealthy = memoryMB < 1536 && resources.activeRequests < 3 && ollamaStatus === 'running';

    return c.json({
      healthy: isHealthy,
      resources,
      ollama: {
        status: ollamaStatus,
        endpoint: 'http://localhost:11434'
      },
      limits: {
        maxMemoryMB: 2048,
        maxConcurrentRequests: 3,
        timeoutMs: 30000
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Status check failed:', error);
    return c.json({
      healthy: false,
      error: 'Status check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

/**
 * Force garbage collection and memory cleanup
 * POST /api/emergency/cleanup
 */
app.post('/cleanup', async (c) => {
  try {
    console.log('🧹 Memory cleanup requested via API');
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('✅ Garbage collection executed');
    } else {
      console.log('⚠️  Garbage collection not available (run with --expose-gc)');
    }

    const resourcesBefore = await getResourceUsage();
    
    // Small delay to let GC complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const resourcesAfter = await getResourceUsage();
    
    return c.json({
      success: true,
      message: 'Memory cleanup executed',
      before: resourcesBefore.memory,
      after: resourcesAfter.memory,
      freed: {
        rss: (resourcesBefore.memory?.rss || 0) - (resourcesAfter.memory?.rss || 0),
        heapUsed: (resourcesBefore.memory?.heapUsed || 0) - (resourcesAfter.memory?.heapUsed || 0)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Memory cleanup failed:', error);
    return c.json({
      success: false,
      error: 'Memory cleanup failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

/**
 * Test LLM with safety mechanisms
 * POST /api/emergency/test-llm
 */
app.post('/test-llm', async (c) => {
  try {
    const body = await c.req.json();
    const { prompt = 'Hello, please respond briefly.', model = 'tinyllama' } = body;

    console.log(`🧪 Testing LLM with model: ${model}`);
    
    const { safeLLMRequest } = await import('../middleware/llm-safety');
    
    const startTime = Date.now();
    const result = await safeLLMRequest(prompt, {
      model,
      temperature: 0.3,
      max_tokens: 100, // Keep responses short for testing
      requestId: `test_${Date.now()}`
    });
    
    const duration = Date.now() - startTime;
    
    return c.json({
      success: true,
      message: 'LLM test completed successfully',
      duration,
      prompt,
      response: result.response?.substring(0, 200) + (result.response?.length > 200 ? '...' : ''),
      model: result.model,
      tokens: result.eval_count,
      safety: {
        timeoutMs: 30000,
        actualDurationMs: duration,
        withinLimits: duration < 30000
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('LLM test failed:', error);
    return c.json({
      success: false,
      error: 'LLM test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

export default app;