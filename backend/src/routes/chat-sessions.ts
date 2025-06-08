import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helper function to generate session names
function generateSessionName(settingName: string, characterNames: string[]): string {
  const primaryCharacter = characterNames[0] || 'Character';
  const suffix = characterNames.length > 1 ? ` & ${characterNames.length - 1} others` : '';
  return `${primaryCharacter} in ${settingName}${suffix}`;
}

// GET /api/chat-sessions - Get all chat sessions for user
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    
    // For now, use a default user ID (in production, get from auth)
    const defaultUserId = 'default-user';
    
    // Ensure default user exists
    await prisma.user.upsert({
      where: { id: defaultUserId },
      update: {},
      create: { id: defaultUserId, username: 'default' }
    });

    const sessions = await prisma.chatSession.findMany({
      where: { ownerId: defaultUserId },
      include: {
        setting: {
          select: {
            name: true,
            theme: true,
            settingType: true
          }
        },
        characters: {
          include: {
            character: {
              select: {
                name: true,
                archetype: true
              }
            }
          }
        },
        messages: {
          select: {
            id: true
          }
        }
      },
      orderBy: { lastActivity: 'desc' },
      take: limit
    });

    // Transform to frontend format
    const transformedSessions = sessions.map(session => ({
      id: session.id,
      name: session.name,
      lastActivity: session.lastActivity.toISOString(),
      createdAt: session.createdAt.toISOString(),
      setting: {
        name: session.setting.name,
        theme: session.setting.theme,
        settingType: session.setting.settingType
      },
      characters: session.characters.map(sc => ({
        characterId: sc.characterId,
        character: {
          name: sc.character.name,
          archetype: sc.character.archetype
        },
        introMessage: sc.introMessage
      })),
      messageCount: session.messages.length
    }));

    res.json({
      success: true,
      sessions: transformedSessions
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat sessions'
    });
  }
});

// GET /api/chat-sessions/:id - Get specific chat session
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const session = await prisma.chatSession.findUnique({
      where: { id },
      include: {
        setting: true,
        characters: {
          include: {
            character: true
          }
        },
        messages: {
          orderBy: { timestamp: 'asc' },
          include: {
            chatSession: false // Avoid circular reference
          }
        }
      }
    });

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
      return;
    }

    // Transform messages to frontend format
    const transformedMessages = session.messages.map(msg => ({
      id: msg.id,
      text: msg.content,
      sender: msg.sender,
      characterName: msg.characterId ? 
        session.characters.find(sc => sc.characterId === msg.characterId)?.character.name : 
        undefined,
      characterId: msg.characterId,
      timestamp: msg.timestamp.toISOString()
    }));

    const transformedSession = {
      id: session.id,
      name: session.name,
      createdAt: session.createdAt.toISOString(),
      lastActivity: session.lastActivity.toISOString(),
      setting: session.setting,
      characters: session.characters.map(sc => ({
        characterId: sc.characterId,
        character: sc.character,
        introMessage: sc.introMessage
      })),
      messages: transformedMessages
    };

    res.json({
      success: true,
      session: transformedSession
    });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat session'
    });
  }
});

// POST /api/chat-sessions - Create new chat session
router.post('/', async (req: Request, res: Response) => {
  try {
    const { settingId, characters } = req.body;

    if (!settingId || !characters || !Array.isArray(characters) || characters.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Setting ID and at least one character are required'
      });
      return;
    }

    // Validate setting exists
    const setting = await prisma.setting.findUnique({
      where: { id: settingId },
      select: { name: true }
    });

    if (!setting) {
      res.status(400).json({
        success: false,
        message: 'Setting not found'
      });
      return;
    }

    // Validate characters exist
    const characterIds = characters.map((c: any) => c.characterId);
    const foundCharacters = await prisma.character.findMany({
      where: { id: { in: characterIds } },
      select: { id: true, name: true }
    });

    if (foundCharacters.length !== characterIds.length) {
      res.status(400).json({
        success: false,
        message: 'One or more characters not found'
      });
    }

    // For now, use a default user ID (in production, get from auth)
    const defaultUserId = 'default-user';
    
    // Ensure default user exists
    await prisma.user.upsert({
      where: { id: defaultUserId },
      update: {},
      create: { id: defaultUserId, username: 'default' }
    });

    // Generate session name
    const characterNames = foundCharacters.map(c => c.name);
    const sessionName = generateSessionName(setting.name, characterNames);

    // Create chat session with characters
    const session = await prisma.chatSession.create({
      data: {
        name: sessionName,
        settingId,
        ownerId: defaultUserId,
        characters: {
          create: characters.map((c: any) => ({
            characterId: c.characterId,
            introMessage: c.introMessage || ''
          }))
        }
      },
      include: {
        setting: true,
        characters: {
          include: {
            character: true
          }
        }
      }
    });

    // Create intro messages in the database for characters that have them
    const introMessagesData = characters
      .filter((c: any) => c.introMessage && c.introMessage.trim())
      .map((c: any) => ({
        content: c.introMessage,
        sender: 'character',
        characterId: c.characterId,
        chatSessionId: session.id
      }));

    if (introMessagesData.length > 0) {
      await prisma.chatMessage.createMany({
        data: introMessagesData
      });
    }

    const transformedSession = {
      id: session.id,
      name: session.name,
      createdAt: session.createdAt.toISOString(),
      lastActivity: session.lastActivity.toISOString(),
      setting: session.setting,
      characters: session.characters.map(sc => ({
        characterId: sc.characterId,
        character: sc.character,
        introMessage: sc.introMessage
      }))
    };

    res.status(201).json({
      success: true,
      session: transformedSession
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat session'
    });
  }
});

// DELETE /api/chat-sessions/:id - Delete chat session
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if session exists
    const session = await prisma.chatSession.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
      return;
    }

    // Delete session (cascade will handle related records)
    await prisma.chatSession.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat session'
    });
  }
});

// POST /api/chat-sessions/:id/messages - Add message to session
router.post('/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, sender, characterId } = req.body;

    if (!content || !sender) {
      res.status(400).json({
        success: false,
        message: 'Content and sender are required'
      });
    }

    // Verify session exists
    const session = await prisma.chatSession.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
      return;
    }

    // Create message and update session activity
    const [message] = await Promise.all([
      prisma.chatMessage.create({
        data: {
          content,
          sender,
          characterId,
          chatSessionId: id
        }
      }),
      prisma.chatSession.update({
        where: { id },
        data: { lastActivity: new Date() }
      })
    ]);

    res.status(201).json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        sender: message.sender,
        characterId: message.characterId,
        timestamp: message.timestamp.toISOString()
      }
    });
  } catch (error) {
    console.error('Error adding message to session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message'
    });
  }
});

export default router;