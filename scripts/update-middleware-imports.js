// scripts/update-middleware-imports.js
// Updates import paths for middleware in API files

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

// List of files to process
const API_FILES_GLOB = 'pages/api/**/*.js';

// Mapping of old imports to new imports
const IMPORT_REPLACEMENTS = [
  {
    from: /from\s+['"]\.\.\/\.\.\/api-middleware\/apiSecurity['"]/g,
    to: 'from \'../../middleware/apiSecurity\''
  },
  {
    from: /from\s+['"]\.\.\/\.\.\/\.\.\/api-middleware\/apiSecurity['"]/g,
    to: 'from \'../../../middleware/apiSecurity\''
  },
  {
    from: /from\s+['"]\.\.\/\.\.\/api-middleware\/errorHandler['"]/g,
    to: 'from \'../../middleware/errorHandler\''
  },
  {
    from: /from\s+['"]\.\.\/\.\.\/api-middleware\/rateLimit['"]/g,
    to: 'from \'../../middleware/rateLimit\''
  },
  {
    from: /from\s+['"]\.\.\/\.\.\/api-middleware\/optimizedRateLimit['"]/g,
    to: 'from \'../../middleware/optimizedRateLimit\''
  },
  {
    from: /from\s+['"]\.\.\/\.\.\/api-middleware\/apiCache['"]/g,
    to: 'from \'../../middleware/apiCache\''
  },
  {
    from: /from\s+['"]\.\.\/\.\.\/api-middleware\/securityUtils['"]/g,
    to: 'from \'../../middleware/securityUtils\''
  },
  // For lib/api-middleware imports, these are already updated
  {
    from: /from\s+['"]\.\.\/\.\.\/\.\.\/api-middleware\/apiSecurity['"]/g,
    to: 'from \'../../../middleware/apiSecurity\''
  },
  {
    from: /from\s+['"]\.\.\/\.\.\/\.\.\/api-middleware\/errorHandler['"]/g,
    to: 'from \'../../../middleware/errorHandler\''
  },
];

// Process a single file
async function processFile(filePath) {
  try {
    console.log(`Processing: ${filePath}`);
    
    // Read file content
    const content = await fs.readFile(filePath, 'utf8');
    
    // Apply replacements
    let updatedContent = content;
    
    for (const replacement of IMPORT_REPLACEMENTS) {
      updatedContent = updatedContent.replace(replacement.from, replacement.to);
    }
    
    // Check if content changed
    if (content !== updatedContent) {
      console.log(`  Updated imports in: ${filePath}`);
      await fs.writeFile(filePath, updatedContent, 'utf8');
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Main function
async function updateImports() {
  try {
    // Find all API files
    const files = glob.sync(API_FILES_GLOB);
    
    console.log(`Found ${files.length} API files to process`);
    
    // Process each file
    for (const file of files) {
      await processFile(file);
    }
    
    console.log('Finished updating middleware imports');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
updateImports();