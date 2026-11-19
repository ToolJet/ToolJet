import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
  applyStoredSource,
  loadsByComputedName,
  StoredSource,
  trustFileChanges,
} from '../../../src/lib/app/source-upload';

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
        'frontend/src/theme.ts': "import { brand } from './brand';\nexport default { brand };\n",
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
    const theme = "module.exports = require(process.env.THEME || './a.cjs');\n";
    write('frontend/src/theme.cjs', theme);

    // A pull carries every stored file: theme.cjs is unchanged, not removed.
    expect(
      trustFileChanges(root, stored({ 'frontend/src/theme.cjs': theme, 'frontend/src/App.tsx': 'changed' }))
    ).to.deep.equal(['frontend/src/App.tsx (frontend/src/theme.cjs loads files by a computed name)']);
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

/*
  The walk follows what a trusted build config loads the way Node does, whatever the extension: Node's CommonJS
  loader runs a required .txt, .md or .svg as JavaScript. A required file that is not a script, or a name the walk
  cannot resolve, leaves it unable to say what the build runs, so every change in the pull counts.
*/
describe('live sync and files a build config reaches through its helpers', () => {
  let root: string;
  const write = (rel: string, content: string) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content);
  };
  const stored = (files: Record<string, string>): StoredSource => ({
    files: Object.entries(files).map(([p, content]) => ({ path: p, content })),
  });
  /** Writes `files` here, and returns a pull of them with `changes` applied (a path set to null is removed). */
  const project = (files: Record<string, string>, changes: Record<string, string | null>): StoredSource => {
    for (const [rel, content] of Object.entries(files)) write(rel, content);
    const after: Record<string, string> = { ...files };
    for (const [rel, content] of Object.entries(changes))
      if (content === null) delete after[rel];
      else after[rel] = content;
    return stored(after);
  };

  const config = 'frontend/postcss.config.cjs';
  const loaderTxt = "const name = './payload' + '.txt';\nmodule.exports = require(name);\n";

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-trust-reach-'));
    write('frontend/package.json', '{"name":"demo-app"}');
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it('Node runs a required .txt helper as code, and the helper can require another', () => {
    // The premise of this block: a benign marker, loaded the way a build loads its config.
    write(config, "module.exports = require('./src/loader.txt');\n");
    write('frontend/src/loader.txt', loaderTxt);
    write('frontend/src/payload.txt', 'module.exports = { marker: 2 };\n');

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    expect(require(path.join(root, config))).to.deep.equal({ marker: 2 });
  });

  it('names a changed payload.txt that an unchanged loader.txt helper computes and requires', () => {
    const pull = project(
      {
        [config]: "module.exports = require('./src/loader.txt');\n",
        'frontend/src/loader.txt': loaderTxt,
        'frontend/src/payload.txt': 'module.exports = 1;\n',
      },
      { 'frontend/src/payload.txt': 'module.exports = 2;\n' }
    );

    expect(trustFileChanges(root, pull)).to.deep.equal([
      'frontend/src/payload.txt (the build runs frontend/src/loader.txt as code)',
    ]);
  });

  it('follows a literal require out of a non-script helper, and counts the rest of the pull', () => {
    const pull = project(
      {
        [config]: "module.exports = require('./src/loader.md');\n",
        'frontend/src/loader.md': "module.exports = require('./payload.svg');\n",
        'frontend/src/payload.svg': 'module.exports = 1;\n',
        'frontend/src/App.tsx': 'export const App = () => null;\n',
      },
      { 'frontend/src/payload.svg': 'module.exports = 2;\n', 'frontend/src/App.tsx': 'changed' }
    );

    expect(trustFileChanges(root, pull)).to.deep.equal([
      'frontend/src/payload.svg (loaded by the build)',
      'frontend/src/App.tsx (the build runs frontend/src/loader.md as code)',
    ]);
  });

  it('names a file a computed loader reads that the pull removes', () => {
    const pull = project(
      {
        [config]: "module.exports = require('fs').readFileSync('./src/marker.txt', 'utf8');\n",
        'frontend/src/marker.txt': 'previously trusted marker',
      },
      { 'frontend/src/marker.txt': null }
    );

    expect(trustFileChanges(root, pull)).to.deep.equal([
      'frontend/src/marker.txt (removed; frontend/postcss.config.cjs loads files by a computed name)',
    ]);
  });

  it('a pull that is stopped removes nothing; an approved one removes what the check named', () => {
    const pull = project(
      {
        [config]: "module.exports = require('fs').readFileSync('./src/marker.txt', 'utf8');\n",
        'frontend/src/marker.txt': 'previously trusted marker',
      },
      { 'frontend/src/marker.txt': null }
    );

    expect(trustFileChanges(root, pull)).to.have.length(1);
    expect(fs.existsSync(path.join(root, 'frontend/src/marker.txt'))).to.equal(true);
    expect(applyStoredSource(root, { ...pull, exists: true, revision: 2, owner: 'platform' }, 'v').removed).to.equal(1);
    expect(fs.existsSync(path.join(root, 'frontend/src/marker.txt'))).to.equal(false);
  });

  it('names both sides of a rename under a computed loader', () => {
    const pull = project(
      { [config]: 'module.exports = require(process.env.CONFIG);\n', 'frontend/src/a.txt': 'same' },
      { 'frontend/src/a.txt': null, 'frontend/src/b.txt': 'same' }
    );

    const by = 'frontend/postcss.config.cjs loads files by a computed name';
    expect(trustFileChanges(root, pull)).to.have.members([
      `frontend/src/a.txt (removed; ${by})`,
      `frontend/src/b.txt (${by})`,
    ]);
  });

  it('names a removed file that would hand a literal require to another candidate', () => {
    // require('./src/tokens') picks tokens.js; without it, the folder's index.js.
    const pull = project(
      {
        'frontend/tailwind.config.cjs': "module.exports = require('./src/tokens');\n",
        'frontend/src/tokens.js': 'module.exports = {};\n',
        'frontend/src/tokens/index.js': 'module.exports = { other: true };\n',
      },
      { 'frontend/src/tokens.js': null }
    );

    expect(trustFileChanges(root, pull)).to.deep.equal(['frontend/src/tokens.js (removed; loaded by the build)']);
  });

  it('lets ordinary removals and renames through without a computed loader', () => {
    const pull = project(
      {
        [config]: 'module.exports = { plugins: { tailwindcss: {} } };\n',
        'frontend/src/Old.tsx': 'export const Old = () => null;\n',
        'frontend/src/notes.md': 'notes',
      },
      {
        'frontend/src/Old.tsx': null,
        'frontend/src/New.tsx': 'export const New = () => null;\n',
        'frontend/src/notes.md': null,
      }
    );

    expect(trustFileChanges(root, pull)).to.deep.equal([]);
  });

  it('treats a name the walk cannot resolve as a computed loader', () => {
    for (const spec of [
      './src/missing.cjs',
      '/abs/frontend/src/payload.txt',
      '#payload',
      'demo-app/src/payload.txt',
      'tailwindcss/../../src/payload.txt',
      'file:///frontend/src/payload.txt',
      '../../outside.cjs',
      './src',
    ]) {
      fs.rmSync(root, { recursive: true, force: true });
      fs.mkdirSync(root);
      const pull = project(
        {
          'frontend/package.json': '{"name":"demo-app","imports":{"#payload":"./src/payload.txt"}}',
          [config]: `module.exports = require('${spec}');\n`,
          'frontend/src/payload.txt': 'module.exports = 1;\n',
          'frontend/src/package.json': '{"main":"payload.txt"}',
        },
        { 'frontend/src/payload.txt': 'module.exports = 2;\n' }
      );

      expect(trustFileChanges(root, pull), spec).to.deep.equal([
        `frontend/src/payload.txt (frontend/postcss.config.cjs loads '${spec}', which this check cannot resolve)`,
      ]);
    }
  });

  it("follows a stylesheet's @config the way Tailwind resolves it, with or without './'", () => {
    const pull = project(
      {
        'frontend/src/index.css': '@config "theme.txt";\n@tailwind utilities;\n',
        'frontend/src/theme.txt': 'module.exports = {};\n',
        'frontend/src/App.tsx': 'changed before',
      },
      { 'frontend/src/App.tsx': 'changed after' }
    );

    expect(trustFileChanges(root, pull)).to.deep.equal([
      'frontend/src/App.tsx (the build runs frontend/src/theme.txt as code)',
    ]);
  });

  it('names a plugin a PostCSS config names by path, and lets other changes through', () => {
    const pull = project(
      {
        [config]: "module.exports = { plugins: { './src/plugin.cjs': {}, tailwindcss: {} } };\n",
        'frontend/src/plugin.cjs': 'module.exports = () => ({ postcssPlugin: "x" });\n',
        'frontend/src/App.tsx': 'before',
      },
      {
        'frontend/src/plugin.cjs': 'module.exports = () => ({ postcssPlugin: "y" });\n',
        'frontend/src/App.tsx': 'after',
      }
    );

    expect(trustFileChanges(root, pull)).to.deep.equal(['frontend/src/plugin.cjs (loaded by the build)']);
  });

  it('reads a required .json as data: its change counts, the rest of the pull does not', () => {
    const pull = project(
      {
        'frontend/tailwind.config.cjs': "module.exports = { theme: require('./src/tokens.json') };\n",
        'frontend/src/tokens.json': '{"a":1}',
        'frontend/src/App.tsx': 'before',
      },
      { 'frontend/src/tokens.json': '{"a":2}', 'frontend/src/App.tsx': 'after' }
    );

    expect(trustFileChanges(root, pull)).to.deep.equal(['frontend/src/tokens.json (loaded by the build)']);
  });

  it('names a pulled file under a node_modules folder, where package names resolve', () => {
    const pull = project(
      { [config]: 'module.exports = { plugins: { tailwindcss: {} } };\n' },
      { 'frontend/src/node_modules/tailwindcss/index.js': 'module.exports = () => ({});\n' }
    );

    expect(trustFileChanges(root, pull)).to.deep.equal([
      'frontend/src/node_modules/tailwindcss/index.js (a package folder the build resolves packages from)',
    ]);
  });
});
