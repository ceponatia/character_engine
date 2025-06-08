import { CharacterPersonality } from './prompt-builder';

export interface CharacterTemplate {
  greeting: string;
  responses: {
    [key: string]: string[];
  };
  fallback: string;
}

export interface MessageType {
  type: 'greeting' | 'question' | 'compliment' | 'comfort_needed' | 'general';
  keywords: string[];
}

export class CharacterTemplateEngine {
  private static messageTypes: MessageType[] = [
    {
      type: 'greeting',
      keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'how are you']
    },
    {
      type: 'question',
      keywords: ['what', 'how', 'why', 'when', 'where', 'who', 'can you', 'do you']
    },
    {
      type: 'compliment',
      keywords: ['beautiful', 'amazing', 'wonderful', 'love', 'like you', 'gorgeous']
    },
    {
      type: 'comfort_needed',
      keywords: ['sad', 'worried', 'anxious', 'help', 'problem', 'difficult', 'hard time']
    }
  ];

  static detectMessageType(message: string): 'greeting' | 'question' | 'compliment' | 'comfort_needed' | 'general' {
    const lowerMessage = message.toLowerCase();
    
    for (const messageType of this.messageTypes) {
      if (messageType.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return messageType.type;
      }
    }
    
    return 'general';
  }

  static buildCharacterTemplate(character: CharacterPersonality): CharacterTemplate {
    const template: CharacterTemplate = {
      greeting: character.greeting || `Hello, I'm ${character.name}.`,
      responses: {
        greeting: [
          character.greeting || `The stars have aligned for our meeting, dear one.`,
          `Welcome, traveler. ${character.name} greets you warmly.`,
          `Ah, a kindred spirit approaches. How may I assist you today?`
        ],
        question: [
          `${character.affirmation || 'Indeed'}, let me share what I know.`,
          `That's a thoughtful question. Allow me to reflect...`,
          `Wisdom comes to those who seek it earnestly.`
        ],
        compliment: [
          `Your words warm my heart like starlight.`,
          `${character.affirmation || 'Thank you'}, dear one.`,
          `Such kindness illuminates the path ahead.`
        ],
        comfort_needed: [
          character.comfort || `Even in darkness, the moon guides us home.`,
          `Let me offer you the solace of ancient wisdom.`,
          `In times of trouble, remember that this too shall pass.`
        ],
        general: [
          `${character.affirmation || 'Indeed'}, I understand.`,
          `Tell me more about your thoughts, dear one.`,
          `The conversation flows like a gentle stream.`
        ]
      },
      fallback: `I am ${character.name}, and I'm here to listen.`
    };

    return template;
  }

  static getTemplateResponse(
    character: CharacterPersonality, 
    messageType: 'greeting' | 'question' | 'compliment' | 'comfort_needed' | 'general'
  ): string {
    const template = this.buildCharacterTemplate(character);
    const responses = template.responses[messageType] || template.responses.general;
    
    // Return first response for now (later can randomize or choose based on context)
    return responses[0];
  }

  static shouldUseTemplate(character: CharacterPersonality, message: string): boolean {
    const messageType = this.detectMessageType(message);
    
    // Use templates for greetings and comfort, dynamic for questions and general
    return messageType === 'greeting' || messageType === 'comfort_needed';
  }
}