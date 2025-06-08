import express, { Request, Response } from 'express';
import { prisma } from '../utils/database';

const router = express.Router();

// Create a new setting
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, plot, settingType, timeOfDay, mood, theme, imageUrl, locationIds } = req.body;
    
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

    // Create the setting
    const setting = await prisma.setting.create({
      data: {
        name,
        description,
        plot,
        settingType: settingType || 'general',
        timeOfDay,
        mood,
        theme,
        imageUrl,
        ownerId: user.id
      }
    });

    // If locationIds provided, create the associations
    if (locationIds && Array.isArray(locationIds) && locationIds.length > 0) {
      const settingLocations = await Promise.all(
        locationIds.map((locationId: string, index: number) =>
          prisma.settingLocation.create({
            data: {
              settingId: setting.id,
              locationId,
              order: index
            }
          })
        )
      );
    }

    // Fetch the complete setting with locations
    const completeSetting = await prisma.setting.findUnique({
      where: { id: setting.id },
      include: {
        settingLocations: {
          include: {
            location: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    res.status(201).json({
      success: true,
      setting: completeSetting
    });

  } catch (error) {
    console.error('Setting creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create setting',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all settings for the user
router.get('/', async (req: Request, res: Response) => {
  try {
    // For single-user mode, get the first user's settings
    const user = await prisma.user.findFirst();
    if (!user) {
      return res.json({ settings: [] });
    }

    const settings = await prisma.setting.findMany({
      where: {
        ownerId: user.id
      },
      include: {
        settingLocations: {
          include: {
            location: {
              select: {
                id: true,
                name: true,
                locationType: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a specific setting by ID with full location details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: {
        id: req.params.id
      },
      include: {
        settingLocations: {
          include: {
            location: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!setting) {
      return res.status(404).json({ 
        success: false, 
        error: 'Setting not found' 
      });
    }

    res.json({
      success: true,
      setting
    });

  } catch (error) {
    console.error('Setting fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch setting',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a setting
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, plot, settingType, timeOfDay, mood, theme, imageUrl } = req.body;
    
    const setting = await prisma.setting.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        plot,
        settingType,
        timeOfDay,
        mood,
        theme,
        imageUrl
      },
      include: {
        settingLocations: {
          include: {
            location: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    res.json({
      success: true,
      setting
    });

  } catch (error) {
    console.error('Setting update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update setting',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a setting
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // First delete all setting-location associations
    await prisma.settingLocation.deleteMany({
      where: { settingId: req.params.id }
    });

    // Then delete the setting
    await prisma.setting.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Setting deleted successfully'
    });

  } catch (error) {
    console.error('Setting deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete setting',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add location to setting
router.post('/:id/locations', async (req: Request, res: Response) => {
  try {
    const { locationId, order, roleInSetting } = req.body;
    
    const settingLocation = await prisma.settingLocation.create({
      data: {
        settingId: req.params.id,
        locationId,
        order: order || 0,
        roleInSetting
      },
      include: {
        location: true
      }
    });

    res.status(201).json({
      success: true,
      settingLocation
    });

  } catch (error) {
    console.error('Setting location creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add location to setting',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Remove location from setting
router.delete('/:id/locations/:locationId', async (req: Request, res: Response) => {
  try {
    await prisma.settingLocation.deleteMany({
      where: {
        settingId: req.params.id,
        locationId: req.params.locationId
      }
    });

    res.json({
      success: true,
      message: 'Location removed from setting successfully'
    });

  } catch (error) {
    console.error('Setting location removal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove location from setting',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;