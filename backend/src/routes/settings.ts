import { Hono } from 'hono';
import { supabase } from '../utils/supabase-db';
import { ensureImageUrl } from '../utils/image-generator';
import { transformSetting, transformArray } from '../utils/field-transformer';

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
    
    // Transform using centralized transformer
    const transformedSettings = transformArray(settings || [], transformSetting);
    
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
    
    // Transform using centralized transformer
    const transformedSetting = transformSetting(setting);
    
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
    
    // Auto-generate image URL if none provided by user
    // Only generate if no image_url was uploaded
    if (!settingData.image_url) {
      settingData.image_url = await ensureImageUrl({
        name: settingData.name,
        settingType: settingData.setting_type
      }, 'setting');
    }
    
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