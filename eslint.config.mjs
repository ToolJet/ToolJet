// Root ESLint flat config — delegates to frontend config.
// Uses dynamic import so plugin resolution happens from frontend/node_modules.
const { default: config } = await import('./frontend/eslint.config.mjs');
export default config;
