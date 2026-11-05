import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { loadsByComputedName, StoredSource, trustFileChanges } from '../../../src/lib/app/source-upload';

/* Live sync stops before pulling a change that a local build would run as code. */
describe('live sync and code a build loads', () => {
  let root: string;
  const write = (rel: string, content: string) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content);
  };

  const stored = (files: Record<string, string>): StoredSource => ({
    files: Object.entries(files).map(([p, content]) => ({ path: p, content })),
  });

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-trust-code-'));
    write('frontend/package.json', '{"name":"x"}');
    write('frontend/postcss.config.cjs', 'module.exports = { plugins: { tailwindcss: {} } };\n');
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it('names a stylesheet that adds a Tailwind @config, and the file it names', () => {
    write('frontend/src/index.css', '@tailwind utilities;\n');

    const changes = trustFileChanges(
      root,
      stored({
        'frontend/src/index.css': '@config "./lib/theme.cjs";\n@tailwind utilities;\n',
        'frontend/src/lib/theme.cjs': 'module.exports = {};',
      })
    );

    expect(changes).to.have.members([
      'frontend/src/index.css (@config)',
      'frontend/src/lib/theme.cjs (loaded by the build)',
    ]);
  });

  it('names a new stylesheet with @plugin, and an @import of a script', () => {
    expect(
      trustFileChanges(root, stored({ 'frontend/styles/global.css': '/* x */ @plugin "./plugin.js";' }))
    ).to.deep.equal(['frontend/styles/global.css (@plugin)']);
    expect(trustFileChanges(root, stored({ 'frontend/src/index.css': '@import "./tokens.js";\n' }))).to.deep.equal([
      'frontend/src/index.css (@import)',
    ]);
  });

  it('names a change to code that an existing @config or a build config loads, through its imports', () => {
    write('frontend/src/index.css', '@config "./theme.ts";\n@tailwind utilities;\n');
    write('frontend/src/theme.ts', "import { brand } from './brand';\nexport default { brand };\n");
    write('frontend/src/brand.ts', "export const brand = 'blue';\n");
    write('frontend/tailwind.config.cjs', "module.exports = require('./src/tokens.cjs');\n");
    write('frontend/src/tokens.cjs', 'module.exports = {};\n');

    const changes = trustFileChanges(
      root,
      stored({
        'frontend/src/index.css': '@config "./theme.ts";\n@tailwind utilities;\n.extra { color: red; }\n',
        'frontend/src/brand.ts': "export const brand = require('child_process');\n",
        'frontend/src/tokens.cjs': 'module.exports = { changed: true };\n',
        'frontend/src/App.tsx': 'export const App = () => null;\n',
      })
    );

    // The pulled brand.ts loads a built-in that runs code, so the rest of the pull counts too, the stylesheet included.
    expect(changes).to.have.members([
      'frontend/src/brand.ts (loaded by the build)',
      'frontend/src/tokens.cjs (loaded by the build)',
      'frontend/src/index.css (frontend/src/brand.ts loads files by a computed name)',
      'frontend/src/App.tsx (frontend/src/brand.ts loads files by a computed name)',
    ]);
  });

  it('lets ordinary stylesheet and component changes through', () => {
    write('frontend/src/index.css', '@config "./theme.cjs";\n.a { color: red; }\n');
    write('frontend/src/theme.cjs', 'module.exports = {};\n');

    const changes = trustFileChanges(
      root,
      stored({
        'frontend/src/index.css': '@config "./theme.cjs";\n.a { color: blue; }\n/* @plugin "./x.js" */\n',
        'frontend/src/theme.cjs': 'module.exports = {};\n',
        'frontend/src/App/index.tsx': 'changed',
      })
    );

    expect(changes).to.deep.equal([]);
  });

  it('names changed component code when this project renders components in Node (recordRender)', () => {
    write('frontend/.tooljet/config.json', '{"recordRender":true}');

    const changes = trustFileChanges(
      root,
      stored({ 'frontend/src/App/index.tsx': 'changed', 'frontend/src/notes.md': 'changed' })
    );

    expect(changes).to.deep.equal(['frontend/src/App/index.tsx (recordRender runs it)']);
  });
});

