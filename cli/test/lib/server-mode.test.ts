import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { detectPackageManager, installDependencies, lockMismatch } from '../../src/lib/app/deps';
import { prepareDependencies } from '../../src/lib/app/sdk';
import { trustFileChanges } from '../../src/lib/app/source-upload';
import { build } from '../../src/lib/library/builder';
import { assertNoCodeInCss, ignoredConfigs, trustedTailwindConfig } from '../../src/lib/library/trusted-css';

/* Server mode runs no project code, and what is installed matches the lockfile. */
const SENTINEL = () => path.join(os.tmpdir(), `tj-server-mode-${process.pid}`);
const TEMPLATES = path.join(__dirname, '..', '..', 'src', '_templates', 'library', 'code-app');

const project = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-server-mode-'));
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.mkdirSync(path.join(root, 'styles'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'tsconfig.json'),
    JSON.stringify({ compilerOptions: { target: 'esnext', module: 'esnext', moduleResolution: 'node', jsx: 'react-jsx', skipLibCheck: true, types: [], noEmit: true } })
  );
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'demo', version: '1.0.0' }));
  fs.writeFileSync(path.join(root, 'src', 'index.ts'), "import './main.css';\nexport const a = 1;\n");
  fs.writeFileSync(path.join(root, 'src', 'main.css'), '.keep { color: red; }\n@tailwind utilities;\n');
  fs.writeFileSync(path.join(root, 'src', 'view.tsx'), 'export const v = "bg-primary p-4 animate-in";\n');
  return root;
};

