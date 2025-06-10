import { Hono } from 'hono';
import { supabase } from '../utils/supabase-db';

const settingLocations = new Hono();

// GET /api/setting-locations - Get all setting-location relationships
settingLocations.get('/', async (c) => {
  try {
    const settingId = c.req.query('setting_id');
    const locationId = c.req.query('location_id');
    
    let query = supabase
      .from('setting_locations')
      .select(`
        *,
        settings (id, name),
        locations (id, name, description, location_type)
      `)
      .order('order_index', { ascending: true });
    
    if (settingId) {
      query = query.eq('setting_id', settingId);
    }
    
    if (locationId) {
      query = query.eq('location_id', locationId);
    }
    
    const { data: settingLocations, error } = await query;
    
    if (error) {
      console.error('Failed to fetch setting-locations:', error);
      return c.json({ error: 'Failed to fetch setting-locations' }, 500);
    }
    
    return c.json({ settingLocations: settingLocations || [] });
  } catch (error) {
    console.error('Setting-locations API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/setting-locations - Create new setting-location relationship
settingLocations.post('/', async (c) => {
  try {
    const linkData = await c.req.json();
    
    const { data: settingLocation, error } = await supabase
      .from('setting_locations')
      .insert(linkData)
      .select(`
        *,
        settings (id, name),
        locations (id, name, description, location_type)
      `)
      .single();
    
    if (error) {
      console.error('Failed to create setting-location:', error);
      return c.json({ error: 'Failed to create setting-location' }, 500);
    }
    
    return c.json({ settingLocation }, 201);
  } catch (error) {
    console.error('Create setting-location API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /api/setting-locations/:id - Delete setting-location relationship
settingLocations.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const { error } = await supabase
      .from('setting_locations')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Failed to delete setting-location:', error);
      return c.json({ error: 'Failed to delete setting-location' }, 500);
    }
    
    return c.json({ message: 'Setting-location relationship deleted successfully' });
  } catch (error) {
    console.error('Delete setting-location API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /api/setting-locations/by-setting/:settingId - Delete all location relationships for a setting
settingLocations.delete('/by-setting/:settingId', async (c) => {
  try {
    const settingId = c.req.param('settingId');
    
    const { error } = await supabase
      .from('setting_locations')
      .delete()
      .eq('setting_id', settingId);
    
    if (error) {
      console.error('Failed to delete setting-locations:', error);
      return c.json({ error: 'Failed to delete setting-locations' }, 500);
    }
    
    return c.json({ message: 'All setting-location relationships deleted successfully' });
  } catch (error) {
    console.error('Delete setting-locations API error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default settingLocations;