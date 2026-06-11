const { execSync } = require('child_process');

if (process.env.NODE_ENV === 'production') {
  execSync('npx lerna run build --stream');
} else {
  execSync('npx lerna run build --stream --no-private');
}
