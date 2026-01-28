const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../build');

if (!fs.existsSync(distPath)) {
  console.log('⚠️  No build folder found, skipping bundle check');
  process.exit(0);
}

const files = fs.readdirSync(distPath).filter(f => f.endsWith('.js'));
const VIEWER_MAX = 1.5 * 1024 * 1024; // 1.5 MB

let failed = false;

console.log('\n📦 Bundle Size Report:\n');

files.forEach(file => {
  const size = fs.statSync(path.join(distPath, file)).size;
  const sizeMB = (size / 1024 / 1024).toFixed(2);

  if (file.includes('viewer') && size > VIEWER_MAX) {
    console.error(`❌ ${file}: ${sizeMB}MB (exceeds 1.5MB limit)`);
    failed = true;
  } else if (file.includes('viewer')) {
    console.log(`✅ ${file}: ${sizeMB}MB (viewer bundle)`);
  } else {
    console.log(`ℹ️  ${file}: ${sizeMB}MB`);
  }
});

if (failed) {
  console.log('\n❌ Bundle size check failed!\n');
  process.exit(1);
}

console.log('\n✅ All bundles within size limits\n');
