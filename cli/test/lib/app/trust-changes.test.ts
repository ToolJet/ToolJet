import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { StoredSource, trustFileChanges } from '../../../src/lib/app/source-upload';

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

    expect(changes).to.have.members([
      'frontend/src/brand.ts (loaded by the build)',
      'frontend/src/tokens.cjs (loaded by the build)',
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
