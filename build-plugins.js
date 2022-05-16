/* eslint-env es6 */
/* eslint-disable no-console */

const { execSync } = require('child_process');

const node_env = process.env.NODE_ENV;

execSync('NODE_ENV=development && npm --prefix plugins install');

execSync(`NODE_ENV=${node_env} && npm --prefix plugins run build`);

// Remove dev dependencies for production environment
if (process.env.NODE_ENV === 'production') {
  execSync('npm prune --production');
}
