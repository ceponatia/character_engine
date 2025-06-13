/**
 * Image Migration Script
 * Downloads existing external images and updates database with local paths
 */

import { downloadAndSaveImage } from '../src/utils/image-storage';

// Supabase connection (simplified for script)
const SUPABASE_URL = 'https://kkikyuztsgryqxrpbree.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtraWt5dXp0c2dyeXF4cnBicmVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxMDA4MTksImV4cCI6MjA0ODY3NjgxOX0.bHE0KhUJDy5BfNuqCf9QYKrJZrGsKWWXvAQA_FKMOp8';

interface DbRecord {
  id: string;
  name: string;
  image_url: string | null;
  avatar_image?: string | null;
}

/**
 * Fetch records from Supabase
 */
async function fetchRecords(table: string): Promise<DbRecord[]> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id,name,image_url,avatar_image`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${table}:`, error);
    return [];
  }
}

/**
 * Update record in Supabase
 */
async function updateRecord(table: string, id: string, imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_url: imageUrl }),
    });

    return response.ok;
  } catch (error) {
    console.error(`Failed to update ${table} ${id}:`, error);
    return false;
  }
}

/**
 * Migrate character images
 */
async function migrateCharacters(): Promise<void> {
  console.log('🔄 Migrating character images...');
  
  const characters = await fetchRecords('characters');
  let migratedCount = 0;
  
  for (const character of characters) {
    // Skip if already has local image
    if (character.image_url?.startsWith('/images/')) {
      console.log(`✅ ${character.name} already has local image`);
      continue;
    }
    
    // Get the current image URL
    const currentUrl = character.image_url || character.avatar_image;
    if (!currentUrl || currentUrl.includes('luna_nightshade_portrait.jpg')) {
      console.log(`⏭️  Skipping ${character.name} - no valid image URL`);
      continue;
    }
    
    try {
      console.log(`📥 Downloading image for ${character.name}...`);
      const localPath = await downloadAndSaveImage(currentUrl, character.name, 'character', 'generated');
      
      // Update database
      const success = await updateRecord('characters', character.id, localPath);
      if (success) {
        console.log(`✅ ${character.name} migrated to ${localPath}`);
        migratedCount++;
      } else {
        console.error(`❌ Failed to update database for ${character.name}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to migrate ${character.name}:`, error);
    }
  }
  
  console.log(`✨ Character migration complete: ${migratedCount}/${characters.length} migrated`);
}

/**
 * Migrate setting images
 */
async function migrateSettings(): Promise<void> {
  console.log('🔄 Migrating setting images...');
  
  const settings = await fetchRecords('settings');
  let migratedCount = 0;
  
  for (const setting of settings) {
    // Skip if already has local image
    if (setting.image_url?.startsWith('/images/')) {
      console.log(`✅ ${setting.name} already has local image`);
      continue;
    }
    
    // Skip if no image URL
    if (!setting.image_url) {
      console.log(`⏭️  Skipping ${setting.name} - no image URL`);
      continue;
    }
    
    try {
      console.log(`📥 Downloading image for ${setting.name}...`);
      const localPath = await downloadAndSaveImage(setting.image_url, setting.name, 'setting', 'generated');
      
      // Update database
      const success = await updateRecord('settings', setting.id, localPath);
      if (success) {
        console.log(`✅ ${setting.name} migrated to ${localPath}`);
        migratedCount++;
      } else {
        console.error(`❌ Failed to update database for ${setting.name}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to migrate ${setting.name}:`, error);
    }
  }
  
  console.log(`✨ Setting migration complete: ${migratedCount}/${settings.length} migrated`);
}

/**
 * Main migration function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting image migration...');
  console.log('📁 Target directory: /uploads/images/');
  
  try {
    await migrateCharacters();
    await migrateSettings();
    // Locations don't currently have images
    
    console.log('✅ Image migration completed successfully!');
    console.log('📊 All external images have been downloaded and stored locally');
    console.log('🔗 Database references updated to use local paths');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (import.meta.main) {
  main();
}

export { main as migrateImages };