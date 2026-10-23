#!/usr/bin/env node
// Builds a component pack (a custom-component library project) into dist/: the bundle and CSS exactly as
// `tooljet library build` makes them (ESM, React external, the SDK read from window.__tj_ToolJet), and a v2 manifest.
//
// The v2 manifest is a superset of the CLI's: what every SDK hook call declares, recorded by rendering each component
// once with a recording SDK (sdk-recorder.cjs), so options the CLI's static generator does not know reach ToolJet:
// styles, limits (min/max), conditional fields (visibleWhen), the options editor, the validation section, slots, row
// slots and popup slots, the control state, and per component role, usage, fit and size from the pack's pack.json.
//
//   node packages/pack-tools/build.mjs <packDir>
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const packDir = path.resolve(process.argv[2] || '.');
const dist = path.join(packDir, 'dist');
const require = createRequire(path.join(packDir, 'package.json'));
const meta = fs.existsSync(path.join(packDir, 'pack.json')) ? JSON.parse(fs.readFileSync(path.join(packDir, 'pack.json'), 'utf8')) : {};

const sdkProxy = (contents) => ({
  name: 'tooljet-sdk',
  setup(b) {
    b.onResolve({ filter: /^@tooljet\/custom-component-sdk$/ }, () => ({ path: 'sdk', namespace: 'tooljet-sdk' }));
    b.onLoad({ filter: /.*/, namespace: 'tooljet-sdk' }, () => ({ contents, loader: 'js' }));
  },
});

// 1. The bundle and CSS, as the CLI makes them.
fs.rmSync(dist, { recursive: true, force: true });
await build({
  entryPoints: [path.join(packDir, 'src/index.ts')],
  bundle: true,
  format: 'esm',
  outfile: path.join(dist, 'index.js'),
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  plugins: [sdkProxy('export const ToolJet = window.__tj_ToolJet;')],
  jsx: 'automatic',
  minify: true,
  legalComments: 'eof',
  logLevel: 'error',
});

// 2. Record the manifest: bundle for node with the recording SDK, render every export once.
const cache = path.join(packDir, 'node_modules', '.cache');
fs.mkdirSync(cache, { recursive: true });
const recorded = path.join(cache, 'pack-record.cjs');
const stub = path.join(cache, 'pack-stub.cjs');
fs.writeFileSync(stub, 'module.exports = new Proxy(function () {}, { get: () => module.exports, apply: () => module.exports });');
await build({
  entryPoints: [path.join(packDir, 'src/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: recorded,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  alias: { '@tooljet/custom-component-sdk': path.join(here, 'sdk-recorder.cjs'), leaflet: stub },
  loader: { '.css': 'empty' },
  jsx: 'automatic',
  logLevel: 'error',
});
const recorder = require(path.join(here, 'sdk-recorder.cjs'));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const mod = require(recorded);
const quiet = console.error;
console.error = () => {}; // server-render warnings (useLayoutEffect) are noise here
const components = {};
const warnings = [];
for (const [name, Component] of Object.entries(mod)) {
  if (typeof Component !== 'function') continue;
  recorder.start();
  try {
    renderToStaticMarkup(React.createElement(Component));
  } catch (err) {
    warnings.push(`${name}: ${String(err.message).split('\n')[0]}`);
  }
  // A component rendered twice in one pass (a useLayoutEffect warning re-renders it) records each hook twice: the
  // first call of each kind and name is the declaration.
  const seen = new Set();
  const calls = recorder.stop().filter((c) => {
    const key = `${c.kind}:${c.name ?? ''}`;
    if (c.kind !== 'settings' && c.kind !== 'validation' && !c.name) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  components[name] = toManifest(name, calls, meta.components?.[name] ?? {});
}
console.error = quiet;

function toProp(c) {
  const p = { name: c.name, type: c.type };
  for (const key of ['label', 'section', 'inspector', 'description', 'placeholder', 'min', 'max', 'visibleWhen', 'enumLabels'])
    if (c[key] !== undefined) p[key] = c[key];
  if (c.initialValue !== undefined) p.default = c.initialValue;
  if (c.enumDefinition) p.enumValues = c.enumDefinition;
  return p;
}

function toManifest(name, calls, extra) {
  const settings = calls.find((c) => c.kind === 'settings') ?? {};
  const validation = calls.find((c) => c.kind === 'validation');
  const slots = [
    ...calls.filter((c) => c.kind === 'slot').map((c) => ({ name: c.name, kind: 'slot' })),
    ...calls.filter((c) => c.kind === 'rowSlot').map((c) => ({ name: c.name, kind: 'rows' })),
    ...calls.filter((c) => c.kind === 'popupSlot').map((c) => ({ name: c.name, kind: 'popup' })),
    ...(extra.slots ?? []),
  ];
  return {
    displayName: extra.displayName ?? name.replace(/([a-z0-9])([A-Z])/g, '$1 $2'),
    defaultWidth: settings.defaultWidth ?? 6,
    defaultHeight: settings.defaultHeight ?? 4,
    props: calls.filter((c) => c.kind === 'state').map(toProp),
    styles: calls.filter((c) => c.kind === 'style').map(toProp),
    events: calls.filter((c) => c.kind === 'event').map((c) => ({ name: c.name, ...(c.displayName ? { displayName: c.displayName } : {}) })),
    actions: calls
      .filter((c) => c.kind === 'action' && c.name)
      .map((c) => ({ name: c.name, displayName: c.displayName ?? c.name, ...(c.params?.length ? { params: c.params } : {}) })),
    // v2
    ...(validation ? { validation: validation.section ?? 'text' } : {}),
    ...(calls.some((c) => c.kind === 'controlState') ? { controlState: true } : {}),
    ...(slots.length ? { slots } : {}),
    ...(extra.role ? { role: extra.role } : {}),
    ...(extra.usage ? { usage: extra.usage } : {}),
    // "own": the component draws its own loading look (useControlState().loading), so the host shows no overlay.
    ...(extra.loading ? { loading: extra.loading } : {}),
    // How the pack names the role's options, events, actions and values (the AI plans in roles: libSwap.ts in TJ-AI).
    ...Object.fromEntries(['roleProps', 'roleValues', 'roleEvents', 'roleActions'].filter((k) => extra[k]).map((k) => [k, extra[k]])),
    fit: extra.fit !== undefined ? extra.fit : !slots.some((s) => s.kind === 'slot'),
  };
}

// A pack drawn in its own design system's look (not the app theme) declares the surface its cards and page take, so
// ToolJet's layout containers around its components match them (pack.json "surface", read by the AI compiler).
const manifest = { manifestVersion: 2, pack: meta.pack ?? path.basename(packDir), ...(meta.surface ? { surface: meta.surface } : {}), ...(meta.themeMode ? { themeMode: meta.themeMode } : {}), components };
fs.writeFileSync(path.join(dist, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.rmSync(recorded, { force: true });
const kb = (f) => Math.round(fs.statSync(path.join(dist, f)).size / 1024);
console.log(
  `${manifest.pack}: ${Object.keys(components).length} components, index.js ${kb('index.js')} KB` +
    (fs.existsSync(path.join(dist, 'index.css')) ? `, index.css ${kb('index.css')} KB` : '')
);
if (warnings.length) console.log(`render warnings (manifest may be partial):\n  ${warnings.join('\n  ')}`);