describe('server mode', () => {
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env.TOOLJET_CLI_SERVER_MODE;
    process.env.TOOLJET_CLI_SERVER_MODE = '1';
    fs.rmSync(SENTINEL(), { force: true });
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.TOOLJET_CLI_SERVER_MODE;
    else process.env.TOOLJET_CLI_SERVER_MODE = saved;
    fs.rmSync(SENTINEL(), { force: true });
  });

  const evil = `require('fs').writeFileSync(${JSON.stringify(SENTINEL())}, 'ran');\nmodule.exports = { plugins: {} };\n`;

  it("never loads the project's postcss or tailwind config, and still compiles Tailwind", async () => {
    const root = project();
    fs.writeFileSync(path.join(root, 'postcss.config.cjs'), evil);
    fs.writeFileSync(path.join(root, 'tailwind.config.cjs'), evil);
    const result = await build(root);
    expect(fs.existsSync(SENTINEL())).to.equal(false);
    const css = fs.readFileSync(path.join(result.distDir, 'index.css'), 'utf8');
    expect(css).to.include('.p-4').and.include('.bg-primary').and.include('.animate-in');
    expect(result.warnings.join(' ')).to.include('postcss.config.cjs').and.include('tailwind.config.cjs');
  }).timeout(60_000);

  it('runs project config outside server mode, as a developer expects', async () => {
    delete process.env.TOOLJET_CLI_SERVER_MODE;
    const root = project();
    fs.writeFileSync(path.join(root, 'src', 'main.css'), '.keep { color: red; }\n');
    fs.mkdirSync(path.join(root, 'node_modules', 'postcss'), { recursive: true });
    fs.writeFileSync(path.join(root, 'node_modules', 'postcss', 'index.js'), `module.exports = require(${JSON.stringify(require.resolve('postcss'))});`);
    fs.writeFileSync(path.join(root, 'postcss.config.cjs'), evil);
    await build(root);
    expect(fs.existsSync(SENTINEL())).to.equal(true);
  }).timeout(60_000);

  it('does not resolve postcss from the project', async () => {
    const root = project();
    fs.mkdirSync(path.join(root, 'node_modules', 'postcss'), { recursive: true });
    fs.writeFileSync(path.join(root, 'node_modules', 'postcss', 'index.js'), evil);
    await build(root);
    expect(fs.existsSync(SENTINEL())).to.equal(false);
  }).timeout(60_000);

  it('ignores a browserslist that extends a package', async () => {
    const root = project();
    fs.mkdirSync(path.join(root, 'node_modules', 'browserslist-config-evil'), { recursive: true });
    fs.writeFileSync(path.join(root, 'node_modules', 'browserslist-config-evil', 'index.js'), evil);
    fs.writeFileSync(path.join(root, '.browserslistrc'), 'extends browserslist-config-evil\n');
    await build(root);
    expect(fs.existsSync(SENTINEL())).to.equal(false);
  }).timeout(60_000);

  it('does not render components in Node, whatever .tooljet/config.json asks', async () => {
    const root = project();
    fs.mkdirSync(path.join(root, '.tooljet'), { recursive: true });
    fs.writeFileSync(path.join(root, '.tooljet', 'config.json'), JSON.stringify({ recordRender: true }));
    fs.writeFileSync(path.join(root, 'src', 'index.ts'), `import './main.css';\nrequire('fs').writeFileSync(${JSON.stringify(SENTINEL())}, 'ran');\nexport const a = 1;\n`);
    await build(root).catch(() => undefined);
    expect(fs.existsSync(SENTINEL())).to.equal(false);
  }).timeout(60_000);

  it('fails a build whose CSS names config or a script to load', async () => {
    for (const css of ['@config "./evil.js";', '@plugin "./evil.js";', '@import "./evil.js";', "@import url('./evil.mjs');"]) {
      const root = project();
      fs.writeFileSync(path.join(root, 'src', 'main.css'), `${css}\n@tailwind utilities;\n`);
      let error: Error | undefined;
      await build(root).catch((e) => (error = e));
      expect(error?.message, css).to.match(/does not allow/);
    }
  }).timeout(60_000);

  it('leaves ordinary CSS and comments alone', () => {
    expect(() => assertNoCodeInCss('/* @config "x.js" */ @import "./other.css"; @tailwind base;', 'a.css')).not.to.throw();
    expect(() => assertNoCodeInCss('@import "@fontsource/inter/400.css";', 'a.css')).not.to.throw();
  });

  it('uses the template config, and says nothing about an unchanged copy of it', () => {
    const root = project();
    const body = (file: string) => fs.readFileSync(path.join(TEMPLATES, file), 'utf8').replace(/^---[\s\S]*?---\n/, '');
    fs.writeFileSync(path.join(root, 'tailwind.config.cjs'), body('tailwind.ejs.t'));
    fs.writeFileSync(path.join(root, 'postcss.config.cjs'), body('postcss.ejs.t'));
    expect(ignoredConfigs(root)).to.deep.equal([]);
    const template = new Function('module', 'require', `${body('tailwind.ejs.t')}; return module.exports;`)({ exports: {} }, require) as any;
    const trusted = trustedTailwindConfig(root) as any;
    expect(JSON.stringify(trusted.theme)).to.equal(JSON.stringify(template.theme));
    expect(trusted.darkMode).to.deep.equal(template.darkMode);
    expect(trusted.plugins).to.have.length(template.plugins.length);
  });

  it("uses npm whatever the project's lockfile, and keeps a project .npmrc and ToolJet's credentials out of the install", () => {
    const root = project();
    fs.writeFileSync(path.join(root, 'yarn.lock'), '');
    fs.writeFileSync(path.join(root, '.npmrc'), 'registry=https://evil.example/\n');
    expect(detectPackageManager(root)).to.equal('npm');
    process.env.TOOLJET_SESSION_TOKEN = 'a-session';
    let during = '';
    let env: NodeJS.ProcessEnv = {};
    installDependencies(root, {
      run: (_c, _a, options) => {
        during = fs.readFileSync(path.join(root, '.npmrc'), 'utf8');
        env = options.env;
        return { status: 0 };
      },
    });
    delete process.env.TOOLJET_SESSION_TOKEN;
    expect(during).to.equal('ignore-scripts=true\n');
    expect(env.TOOLJET_SESSION_TOKEN).to.equal(undefined);
    expect(fs.readFileSync(path.join(root, '.npmrc'), 'utf8')).to.include('evil.example');
  });
});

