#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PACKAGES_DIR = path.join(__dirname, 'packages');
const DRY_RUN = process.argv.includes('--dry-run');

// Statistics
let filesScanned = 0;
let filesModified = 0;
let importsFixed = 0;

/**
 * Recursively get all TypeScript files in a directory
 */
function getTypeScriptFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and dist directories
        if (entry.name !== 'node_modules' && entry.name !== 'dist') {
          traverse(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * Fix imports in a TypeScript file
 */
function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let localImportsFixed = 0;
  
  // Regex patterns to match imports without .js extension
  // Matches: from './something' or from "../something" or from './path/to/file'
  const importPatterns = [
    // Single quotes with relative path
    {
      regex: /from\s+['"](\.\.[\/\\][^'"]+|\.\/[^'"]+)['"]/g,
      replacement: (match, importPath) => {
        // Skip if already has .js extension
        if (importPath.endsWith('.js')) {
          return match;
        }
        
        // Skip if importing from a directory (contains trailing slash)
        if (importPath.endsWith('/') || importPath.endsWith('\\')) {
          return match;
        }
        
        modified = true;
        localImportsFixed++;
        return `from '${importPath}.js'`;
      }
    },
    // Handle require() statements (if any)
    {
      regex: /require\s*\(\s*['"](\.\.[\/\\][^'"]+|\.\/[^'"]+)['"]\s*\)/g,
      replacement: (match, importPath) => {
        if (importPath.endsWith('.js')) {
          return match;
        }
        
        if (importPath.endsWith('/') || importPath.endsWith('\\')) {
          return match;
        }
        
        modified = true;
        localImportsFixed++;
        return `require('${importPath}.js')`;
      }
    }
  ];
  
  let newContent = content;
  
  for (const pattern of importPatterns) {
    newContent = newContent.replace(pattern.regex, pattern.replacement);
  }
  
  if (modified) {
    filesModified++;
    importsFixed += localImportsFixed;
    
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✓ Fixed ${localImportsFixed} import(s) in: ${path.relative(process.cwd(), filePath)}`);
    } else {
      console.log(`[DRY RUN] Would fix ${localImportsFixed} import(s) in: ${path.relative(process.cwd(), filePath)}`);
    }
  }
  
  return modified;
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Scanning for TypeScript files in packages directory...\n');
  
  if (!fs.existsSync(PACKAGES_DIR)) {
    console.error(`❌ Error: packages directory not found at ${PACKAGES_DIR}`);
    process.exit(1);
  }
  
  if (DRY_RUN) {
    console.log('🏃 Running in DRY RUN mode - no files will be modified\n');
  }
  
  // Get all package directories
  const packageDirs = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(PACKAGES_DIR, entry.name));
  
  console.log(`📦 Found ${packageDirs.length} packages\n`);
  
  // Process each package
  for (const packageDir of packageDirs) {
    const tsFiles = getTypeScriptFiles(packageDir);
    filesScanned += tsFiles.length;
    
    for (const file of tsFiles) {
      fixImportsInFile(file);
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  console.log(`Files scanned:   ${filesScanned}`);
  console.log(`Files modified:  ${filesModified}`);
  console.log(`Imports fixed:   ${importsFixed}`);
  console.log('='.repeat(60));
  
  if (DRY_RUN) {
    console.log('\n💡 Run without --dry-run flag to apply changes');
  } else if (filesModified > 0) {
    console.log('\n✨ All imports have been fixed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Review the changes: git diff');
    console.log('   2. Rebuild: npm run build');
    console.log('   3. Test your server');
  } else {
    console.log('\n✨ No changes needed - all imports already have .js extensions!');
  }
}

// Run the script
try {
  main();
} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}