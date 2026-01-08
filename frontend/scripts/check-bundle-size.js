#!/usr/bin/env node

/**
 * ToolJet Frontend Bundle Size Checker
 * Validates that the bundle size is within acceptable limits
 */

const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '../build');
const MAX_CRITICAL_SIZE = 120 * 1024 * 1024; // 120MB threshold for critical chunks

// Define which chunks are critical (loaded immediately)
const criticalChunks = [
  'runtime',
  'vendor-react',
  'vendor-codemirror',
  'vendor-icons',
  'vendor-radix',
  'vendor-lodash',
  'vendor-date',
  'vendor-yjs',
  'vendor-react-spring',
  'vendor-common',
  'main',
];

// Define deferred chunks (can be lazy loaded)
const deferredChunks = [
  'vendor-plotly',
  'vendor-pdf',
  'vendor-xlsx',
];

function humanReadable(bytes) {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)}GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${bytes}B`;
}

function getAllJsFiles() {
  if (!fs.existsSync(buildDir)) {
    console.error('\n❌ Error: Build directory not found. Run "npm run build" first.\n');
    process.exit(1);
  }

  return fs.readdirSync(buildDir)
    .filter(f => f.endsWith('.js'))
    .map(f => {
      const size = fs.statSync(path.join(buildDir, f)).size;
      const isCritical = criticalChunks.some(chunk => f.includes(chunk));
      const isDeferred = deferredChunks.some(chunk => f.includes(chunk));
      const isChunk = f.includes('.chunk.js');

      return {
        name: f,
        size,
        isCritical,
        isDeferred,
        isChunk,
        type: isCritical ? 'critical' : (isDeferred ? 'deferred' : (isChunk ? 'other-chunk' : 'unknown'))
      };
    });
}

function analyzeBundle() {
  const files = getAllJsFiles();

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         ToolJet Frontend Bundle Size Check                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Critical chunks
  console.log('📦 CRITICAL CHUNKS (Initial Load):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const criticalFiles = files.filter(f => f.isCritical);
  const criticalSize = criticalFiles.reduce((sum, f) => sum + f.size, 0);

  criticalFiles
    .sort((a, b) => b.size - a.size)
    .forEach(f => {
      const name = f.name.replace(/\.[a-f0-9]{8}\./, '.*.');
      console.log(`  ${name.padEnd(50)} ${humanReadable(f.size).padStart(10)}`);
    });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ${'TOTAL CRITICAL'.padEnd(50)} ${humanReadable(criticalSize).padStart(10)}`);
  console.log('');

  // Deferred chunks
  console.log('💤 DEFERRED CHUNKS (Lazy Loadable):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const deferredFiles = files.filter(f => f.isDeferred);
  const deferredSize = deferredFiles.reduce((sum, f) => sum + f.size, 0);

  deferredFiles
    .sort((a, b) => b.size - a.size)
    .forEach(f => {
      const name = f.name.replace(/\.[a-f0-9]{8}\./, '.*.');
      console.log(`  ${name.padEnd(50)} ${humanReadable(f.size).padStart(10)}`);
    });

  // Other chunks
  const otherChunks = files.filter(f => !f.isCritical && !f.isDeferred && f.isChunk);
  const otherSize = otherChunks.reduce((sum, f) => sum + f.size, 0);

  if (otherChunks.length > 0) {
    console.log(`  ${'Other chunks (' + otherChunks.length + ' files)'.padEnd(50)} ${humanReadable(otherSize).padStart(10)}`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ${'TOTAL DEFERRED'.padEnd(50)} ${humanReadable(deferredSize + otherSize).padStart(10)}`);
  console.log('');

  // Grand total
  const grandTotal = criticalSize + deferredSize + otherSize;
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  ${'GRAND TOTAL'.padEnd(50)} ${humanReadable(grandTotal).padStart(10)}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Statistics
  console.log('📊 STATISTICS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Total JavaScript files: ${files.length}`);
  console.log(`  Critical chunks: ${criticalFiles.length} files (${humanReadable(criticalSize)})`);
  console.log(`  Deferred chunks: ${deferredFiles.length + otherChunks.length} files (${humanReadable(deferredSize + otherSize)})`);
  console.log('');

  // Validation
  const criticalMB = Math.round(criticalSize / 1048576);

  if (criticalSize > MAX_CRITICAL_SIZE) {
    console.log(`❌ FAIL: Critical bundle size (${humanReadable(criticalSize)}) exceeds limit (${humanReadable(MAX_CRITICAL_SIZE)})`);
    console.log('');
    console.log('💡 RECOMMENDATIONS:');
    console.log('  • Proceed with Phase 2: Fix icon imports (8-10MB savings)');
    console.log('  • Proceed with Phase 3: Route lazy loading (20-30MB savings)');
    console.log('  • Proceed with Phase 4: Widget lazy loading (15-20MB savings)');
    console.log('  • Proceed with Phase 5: Library lazy loading (defer heavy libs)');
    console.log('');
    process.exit(1);
  } else if (criticalMB > 80) {
    console.log(`⚠️  WARNING: Critical bundle size is ${humanReadable(criticalSize)}`);
    console.log('  Consider implementing Phase 2-3 for further optimization.');
    console.log('');
  } else {
    console.log(`✅ SUCCESS: Critical bundle size (${humanReadable(criticalSize)}) is within limits`);
    console.log('');
  }

  // Comparison with baseline
  const baseline = 155 * 1024 * 1024; // 155MB
  const savings = baseline - criticalSize;
  const percent = Math.round((savings / baseline) * 100);

  if (savings > 0) {
    console.log(`🎉 Improvement vs baseline: ${humanReadable(savings)} (${percent}%)`);
  }

  console.log('');
}

// Run analysis
analyzeBundle();