describe('what is installed matches the lockfile', () => {
  const installed = (lockVersion = '1.0.0', haveVersion = '1.0.0') => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-lock-'));
    const pkg = path.join(root, 'node_modules', 'left-pad');
    fs.mkdirSync(pkg, { recursive: true });
    fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ version: haveVersion }));
    fs.writeFileSync(path.join(root, 'package.json'), '{"name":"x"}');
    fs.writeFileSync(path.join(root, 'package-lock.json'), JSON.stringify({ packages: { '': {}, 'node_modules/left-pad': { version: lockVersion, integrity: 'sha-a' } } }));
    fs.writeFileSync(path.join(root, 'node_modules', '.package-lock.json'), JSON.stringify({ packages: { 'node_modules/left-pad': { version: haveVersion, integrity: 'sha-a' } } }));
    return root;
  };

  it('is in step when versions and integrity agree', () => {
    expect(lockMismatch(installed())).to.equal(undefined);
  });

  it('notices another version, other bytes, a tampered package, a missing or an extra package', () => {
    expect(lockMismatch(installed('2.0.0'))).to.match(/lockfile says 2.0.0/);
    const bytes = installed();
    fs.writeFileSync(path.join(bytes, 'package-lock.json'), JSON.stringify({ packages: { 'node_modules/left-pad': { version: '1.0.0', integrity: 'sha-b' } } }));
    expect(lockMismatch(bytes)).to.match(/differs/);
    const tampered = installed();
    fs.writeFileSync(path.join(tampered, 'node_modules', 'left-pad', 'package.json'), JSON.stringify({ version: '9.9.9' }));
    expect(lockMismatch(tampered)).to.match(/on disk is 9.9.9/);
    const missing = installed();
    fs.writeFileSync(path.join(missing, 'node_modules', '.package-lock.json'), JSON.stringify({ packages: {} }));
    expect(lockMismatch(missing)).to.match(/not installed/);
    const extra = installed();
    fs.writeFileSync(path.join(extra, 'node_modules', '.package-lock.json'), JSON.stringify({ packages: { 'node_modules/left-pad': { version: '1.0.0', integrity: 'sha-a' }, 'node_modules/evil': { version: '1.0.0' } } }));
    expect(lockMismatch(extra)).to.match(/not in the lockfile/);
  });

  it('leaves out the SDK, which is installed over the lockfile on purpose, and optional packages of another platform', () => {
    const root = installed();
    fs.writeFileSync(path.join(root, 'package-lock.json'), JSON.stringify({ packages: {
      'node_modules/left-pad': { version: '1.0.0', integrity: 'sha-a' },
      'node_modules/@tooljet/custom-component-sdk': { version: '0.1.0' },
      'node_modules/@esbuild/win32-x64': { version: '1.0.0', optional: true },
    } }));
    expect(lockMismatch(root)).to.equal(undefined);
  });

  it('reinstalls exactly from the lockfile when it does not match', async () => {
    const root = installed('2.0.0');
    const calls: string[][] = [];
    await prepareDependencies(root, { run: (c, a) => (calls.push([c, ...a]), { status: 0 }) });
    expect(calls[0].slice(0, 2)).to.deep.equal(['npm', 'ci']);
  });
});

describe('live sync and what a build runs', () => {
  const root = () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-trust-'));
    fs.mkdirSync(path.join(dir, 'frontend'));
    fs.writeFileSync(path.join(dir, 'frontend', 'postcss.config.cjs'), 'a');
    fs.writeFileSync(path.join(dir, 'frontend', 'package.json'), '{"name":"x"}');
    return dir;
  };
  const stored = (files: Record<string, string>) => ({ files: Object.entries(files).map(([p, content]) => ({ path: p, content })) }) as any;

  it('names config, package.json, lockfile and .npmrc changes', () => {
    expect(trustFileChanges(root(), stored({
      'frontend/postcss.config.cjs': 'b',
      'frontend/package.json': '{"name":"y"}',
      'frontend/package-lock.json': '{}',
      'frontend/.npmrc': 'registry=x',
      'frontend/.tooljet/config.json': '{"recordRender":true}',
      'frontend/tailwind.config.ts': 'c',
    }))).to.have.members([
      'frontend/postcss.config.cjs', 'frontend/package.json', 'frontend/package-lock.json', 'frontend/.npmrc',
      'frontend/.tooljet/config.json', 'frontend/tailwind.config.ts',
    ]);
  });

  it('lets source changes and unchanged config through', () => {
    expect(trustFileChanges(root(), stored({
      'frontend/postcss.config.cjs': 'a',
      'frontend/package.json': '{"name":"x"}',
      'frontend/src/App/index.tsx': 'changed',
    }))).to.deep.equal([]);
  });
});
