/**
 * PostgreSQL + pgvector Setup Checker
 * 
 * This script checks if your PostgreSQL database is properly set up for the RAG system
 */

const { PrismaClient } = require('@prisma/client');

async function checkPostgreSQLSetup() {
  console.log('🔍 Checking PostgreSQL + pgvector Setup');
  console.log('======================================\n');

  const prisma = new PrismaClient();
  const checks = [];

  try {
    // 1. Test basic connection
    console.log('1. 🔌 Testing Database Connection...');
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      checks.push('✅ Database connection successful');
      console.log('   ✅ PostgreSQL connection successful');
    } catch (error) {
      checks.push('❌ Database connection failed');
      console.log('   ❌ Connection failed:', error.message);
      console.log('\n📋 Database Setup Instructions:');
      console.log('   1. Install PostgreSQL: https://www.postgresql.org/download/');
      console.log('   2. Create database: createdb chatbot');
      console.log('   3. Set DATABASE_URL environment variable:');
      console.log('      DATABASE_URL="postgresql://username:password@localhost:5432/chatbot"');
      return;
    }

    // 2. Check pgvector extension
    console.log('\n2. 🧮 Checking pgvector Extension...');
    try {
      const extensionResult = await prisma.$queryRaw`
        SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector') as has_vector
      `;
      
      if (extensionResult[0]?.has_vector) {
        checks.push('✅ pgvector extension installed');
        console.log('   ✅ pgvector extension is installed');
      } else {
        checks.push('❌ pgvector extension missing');
        console.log('   ❌ pgvector extension not found');
        console.log('\n📋 pgvector Installation Instructions:');
        console.log('   1. Install pgvector: https://github.com/pgvector/pgvector#installation');
        console.log('   2. Connect to your database as superuser and run:');
        console.log('      CREATE EXTENSION IF NOT EXISTS vector;');
        return;
      }
    } catch (error) {
      checks.push('❌ pgvector check failed');
      console.log('   ❌ Error checking pgvector:', error.message);
      return;
    }

    // 3. Test vector operations
    console.log('\n3. 🧪 Testing Vector Operations...');
    try {
      const vectorTest = await prisma.$queryRaw`SELECT '[1,2,3]'::vector(3) as test_vector`;
      checks.push('✅ Vector operations working');
      console.log('   ✅ Vector operations are working');
      console.log(`   Test vector result: ${JSON.stringify(vectorTest[0])}`);
    } catch (error) {
      checks.push('❌ Vector operations failed');
      console.log('   ❌ Vector operations failed:', error.message);
      return;
    }

    // 4. Test vector similarity
    console.log('\n4. 📊 Testing Vector Similarity Functions...');
    try {
      const similarityTest = await prisma.$queryRaw`
        SELECT '[1,2,3]'::vector(3) <-> '[1,2,4]'::vector(3) as distance
      `;
      checks.push('✅ Vector similarity functions working');
      console.log('   ✅ Vector similarity functions are working');
      console.log(`   Test similarity distance: ${similarityTest[0]?.distance}`);
    } catch (error) {
      checks.push('❌ Vector similarity failed');
      console.log('   ❌ Vector similarity failed:', error.message);
      return;
    }

    // 5. Check if schema needs to be applied
    console.log('\n5. 📋 Checking Database Schema...');
    try {
      // Check if character_memories table exists with vector column
      const tableCheck = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'character_memories' AND column_name = 'embedding'
      `;
      
      if (tableCheck.length > 0) {
        checks.push('✅ RAG schema is applied');
        console.log('   ✅ character_memories table with embedding column exists');
        console.log(`   Embedding column type: ${tableCheck[0]?.data_type}`);
      } else {
        checks.push('⚠️ RAG schema needs to be applied');
        console.log('   ⚠️ RAG schema not yet applied');
        console.log('\n📋 Schema Application Instructions:');
        console.log('   Run: npm run db:dev');
        console.log('   This will apply the RAG system database schema');
      }
    } catch (error) {
      checks.push('❌ Schema check failed');
      console.log('   ❌ Schema check failed:', error.message);
    }

    // 6. Test environment variables
    console.log('\n6. ⚙️  Checking Environment Variables...');
    const envChecks = [
      { name: 'DATABASE_URL', value: process.env.DATABASE_URL, required: true },
      { name: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY, required: false },
      { name: 'OLLAMA_HOST', value: process.env.OLLAMA_HOST, required: false },
      { name: 'OLLAMA_MODEL', value: process.env.OLLAMA_MODEL, required: false }
    ];

    envChecks.forEach(check => {
      if (check.value) {
        const displayValue = check.name === 'OPENAI_API_KEY' ? 
          `${check.value.substring(0, 10)}...` : check.value;
        console.log(`   ✅ ${check.name}: ${displayValue}`);
        checks.push(`✅ ${check.name} configured`);
      } else if (check.required) {
        console.log(`   ❌ ${check.name}: Not set (REQUIRED)`);
        checks.push(`❌ ${check.name} missing`);
      } else {
        console.log(`   ⚠️  ${check.name}: Not set (optional)`);
        checks.push(`⚠️ ${check.name} not set`);
      }
    });

  } catch (error) {
    console.error('❌ Setup check failed:', error);
    checks.push(`❌ Setup check error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }

  // Summary
  console.log('\n📊 Setup Summary');
  console.log('=================');
  checks.forEach(check => console.log(`   ${check}`));

  const criticalPassed = checks.filter(c => c.includes('✅') && 
    (c.includes('connection') || c.includes('pgvector') || c.includes('Vector operations'))
  ).length;

  const totalCritical = 3; // connection, pgvector, vector operations

  if (criticalPassed === totalCritical) {
    console.log('\n🎉 PostgreSQL + pgvector Setup Complete!');
    console.log('   Your database is ready for the RAG system.');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Apply RAG schema: npm run db:dev');
    console.log('   2. Set OPENAI_API_KEY for embeddings (optional - can use mock mode)');
    console.log('   3. Run RAG tests: node test-rag-with-ollama.js');
  } else {
    console.log('\n⚠️ PostgreSQL Setup Incomplete');
    console.log(`   ${criticalPassed}/${totalCritical} critical requirements met`);
    console.log('   Please complete the setup steps shown above.');
  }
}

// Environment setup guide
console.log('🔧 PostgreSQL + pgvector Setup Guide');
console.log('====================================');
console.log('');
console.log('Required Components:');
console.log('  1. PostgreSQL database server');
console.log('  2. pgvector extension for vector operations');
console.log('  3. Proper DATABASE_URL configuration');
console.log('');
console.log('Quick Setup Commands:');
console.log('  # Install PostgreSQL (varies by OS)');
console.log('  # Install pgvector: https://github.com/pgvector/pgvector');
console.log('  createdb chatbot');
console.log('  psql chatbot -c "CREATE EXTENSION IF NOT EXISTS vector;"');
console.log('');
console.log('Environment Variables:');
console.log('  DATABASE_URL="postgresql://user:pass@localhost:5432/chatbot"');
console.log('  OPENAI_API_KEY="sk-your-api-key" # Optional for mock mode');
console.log('');

// Run the check
if (require.main === module) {
  checkPostgreSQLSetup();
}

module.exports = { checkPostgreSQLSetup };