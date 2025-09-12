#!/usr/bin/env node

/**
 * Migration script to fix annotation row indices for tables with <th> elements
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Finds all tables that have <th> elements in their HTML content
 * 3. For each such table, shifts all annotation row indices up by 1
 * 4. Updates the database with the corrected annotations
 */

const { MongoClient } = require('mongodb');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Load environment variables from ui/.env file
function loadEnvFile() {
  const envPath = path.join(__dirname, 'ui', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=');
          // Remove surrounding quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          envVars[key.trim()] = value;
        }
      }
    });
    
    return envVars;
  }
  return {};
}

// Load environment variables
const envVars = loadEnvFile();

// Configuration
const MONGODB_URI = envVars.MONGODB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/tabletidier';
const DRY_RUN = process.argv.includes('--dry-run');

console.log('🔧 TableTidier Annotation Migration Script');
console.log('==========================================');
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE RUN (changes will be applied)'}`);
console.log(`MongoDB URI: ${MONGODB_URI}`);
console.log('');

async function main() {
  let client;
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const tablesCollection = db.collection('tables');
    
    // Get all tables
    console.log('📊 Fetching all tables...');
    const tables = await tablesCollection.find({}).toArray();
    console.log(`Found ${tables.length} tables`);
    
    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const table of tables) {
      try {
        processedCount++;
        console.log(`\n🔍 Processing table ${processedCount}/${tables.length}: ${table.fileName || table.id}`);
        
        // Check if table has <th> elements
        const hasHeaders = checkForTableHeaders(table.htmlContent);
        
        if (!hasHeaders) {
          console.log('  ⏭️  No <th> elements found, skipping');
          continue;
        }
        
        console.log('  🎯 Table has <th> elements, checking annotations...');
        
        // Check if table has annotations
        if (!table.annotationData || !table.annotationData.annotations || !Array.isArray(table.annotationData.annotations)) {
          console.log('  ⏭️  No annotations found, skipping');
          continue;
        }
        
        const annotations = table.annotationData.annotations;
        console.log(`  📝 Found ${annotations.length} annotation groups`);
        
        // Process annotations
        const updatedAnnotations = processAnnotations(annotations);
        
        if (JSON.stringify(annotations) === JSON.stringify(updatedAnnotations)) {
          console.log('  ✅ Annotations already correct, no changes needed');
          continue;
        }
        
        console.log('  🔄 Updating annotations...');
        
        if (!DRY_RUN) {
          await tablesCollection.updateOne(
            { _id: table._id },
            { 
              $set: { 
                'annotationData.annotations': updatedAnnotations,
                updatedAt: new Date()
              }
            }
          );
        }
        
        updatedCount++;
        console.log(`  ✅ ${DRY_RUN ? 'Would update' : 'Updated'} annotations for table ${table.fileName || table.id}`);
        
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error processing table ${table.fileName || table.id}:`, error.message);
      }
    }
    
    console.log('\n📈 Migration Summary');
    console.log('===================');
    console.log(`Tables processed: ${processedCount}`);
    console.log(`Tables updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE RUN'}`);
    
    if (DRY_RUN && updatedCount > 0) {
      console.log('\n💡 To apply changes, run the script without --dry-run flag');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

/**
 * Check if HTML content contains <th> elements
 */
function checkForTableHeaders(htmlContent) {
  if (!htmlContent) return false;
  
  try {
    const $ = cheerio.load(htmlContent);
    const thElements = $('th');
    return thElements.length > 0;
  } catch (error) {
    console.warn('  ⚠️  Error parsing HTML:', error.message);
    return false;
  }
}

/**
 * Process annotations to shift row indices up by 1
 */
function processAnnotations(annotations) {
  return annotations.map(annotation => {
    const updatedAnnotation = { ...annotation };
    
    // Update rowIndex if it exists
    if (updatedAnnotation.rowIndex !== undefined) {
      updatedAnnotation.rowIndex = updatedAnnotation.rowIndex + 1;
    }
    
    // Update concepts keys (format: "row-col")
    if (updatedAnnotation.concepts && typeof updatedAnnotation.concepts === 'object') {
      const updatedConcepts = {};
      
      for (const [key, concept] of Object.entries(updatedAnnotation.concepts)) {
        const [row, col] = key.split('-').map(Number);
        if (!isNaN(row) && !isNaN(col)) {
          const newKey = `${row + 1}-${col}`;
          updatedConcepts[newKey] = concept;
        } else {
          // Keep original key if it doesn't match expected format
          updatedConcepts[key] = concept;
        }
      }
      
      updatedAnnotation.concepts = updatedConcepts;
    }
    
    // Update cells array if it exists (format: [row, col])
    if (updatedAnnotation.cells && Array.isArray(updatedAnnotation.cells)) {
      updatedAnnotation.cells = updatedAnnotation.cells.map(([row, col]) => [row + 1, col]);
    }
    
    return updatedAnnotation;
  });
}

// Run the migration
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, checkForTableHeaders, processAnnotations, loadEnvFile };
