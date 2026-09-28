/**
 * Builds the custom-component vendor bundles (F2).
 *
 * Produces browser-ready ESM builds of React from THIS frontend's node_modules,
 * so custom component bundles (built by the ToolJet CLI with
 * `external: ['react', 'react-dom', 'react/jsx-runtime']`) can resolve their
 * bare `import ... from 'react'` statements via the import map declared in
 * assets/custom-components/shell.html.
 *
 * Two CJS→ESM traps this script works around (learned the hard way):
 * 1. `external: ['react']` + ESM output emits a runtime-throwing "Dynamic
 *    require" stub inside react-dom (CJS internals). → No externals; ONE build
 *    with code `splitting`, so the shared React module lands in a common chunk
 *    every entry statically imports. One React instance per iframe.
 * 2. esbuild does not synthesize static NAMED exports for a CJS entry point —
 *    `import { useState } from 'react'` would fail at the module boundary.
 *    → Entry files are GENERATED: we require() each package here in Node and
 *    emit explicit `export { ...names } from 'pkg'` lists (the esm.sh trick).
 *
 * React version is tied to the ToolJet release — vendor is regenerated on
 * every `npm run build` (prebuild) and `npm start` (prestart).
 *
 * Output (gitignored, generated): assets/custom-components/vendor/
 *   react.js, jsx-runtime.js, react-dom.js, react-dom-client.js + shared chunks
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const os = require('os');

const frontendDir = path.join(__dirname, '..');
const outDir = path.join(frontendDir, 'assets', 'custom-components', 'vendor');

const TARGETS = {
  react: 'react',
  'jsx-runtime': 'react/jsx-runtime',
  'react-dom': 'react-dom',
  'react-dom-client': 'react-dom/client',
};

const isIdent = (s) => /^[A-Za-z_$][\w$]*$/.test(s);

// Generate a real-ESM facade entry: static named exports taken from the CJS
// module's actual runtime keys, plus a default export.
function entrySource(pkg) {
  const names = Object.keys(require(pkg)).filter(isIdent).filter((n) => n !== 'default');
  return `export { ${names.join(', ')} } from '${pkg}';\nexport { default } from '${pkg}';\n`;
}

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-vendor-entries-'));
  const entryPoints = {};
  for (const [outName, pkg] of Object.entries(TARGETS)) {
    const file = path.join(tmpDir, `${outName}.js`);
    fs.writeFileSync(file, entrySource(pkg));
    entryPoints[outName] = file;
  }

  try {
    await esbuild.build({
      entryPoints,
      bundle: true,
      splitting: true,
      format: 'esm',
      minify: true,
      // React's source branches on process.env.NODE_ENV; a browser has no `process`.
      define: { 'process.env.NODE_ENV': '"production"' },
      // Entry files live in a temp dir — resolve bare specifiers from frontend.
      nodePaths: [path.join(frontendDir, 'node_modules')],
      outdir: outDir,
      chunkNames: 'shared-[hash]',
      logLevel: 'warning',
    });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // Self-check: the exact imports a CLI-built component bundle will perform.
  const [react, jsx, client] = await Promise.all(
    ['react.js', 'jsx-runtime.js', 'react-dom-client.js'].map(
      (f) => import(`file://${path.join(outDir, f)}`)
    )
  );
  const checks = {
    'react.useState': typeof react.useState === 'function',
    'react default createElement': typeof react.default?.createElement === 'function',
    'jsx-runtime jsx/jsxs/Fragment': typeof jsx.jsx === 'function' && typeof jsx.jsxs === 'function' && jsx.Fragment != null,
    'react-dom-client createRoot': typeof client.createRoot === 'function',
  };
  const failed = Object.entries(checks).filter(([, ok]) => !ok);
  if (failed.length) {
    throw new Error(`vendor self-check FAILED: ${failed.map(([k]) => k).join(', ')}`);
  }
  console.log(`custom-component vendor bundles written to ${outDir} (react ${react.version}) — self-check passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
