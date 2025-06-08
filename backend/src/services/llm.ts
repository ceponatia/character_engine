import { Ollama } from 'ollama';

export interface LLMConfig {
  host: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  stream: boolean;
}

export interface LLMResponse {
  content: string;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class LLMService {
  private ollama: Ollama;
  private config: LLMConfig;

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      host: config?.host || process.env.OLLAMA_HOST || 'http://localhost:11434',
      model: config?.model || process.env.OLLAMA_MODEL || 'nous-hermes2',
      temperature: config?.temperature || 0.7, // Higher creativity for romance/roleplay
      maxTokens: config?.maxTokens || 200,     // Longer responses for better conversation
      topP: config?.topP || 0.9,               // More diverse token selection
      stream: config?.stream || false
    };

    this.ollama = new Ollama({
      host: this.config.host
    });
  }

  async generateResponse(prompt: string): Promise<LLMResponse> {
    try {
      console.log(`🤖 Generating response with model: ${this.config.model}`);
      console.log(`🎯 Prompt length: ${prompt.length} characters`);

      const response = await this.ollama.generate({
        model: this.config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: this.config.temperature,
          top_p: this.config.topP,
          num_predict: this.config.maxTokens,
          stop: ['\nUser:', '\n\n', 'User:', '\nHuman:', 'Human:', '\n\n\n', '(']
        }
      });

      console.log(`✅ Response generated successfully`);
      console.log(`📝 Response length: ${response.response.length} characters`);

      return {
        content: response.response.trim(),
        finishReason: response.done ? 'stop' : 'length',
        usage: {
          promptTokens: 0, // Ollama doesn't provide token counts
          completionTokens: 0,
          totalTokens: 0
        }
      };

    } catch (error) {
      console.error('❌ LLM Generation Error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          throw new Error('Failed to connect to Ollama. Make sure Ollama is running on ' + this.config.host);
        }
        if (error.message.includes('model not found')) {
          throw new Error(`Model "${this.config.model}" not found. Please pull the model first: ollama pull ${this.config.model}`);
        }
      }
      
      throw new Error(`LLM generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateStreamingResponse(
    prompt: string, 
    onChunk: (chunk: string) => void
  ): Promise<LLMResponse> {
    try {
      console.log(`🤖 Generating streaming response with model: ${this.config.model}`);

      let fullResponse = '';
      
      const response = await this.ollama.generate({
        model: this.config.model,
        prompt: prompt,
        stream: true,
        options: {
          temperature: this.config.temperature,
          top_p: this.config.topP,
          num_predict: this.config.maxTokens,
          stop: ['\nUser:', '\n\n', 'User:', '\nHuman:', 'Human:', '\n\n\n', '(']
        }
      });

      for await (const chunk of response) {
        if (chunk.response) {
          fullResponse += chunk.response;
          onChunk(chunk.response);
        }
      }

      console.log(`✅ Streaming response completed`);
      console.log(`📝 Final response length: ${fullResponse.length} characters`);

      return {
        content: fullResponse.trim(),
        finishReason: 'stop',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
      };

    } catch (error) {
      console.error('❌ LLM Streaming Error:', error);
      throw new Error(`LLM streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async checkModelAvailability(): Promise<boolean> {
    try {
      const models = await this.ollama.list();
      const modelExists = models.models.some(model => 
        model.name === this.config.model || 
        model.name.startsWith(this.config.model)
      );
      
      if (!modelExists) {
        console.log(`📋 Available models:`, models.models.map(m => m.name));
        console.log(`❌ Model "${this.config.model}" not found`);
        console.log(`💡 To install: ollama pull ${this.config.model}`);
      }
      
      return modelExists;
    } catch (error) {
      console.error('❌ Failed to check model availability:', error);
      return false;
    }
  }

  async healthCheck(): Promise<{ status: string; model: string; available: boolean }> {
    try {
      const available = await this.checkModelAvailability();
      return {
        status: available ? 'healthy' : 'model_not_found',
        model: this.config.model,
        available
      };
    } catch (error) {
      return {
        status: 'error',
        model: this.config.model,
        available: false
      };
    }
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.host) {
      this.ollama = new Ollama({ host: this.config.host });
    }
  }
}

// Singleton instance for the application
export const llmService = new LLMService();