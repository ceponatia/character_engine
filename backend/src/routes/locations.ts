import express, { Request, Response } from 'express';
import { prisma } from '../utils/database';

const router = express.Router();

// Create a new location
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, details, locationType, ambiance, lighting, accessibility } = req.body;
    
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

    const location = await prisma.location.create({
      data: {
        name,
        description,
        details,
        locationType: locationType || 'room',
        ambiance,
        lighting,
        accessibility,
        ownerId: user.id
      }
    });

    res.status(201).json({
      success: true,
      location
    });

  } catch (error) {
    console.error('Location creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create location',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all locations for the user
router.get('/', async (req: Request, res: Response) => {
  try {
    // For single-user mode, get the first user's locations
    const user = await prisma.user.findFirst();
    if (!user) {
      return res.json({ locations: [] });
    }

    const locations = await prisma.location.findMany({
      where: {
        ownerId: user.id
      },
      include: {
        settingLocations: {
          include: {
            setting: {
              select: {
                id: true,
                name: true,
                settingType: true
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      locations
    });

  } catch (error) {
    console.error('Locations fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch locations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a specific location by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const location = await prisma.location.findUnique({
      where: {
        id: req.params.id
      },
      include: {
        settingLocations: {
          include: {
            setting: {
              select: {
                id: true,
                name: true,
                settingType: true,
                theme: true
              }
            }
          }
        }
      }
    });

    if (!location) {
      return res.status(404).json({ 
        success: false, 
        error: 'Location not found' 
      });
    }

    res.json({
      success: true,
      location
    });

  } catch (error) {
    console.error('Location fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch location',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a location
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, details, locationType, ambiance, lighting, accessibility } = req.body;
    
    const location = await prisma.location.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        details,
        locationType,
        ambiance,
        lighting,
        accessibility
      },
      include: {
        settingLocations: {
          include: {
            setting: {
              select: {
                id: true,
                name: true,
                settingType: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      location
    });

  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a location
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // First delete all setting-location associations
    await prisma.settingLocation.deleteMany({
      where: { locationId: req.params.id }
    });

    // Then delete the location
    await prisma.location.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Location deleted successfully'
    });

  } catch (error) {
    console.error('Location deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete location',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get locations that are available to add to a setting (not already in the setting)
router.get('/available/:settingId', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return res.json({ locations: [] });
    }

    // Get all locations for the user
    const allLocations = await prisma.location.findMany({
      where: { ownerId: user.id }
    });

    // Get locations already in the setting
    const settingLocations = await prisma.settingLocation.findMany({
      where: { settingId: req.params.settingId },
      select: { locationId: true }
    });

    const usedLocationIds = settingLocations.map(sl => sl.locationId);

    // Filter out locations already in the setting
    const availableLocations = allLocations.filter(
      location => !usedLocationIds.includes(location.id)
    );

    res.json({
      success: true,
      locations: availableLocations
    });

  } catch (error) {
    console.error('Available locations fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available locations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;