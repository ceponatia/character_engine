import express, { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { characterEngine } from '../services/character-engine';

const router = express.Router();

// Create a new character
router.post('/', async (req: Request, res: Response) => {
  try {
    const characterData = req.body.characterBio;
    
    // For now, create a default user if none exists (single-user mode)
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          username: 'default_user',
          email: 'user@chatbot.local'
        }
      });
    }

    const character = await prisma.character.create({
      data: {
        name: characterData.name,
        ownerId: user.id,
        
        // Identity
        sourceMaterial: characterData.identity?.sourceMaterial,
        archetype: characterData.identity?.archetype || '',
        chatbotRole: characterData.identity?.chatbotRole || '',
        conceptualAge: characterData.identity?.conceptualAge,
        
        // Visual Avatar
        description: characterData.presentation?.visualAvatar?.description,
        attire: characterData.presentation?.visualAvatar?.attire,
        colors: characterData.presentation?.visualAvatar?.colors || [],
        features: characterData.presentation?.visualAvatar?.features,
        avatarImage: characterData.presentation?.visualAvatar?.avatarImage,
        
        // Vocal Style
        tone: characterData.presentation?.vocalStyle?.tone || [],
        pacing: characterData.presentation?.vocalStyle?.pacing,
        inflection: characterData.presentation?.vocalStyle?.inflection,
        vocabulary: characterData.presentation?.vocalStyle?.vocabulary,
        
        // Personality
        primaryTraits: characterData.personality?.primaryTraits || [],
        secondaryTraits: characterData.personality?.secondaryTraits || [],
        quirks: characterData.personality?.quirks || [],
        interruptionTolerance: characterData.personality?.interruptionTolerance || 'medium',
        
        // Operational Directives
        primaryMotivation: characterData.operationalDirectives?.primaryMotivation,
        coreGoal: characterData.operationalDirectives?.coreGoal,
        secondaryGoals: characterData.operationalDirectives?.secondaryGoals || [],
        
        // Interaction Model
        coreAbilities: characterData.interactionModel?.coreAbilities || [],
        approach: characterData.interactionModel?.style?.approach,
        patience: characterData.interactionModel?.style?.patience,
        demeanor: characterData.interactionModel?.style?.demeanor,
        adaptability: characterData.interactionModel?.style?.adaptability,
        
        // Signature Phrases
        greeting: characterData.interactionModel?.signaturePhrases?.greeting,
        affirmation: characterData.interactionModel?.signaturePhrases?.affirmation,
        comfort: characterData.interactionModel?.signaturePhrases?.comfort,
        
        // Default intro message for new stories
        defaultIntroMessage: characterData.defaultIntroMessage,
        
        // Boundaries
        forbiddenTopics: characterData.boundaries?.forbiddenTopics || [],
        interactionPolicy: characterData.boundaries?.interactionPolicy,
        conflictResolution: characterData.boundaries?.conflictResolution,
      }
    });

    res.status(201).json({
      success: true,
      character: {
        id: character.id,
        name: character.name,
        archetype: character.archetype,
        chatbotRole: character.chatbotRole
      }
    });
  } catch (error) {
    console.error('Error creating character:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create character',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all characters for the user
router.get('/', async (req: Request, res: Response) => {
  try {
    // For single-user mode, get the first user's characters
    const user = await prisma.user.findFirst();
    if (!user) {
      return res.json({ characters: [] });
    }

    const characters = await prisma.character.findMany({
      where: {
        ownerId: user.id
      },
      select: {
        id: true,
        name: true,
        archetype: true,
        chatbotRole: true,
        description: true,
        createdAt: true,
        primaryTraits: true,
        colors: true,
        tone: true,
        avatarImage: true,
        imageUrl: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // No parsing needed - arrays are native now
    return res.json({ characters });
  } catch (error) {
    console.error('Error fetching characters:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch characters' 
    });
  }
});

// Get a specific character by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const character = await prisma.character.findUnique({
      where: {
        id: req.params.id
      }
    });

    if (!character) {
      return res.status(404).json({ 
        success: false, 
        error: 'Character not found' 
      });
    }

    return res.json({ character });
  } catch (error) {
    console.error('Error fetching character:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch character' 
    });
  }
});

// Delete a character
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.character.delete({
      where: {
        id: req.params.id
      }
    });

    res.json({ 
      success: true, 
      message: 'Character deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting character:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete character' 
    });
  }
});

// Clear conversation history for a specific character
router.post('/:id/clear-history', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (userId) {
      // Clear specific user's conversation with character
      characterEngine.clearConversationHistory(req.params.id, userId);
    } else {
      // Clear all conversations for character
      characterEngine.clearConversationHistoryForCharacter(req.params.id);
    }
    res.json({ 
      success: true, 
      message: `Conversation history cleared for character ${req.params.id}` 
    });
  } catch (error) {
    console.error('Error clearing conversation history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear conversation history' 
    });
  }
});

// Get conversation history for a character and user
router.get('/:id/history/:userId', async (req: Request, res: Response) => {
  try {
    const history = characterEngine.getConversationHistory(req.params.id, req.params.userId);
    res.json({ 
      success: true, 
      history: history.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp
      }))
    });
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch conversation history' 
    });
  }
});

// Clear all conversation history (debugging endpoint)
router.post('/clear-all-history', async (req: Request, res: Response) => {
  try {
    characterEngine.clearAllConversationHistory();
    res.json({ 
      success: true, 
      message: 'All conversation history cleared' 
    });
  } catch (error) {
    console.error('Error clearing all conversation history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear all conversation history' 
    });
  }
});

export default router;