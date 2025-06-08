const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLunaAppearance() {
  console.log("🔍 CHECKING LUNA'S DATABASE APPEARANCE DATA");
  console.log("===========================================\n");

  try {
    const characters = await prisma.character.findMany();
    const luna = characters.find(c => c.name === 'Luna');
    
    if (!luna) {
      console.log("❌ Luna not found in database");
      return;
    }
    
    console.log("📋 Luna's Appearance Fields from Database:");
    console.log(`   Name: ${luna.name}`);
    console.log(`   Description: ${luna.description || 'NULL'}`);
    console.log(`   Attire: ${luna.attire || 'NULL'}`);
    console.log(`   Colors: ${luna.colors || 'NULL'}`);
    console.log(`   Features: ${luna.features || 'NULL'}`);
    console.log(`   Avatar Image: ${luna.avatarImage || 'NULL'}`);
    
    console.log("\n🎯 Key Analysis:");
    
    // Parse colors if it's a JSON string
    if (luna.colors) {
      try {
        const colorsArray = JSON.parse(luna.colors);
        console.log(`   Parsed Colors Array: ${JSON.stringify(colorsArray)}`);
      } catch (e) {
        console.log(`   Colors (raw): ${luna.colors}`);
      }
    }
    
    // Check if silver hair is mentioned anywhere
    const allText = `${luna.description || ''} ${luna.attire || ''} ${luna.colors || ''} ${luna.features || ''}`.toLowerCase();
    const hasSilver = allText.includes('silver');
    const hasPurple = allText.includes('purple');
    
    console.log(`   Contains 'silver': ${hasSilver ? '✅ YES' : '❌ NO'}`);
    console.log(`   Contains 'purple': ${hasPurple ? '✅ YES' : '❌ NO'}`);
    
    if (hasSilver) {
      console.log("   ✅ Silver hair IS in the database - LLM should use this");
    } else {
      console.log("   ❌ Silver hair NOT found in database - need to add it");
    }
    
    if (hasPurple) {
      console.log("   ⚠️  Purple IS mentioned - might be confusing the LLM");
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLunaAppearance();