const { execSync } = require('child_process');

if (process.env.NODE_ENV === 'production') {
  // if tooljet host is 'app.tooljet.com', dont build grpc packages
  if (process.env.TOOLJET_HOST.includes('app.tooljet.com')) {
    execSync('npx lerna run build --stream --ignore @tooljet/grpc-*');
  } else {
    execSync('npx lerna run build --stream');
  }
} else {
  execSync('npx lerna run build --stream --no-private');
}