/*
  A build config that names what it loads at run time (require(configName)) can run any project file, so the literal
  inventory above cannot say which pulled change it runs: then every pulled change, whatever its extension, needs
  --trust-remote-config.
*/
describe('live sync when a build config loads files by a computed name', () => {
  let root: string;
  const write = (rel: string, content: string) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content);
  };
  const stored = (files: Record<string, string>): StoredSource => ({
    files: Object.entries(files).map(([p, content]) => ({ path: p, content })),
  });
  /** The scaffold's own config, without its front matter. */
  const template = (name: string) =>
    fs
      .readFileSync(path.join(__dirname, '..', '..', '..', 'src', '_templates', 'library', 'code-app', name), 'utf8')
      .replace(/^---[\s\S]*?---\n/, '');

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-trust-computed-'));
    write('frontend/package.json', '{"name":"x"}');
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it('names a changed file a computed require could load, which the literal inventory missed', () => {
    write(
      'frontend/postcss.config.cjs',
      "const configName = './src/config.js';\nmodule.exports = require(configName);\n"
    );
    write('frontend/src/config.js', 'module.exports = { plugins: {} };\n');

    const changes = trustFileChanges(root, stored({ 'frontend/src/config.js': "require('child_process');\n" }));

    expect(changes).to.deep.equal([
      'frontend/src/config.js (frontend/postcss.config.cjs loads files by a computed name)',
    ]);
  });

  it('then names every changed stored file, documents, SVGs and plain stylesheets included', () => {
    write('frontend/tailwind.config.cjs', 'const load = require;\nmodule.exports = load(`./src/${"theme"}.cjs`);\n');

    const changes = trustFileChanges(
      root,
      stored({
        'frontend/src/App/index.tsx': 'changed',
        'frontend/src/data/tokens.json': '{"a":1}',
        'frontend/src/notes.md': 'changed',
        'frontend/src/logo.svg': '<svg/>',
        'frontend/styles/global.css': '.a { color: red; }',
      })
    );

    const by = '(frontend/tailwind.config.cjs loads files by a computed name)';
    expect(changes).to.have.members([
      `frontend/src/App/index.tsx ${by}`,
      `frontend/src/data/tokens.json ${by}`,
      `frontend/src/notes.md ${by}`,
      `frontend/src/logo.svg ${by}`,
      `frontend/styles/global.css ${by}`,
    ]);
  });

  /* A trusted config that reads a file and runs it: the extension says nothing about how the loader treats it. */
  const readsAndRuns =
    "const fs = require('fs');\nconst name = './src/payload' + '.txt';\n" +
    "new Function(fs.readFileSync(require('path').join(__dirname, name), 'utf8'))();\nmodule.exports = {};\n";

  for (const rel of ['frontend/src/payload.txt', 'frontend/src/notes.md', 'frontend/src/logo.svg']) {
    it(`names a changed ${path.extname(rel)} file a computed loader could read and run`, () => {
      write('frontend/postcss.config.cjs', readsAndRuns);
      write(rel, 'before');

      expect(trustFileChanges(root, stored({ [rel]: 'after' }))).to.deep.equal([
        `${rel} (frontend/postcss.config.cjs loads files by a computed name)`,
      ]);
    });

    it(`lets the same ${path.extname(rel)} change through without a computed loader`, () => {
      write('frontend/postcss.config.cjs', 'module.exports = { plugins: { tailwindcss: {} } };\n');
      write(rel, 'before');

      expect(trustFileChanges(root, stored({ [rel]: 'after' }))).to.deep.equal([]);
    });
  }

  it('does not name an unchanged document under a computed loader', () => {
    write('frontend/postcss.config.cjs', readsAndRuns);
    write('frontend/src/payload.txt', 'same');

    expect(trustFileChanges(root, stored({ 'frontend/src/payload.txt': 'same' }))).to.deep.equal([]);
  });

  it('counts a computed load in a file a config imports literally', () => {
    write('frontend/tailwind.config.cjs', "module.exports = require('./src/theme.cjs');\n");
    write('frontend/src/theme.cjs', "module.exports = require(process.env.THEME || './a.cjs');\n");

    expect(trustFileChanges(root, stored({ 'frontend/src/App.tsx': 'changed' }))).to.deep.equal([
      'frontend/src/App.tsx (frontend/src/theme.cjs loads files by a computed name)',
    ]);
  });

  it("keeps the scaffold's own configs on the literal inventory, so component edits still pull", () => {
    write('frontend/postcss.config.cjs', template('postcss.ejs.t'));
    write('frontend/tailwind.config.cjs', template('tailwind.ejs.t'));

    expect(trustFileChanges(root, stored({ 'frontend/src/App/index.tsx': 'changed' }))).to.deep.equal([]);
  });

  it('reads indirect loading loosely: anything that might be one counts', () => {
    for (const code of [
      'module.exports = require(name);',
      'const r = require; module.exports = r("./x");',
      'module.exports = import(spec);',
      'module.exports = require(`./${x}`);',
      'const { createRequire } = require("module");',
      'module.exports = eval("require")("./x");',
      'module.exports = this.constructor.constructor("return process")();',
      'module.exports = globalThis["req" + "uire"]("./x");',
      'module.exports = module["require"]("./x");',
      'module.exports = JSON.parse(require("fs").readFileSync("./x"));',
      'export default await import(new URL("./x", import.meta.url));',
      'module.exports = __non_webpack_require__("./x");',
    ])
      expect(loadsByComputedName(code), code).to.equal(true);
    for (const code of [
      'module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };',
      "module.exports = { plugins: [require('tailwindcss-animate')], presets: [require('./preset.cjs')] };",
      "import preset from './preset.js';\nexport default { presets: [preset] };",
      "/** @type {import('tailwindcss').Config} */\nmodule.exports = {};",
    ])
      expect(loadsByComputedName(code), code).to.equal(false);
  });
});
