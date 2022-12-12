const { execSync } = require('child_process');

if (process.env.NODE_ENV === 'production') {
  execSync('npx lerna run clean --parallel');
} else {
  execSync('npx lerna run clean --parallel --no-private');
}
