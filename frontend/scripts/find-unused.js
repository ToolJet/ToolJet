#!/usr/bin/env node

/**
 * Find Unused Files Script
 *
 * Analyzes dependency-cruiser JSON output to find:
 * - Orphaned modules (files not imported anywhere)
 * - Files with no dependents
 */

const fs = require('fs');

// Read JSON from stdin
let jsonData = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  jsonData += chunk;
});

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(jsonData);
    analyzeUnusedFiles(data);
  } catch (error) {
    console.error('Error parsing JSON:', error.message);
    process.exit(1);
  }
});

function analyzeUnusedFiles(data) {
  if (!data.modules || !Array.isArray(data.modules)) {
    console.error('Invalid dependency-cruiser output');
    process.exit(1);
  }

  const allModules = data.modules;
  const usedModules = new Set();
  const entryPoints = new Set();

  // Build a map of which files are imported
  allModules.forEach((module) => {
    if (module.dependencies && Array.isArray(module.dependencies)) {
      module.dependencies.forEach((dep) => {
        if (dep.resolved) {
          usedModules.add(dep.resolved);
        }
      });
    }

    // Identify potential entry points (files with no dependencies importing them in our analysis)
    // These might be the app entry point, or test files
    if (module.source.match(/\/(index|main|App)\.(js|jsx|ts|tsx)$/)) {
      entryPoints.add(module.source);
    }
  });

  // Find orphaned modules
  const orphanedModules = allModules.filter((module) => {
    const source = module.source;

    // Skip if it's used
    if (usedModules.has(source)) {
      return false;
    }

    // Skip entry points
    if (entryPoints.has(source)) {
      return false;
    }

    // Skip certain patterns (config files, tests, etc.)
    if (
      source.match(/\.(test|spec)\.(js|jsx|ts|tsx)$/) || // Test files
      source.match(/\.(config|setup)\.(js|ts)$/) || // Config files
      source.match(/\.d\.ts$/) || // TypeScript declarations
      source.match(/\/__tests__\//) || // Test directories
      source.match(/\/__mocks__\//) // Mock directories
    ) {
      return false;
    }

    return true;
  });

  // Display results
  console.log('\n🔍 UNUSED FILES ANALYSIS\n');
  console.log('='.repeat(80));

  if (orphanedModules.length === 0) {
    console.log('\n✅ No unused files found! All files appear to be imported somewhere.\n');
  } else {
    console.log(`\n⚠️  Found ${orphanedModules.length} potentially unused file(s):\n`);

    // Group by directory
    const byDirectory = {};
    orphanedModules.forEach((module) => {
      const dir = module.source.substring(0, module.source.lastIndexOf('/'));
      if (!byDirectory[dir]) {
        byDirectory[dir] = [];
      }
      byDirectory[dir].push(module.source);
    });

    // Sort directories
    const sortedDirs = Object.keys(byDirectory).sort();

    sortedDirs.forEach((dir) => {
      console.log(`\n📁 ${dir}/`);
      byDirectory[dir].sort().forEach((file) => {
        const filename = file.substring(file.lastIndexOf('/') + 1);
        console.log(`   ├─ ${filename}`);
      });
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n💡 These files are not imported by any other file in your codebase.');
    console.log('   They might be:');
    console.log('   - Truly unused and can be deleted');
    console.log('   - Entry points that are loaded differently');
    console.log('   - Dynamically imported (not detected by static analysis)');
    console.log('   - Exported for external use\n');

    // Save to file
    const outputFile = 'unused-files-report.json';
    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: allModules.length,
      unusedFiles: orphanedModules.length,
      files: orphanedModules.map((m) => m.source).sort(),
    };

    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
    console.log(`📄 Full report saved to: ${outputFile}\n`);
  }

  console.log('='.repeat(80) + '\n');
}
