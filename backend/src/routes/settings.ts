import { Hono } from 'hono';
import { supabase } from '../utils/supabase-db';

const settings = new Hono();

// GET /api/settings - Get all settings
settings.get('/', async (c) => {
  try {
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined;
    
    let query = supabase
      .from('settings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data: settings, error } = await query;
    
    if (error) {
      console.error('Failed to fetch settings:', error);
      return c.json({ error: 'Failed to fetch settings' }, 500);
    }
    
    // Transform snake_case database fields to camelCase for frontend
    const transformedSettings = settings?.map(setting => ({
      ...setting,
      imageUrl: setting.image_url,
      settingType: setting.setting_type,
      timeOfDay: setting.time_of_day,
      createdAt: setting.created_at,
      updatedAt: setting.updated_at
    })) || [];
    
    return c.json({ settings: transformedSettings });
  } catch (error) {
    console.error('Settings API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/settings/:id - Get setting by ID
settings.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const { data: setting, error } = await supabase
      .from('settings')
      .select(`
        *,
        setting_locations (
          location_id,
          locations (*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Setting not found' }, 404);
      }
      console.error('Failed to fetch setting:', error);
      return c.json({ error: 'Failed to fetch setting' }, 500);
    }
    
    // Transform snake_case database fields to camelCase for frontend
    const transformedSetting = {
      ...setting,
      imageUrl: setting.image_url,
      settingType: setting.setting_type,
      timeOfDay: setting.time_of_day,
      createdAt: setting.created_at,
      updatedAt: setting.updated_at,
      // Transform the many-to-many relationship to simple locations array
      locations: setting.setting_locations?.map((sl: any) => ({
        ...sl.locations,
        // Transform location fields to camelCase
        settingId: sl.locations.setting_id,
        createdAt: sl.locations.created_at,
        updatedAt: sl.locations.updated_at
      })) || []
    };
    
    return c.json({ setting: transformedSetting });
  } catch (error) {
    console.error('Setting by ID API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/settings - Create new setting
settings.post('/', async (c) => {
  try {
    const settingData = await c.req.json();
    
    const { data: setting, error } = await supabase
      .from('settings')
      .insert(settingData)
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create setting:', error);
      return c.json({ error: 'Failed to create setting' }, 500);
    }
    
    return c.json({ setting }, 201);
  } catch (error) {
    console.error('Create setting API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/settings/:id - Update setting
settings.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const { data: setting, error } = await supabase
      .from('settings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Setting not found' }, 404);
      }
      console.error('Failed to update setting:', error);
      return c.json({ error: 'Failed to update setting' }, 500);
    }
    
    return c.json({ setting });
  } catch (error) {
    console.error('Update setting API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /api/settings/:id - Delete setting
settings.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Failed to delete setting:', error);
      return c.json({ error: 'Failed to delete setting' }, 500);
    }
    
    return c.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Delete setting API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default settings;