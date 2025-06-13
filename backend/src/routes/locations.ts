import { Hono } from 'hono';
import { supabase } from '../utils/supabase-db';
import { transformLocation, transformArray } from '../utils/field-transformer';
import { ensureImageUrl } from '../utils/image-generator';

const locations = new Hono();

// GET /api/locations - Get all locations
locations.get('/', async (c) => {
  try {
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined;
    const settingId = c.req.query('setting_id');
    
    let query = supabase
      .from('locations')
      .select(`
        *,
        settings (
          id,
          name,
          theme
        )
      `)
      .order('created_at', { ascending: false });
    
    if (settingId) {
      query = query.eq('setting_id', settingId);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data: locations, error } = await query;
    
    if (error) {
      console.error('Failed to fetch locations:', error);
      return c.json({ success: false, error: 'Failed to fetch locations' }, 500);
    }
    
    // Transform using centralized field transformer
    const transformedLocations = transformArray(locations || [], transformLocation);
    
    return c.json({ success: true, data: transformedLocations });
  } catch (error) {
    console.error('Locations API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/locations/:id - Get location by ID
locations.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const { data: location, error } = await supabase
      .from('locations')
      .select(`
        *,
        settings (
          id,
          name,
          theme,
          description
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ success: false, error: 'Location not found' }, 404);
      }
      console.error('Failed to fetch location:', error);
      return c.json({ success: false, error: 'Failed to fetch location' }, 500);
    }
    
    // Transform using centralized field transformer
    const transformedLocation = transformLocation(location);
    
    return c.json({ success: true, data: transformedLocation });
  } catch (error) {
    console.error('Location by ID API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/locations - Create new location
locations.post('/', async (c) => {
  try {
    const locationData = await c.req.json();
    console.log('Received location data:', locationData);
    
    // Validate required fields
    if (!locationData.name || !locationData.description) {
      return c.json({ 
        error: 'Missing required fields',
        details: 'name and description are required' 
      }, 400);
    }
    
    // Auto-generate image URL if none provided by user
    // Only generate if no image_url was uploaded
    if (!locationData.image_url) {
      locationData.image_url = await ensureImageUrl({
        name: locationData.name,
        locationType: locationData.location_type
      }, 'location');
    }
    
    const { data: location, error } = await supabase
      .from('locations')
      .insert(locationData)
      .select(`
        *,
        settings (
          id,
          name,
          theme
        )
      `)
      .single();
    
    if (error) {
      console.error('Failed to create location:', error);
      console.error('Location data being inserted:', locationData);
      return c.json({ 
        error: 'Failed to create location',
        details: error.message,
        code: error.code 
      }, 500);
    }
    
    return c.json({ location }, 201);
  } catch (error) {
    console.error('Create location API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/locations/:id - Update location
locations.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const { data: location, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        settings (
          id,
          name,
          theme
        )
      `)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Location not found' }, 404);
      }
      console.error('Failed to update location:', error);
      return c.json({ error: 'Failed to update location' }, 500);
    }
    
    return c.json({ location });
  } catch (error) {
    console.error('Update location API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /api/locations/:id - Delete location
locations.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Failed to delete location:', error);
      return c.json({ error: 'Failed to delete location' }, 500);
    }
    
    return c.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete location API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default locations;