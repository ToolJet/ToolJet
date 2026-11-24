/**
 * Applies frontend/patches/ to node_modules. See patches/README.md for what is patched and why.
 *
 * Called from the bundler and Jest configs instead of an npm `postinstall`: the Dockerfiles run
 * `npm install` with only package.json copied in, and patch-package exits 0 when it finds no patches,
 * so a postinstall would build an unpatched image without any error.
 */
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const frontendDir = path.join(__dirname, '..');
const patchesDir = path.join(frontendDir, 'patches');

const PATCH_FILES = ['moment+2.31.0.patch'].map((file) => path.join(patchesDir, file));

function applyPatches() {
  const missing = PATCH_FILES.filter((file) => !fs.existsSync(file));
  if (missing.length) throw new Error(`Missing dependency patch: ${missing.join(', ')}`);

  try {
    execFileSync(process.execPath, [require.resolve('patch-package/index.js'), '--error-on-fail'], {
      cwd: frontendDir,
      stdio: 'pipe',
    });
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join('\n') || error.message;
    throw new Error(`Could not apply frontend/patches (see frontend/patches/README.md):\n${output}`);
  }
}

module.exports = { applyPatches, PATCH_FILES };
