// TypeScript types for Supabase database schema
export interface Database {
  public: {
    Tables: {
      characters: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
          archetype: string
          chatbot_role: string
          description: string | null
          colors: string[]
          tone: string[]
          primary_traits: string[]
          secondary_traits: string[]
          greeting: string | null
          source_material: string | null
          conceptual_age: string | null
          full_bio: string | null
          core_persona_summary: string | null
          attire: string | null
          features: string | null
          image_url: string | null
          avatar_image: string | null
          pacing: string | null
          inflection: string | null
          vocabulary: string | null
          quirks: string[]
          interruption_tolerance: string
          primary_motivation: string | null
          core_goal: string | null
          secondary_goals: string[]
          core_abilities: string[]
          approach: string | null
          patience: string | null
          demeanor: string | null
          adaptability: string | null
          affirmation: string | null
          comfort: string | null
          default_intro_message: string | null
          forbidden_topics: string[]
          interaction_policy: string | null
          conflict_resolution: string | null
          owner_id: string | null
        }
        Insert: {
          id?: string
          name: string
          archetype: string
          chatbot_role: string
          description?: string | null
          colors?: string[]
          tone?: string[]
          primary_traits?: string[]
          secondary_traits?: string[]
          greeting?: string | null
          [key: string]: any
        }
        Update: {
          [key: string]: any
        }
      }
      character_memories: {
        Row: {
          id: string
          created_at: string
          content: string
          summary: string | null
          memory_type: string
          embedding: number[] | null
          emotional_weight: number
          importance: string
          day_number: number | null
          time_of_day: string | null
          location: string | null
          related_characters: string[]
          topics: string[]
          character_id: string | null
          session_id: string | null
        }
        Insert: {
          content: string
          memory_type: string
          embedding?: number[] | null
          character_id?: string | null
          [key: string]: any
        }
        Update: {
          [key: string]: any
        }
      }
      chat_sessions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          character_id: string | null
          user_id: string | null
          title: string | null
          last_activity: string
          session_type: string
          metadata: Record<string, any>
        }
        Insert: {
          id?: string
          character_id?: string | null
          user_id?: string | null
          title?: string | null
          session_type?: string
          metadata?: Record<string, any>
        }
        Update: {
          title?: string | null
          last_activity?: string
          metadata?: Record<string, any>
        }
      }
      messages: {
        Row: {
          id: string
          created_at: string
          session_id: string
          content: string
          role: 'user' | 'assistant' | 'system'
          character_id: string | null
          response_time_ms: number | null
          metadata: Record<string, any>
          embedding: number[] | null
        }
        Insert: {
          id?: string
          session_id: string
          content: string
          role: 'user' | 'assistant' | 'system'
          character_id?: string | null
          response_time_ms?: number | null
          metadata?: Record<string, any>
          embedding?: number[] | null
        }
        Update: {
          content?: string
          metadata?: Record<string, any>
        }
      }
      settings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          theme: string | null
          atmosphere: string | null
          time_period: string | null
          style_notes: string | null
          owner_id: string | null
          is_public: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          theme?: string | null
          atmosphere?: string | null
          time_period?: string | null
          style_notes?: string | null
          owner_id?: string | null
          is_public?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          theme?: string | null
          atmosphere?: string | null
          time_period?: string | null
          style_notes?: string | null
          is_public?: boolean
        }
      }
      locations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          setting_id: string | null
          atmosphere: string | null
          details: Record<string, any>
          owner_id: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          setting_id?: string | null
          atmosphere?: string | null
          details?: Record<string, any>
          owner_id?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          atmosphere?: string | null
          details?: Record<string, any>
        }
      }
      stories: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          setting_id: string | null
          characters: string[]
          locations: string[]
          status: string
          owner_id: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          setting_id?: string | null
          characters?: string[]
          locations?: string[]
          status?: string
          owner_id?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          setting_id?: string | null
          characters?: string[]
          locations?: string[]
          status?: string
        }
      }
    }
  }
}

export type Character = Database['public']['Tables']['characters']['Row']
export type CharacterInsert = Database['public']['Tables']['characters']['Insert']
export type CharacterMemory = Database['public']['Tables']['character_memories']['Row']

export type ChatSession = Database['public']['Tables']['chat_sessions']['Row']
export type ChatSessionInsert = Database['public']['Tables']['chat_sessions']['Insert']
export type ChatSessionUpdate = Database['public']['Tables']['chat_sessions']['Update']

export type Message = Database['public']['Tables']['messages']['Row']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type MessageUpdate = Database['public']['Tables']['messages']['Update']

export type Setting = Database['public']['Tables']['settings']['Row']
export type SettingInsert = Database['public']['Tables']['settings']['Insert']
export type SettingUpdate = Database['public']['Tables']['settings']['Update']

export type Location = Database['public']['Tables']['locations']['Row']
export type LocationInsert = Database['public']['Tables']['locations']['Insert']
export type LocationUpdate = Database['public']['Tables']['locations']['Update']

export type Story = Database['public']['Tables']['stories']['Row']
export type StoryInsert = Database['public']['Tables']['stories']['Insert']
export type StoryUpdate = Database['public']['Tables']['stories']['Update']