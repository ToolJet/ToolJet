import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { build } from '../../src/lib/library/builder';
import { collectSource } from '../../src/lib/library/source-tree';

/* A build reads the project and its installed packages, nothing else on this machine. */
const SECRET = 'host-secret-7f3a';

const layout = () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-confine-'));
  const root = path.join(base, 'project');
  const outside = path.join(base, 'elsewhere');
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.mkdirSync(outside, { recursive: true });
  fs.writeFileSync(
    path.join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'esnext',
        module: 'esnext',
        moduleResolution: 'node',
        resolveJsonModule: true,
        jsx: 'react-jsx',
        skipLibCheck: true,
        types: [],
        noEmit: true,
      },
      include: ['src/**/*'],
    })
  );
  fs.writeFileSync(path.join(outside, 'secret.json'), JSON.stringify({ value: SECRET }));
  fs.writeFileSync(path.join(outside, 'secret.css'), `.leak::after { content: "${SECRET}"; }\n`);
  fs.writeFileSync(path.join(outside, 'helper.ts'), `export const leaked = '${SECRET}';\n`);
  return { base, root, outside };
};

const entry = (root: string, code: string) => fs.writeFileSync(path.join(root, 'src', 'index.ts'), code);

const buildError = async (root: string): Promise<string> => {
  try {
    await build(root);
  } catch (err) {
    return (err as Error).message;
  }
  throw new Error('the build was expected to refuse');
};

const bundled = (root: string) => fs.readFileSync(path.join(root, 'dist', 'index.js'), 'utf8');

for (const mode of ['local', 'server'] as const) {
  describe(`build confinement (${mode})`, () => {
    let saved: string | undefined;
    let dirs: { base: string; root: string; outside: string };
    beforeEach(() => {
      saved = process.env.TOOLJET_CLI_SERVER_MODE;
      if (mode === 'server') process.env.TOOLJET_CLI_SERVER_MODE = '1';
      else delete process.env.TOOLJET_CLI_SERVER_MODE;
      dirs = layout();
    });
    afterEach(() => {
      if (saved === undefined) delete process.env.TOOLJET_CLI_SERVER_MODE;
      else process.env.TOOLJET_CLI_SERVER_MODE = saved;
      fs.rmSync(dirs.base, { recursive: true, force: true });
    });

    it('builds project-local imports, JSON and installed packages', async () => {
      fs.writeFileSync(path.join(dirs.root, 'src', 'data.json'), JSON.stringify({ label: 'own-data' }));
      fs.writeFileSync(path.join(dirs.root, 'src', 'helper.ts'), "export const helper = 'own-helper';\n");
      fs.mkdirSync(path.join(dirs.root, 'node_modules', 'tiny-pkg'), { recursive: true });
      fs.writeFileSync(
        path.join(dirs.root, 'node_modules', 'tiny-pkg', 'package.json'),
        JSON.stringify({ name: 'tiny-pkg', main: 'index.js' })
      );
      fs.writeFileSync(path.join(dirs.root, 'node_modules', 'tiny-pkg', 'index.js'), "exports.tiny = 'own-package';\n");
      entry(
        dirs.root,
        "import data from './data.json';\nimport { helper } from './helper';\n// @ts-ignore\nimport { tiny } from 'tiny-pkg';\nexport const all = [data.label, helper, tiny];\n"
      );

      await build(dirs.root);

      expect(bundled(dirs.root)).to.include('own-data').and.include('own-helper').and.include('own-package');
    }).timeout(60_000);

    it('refuses a parent-relative import that leaves the project', async () => {
      entry(dirs.root, "// @ts-ignore\nimport secret from '../../elsewhere/secret.json';\nexport const s = secret;\n");

      expect(await buildError(dirs.root))
        .to.include('outside the project')
        .and.not.include(SECRET);
      expect(fs.existsSync(path.join(dirs.root, 'dist', 'index.js'))).to.equal(false);
    }).timeout(60_000);

    it('refuses an absolute import', async () => {
      const target = path.join(dirs.outside, 'helper.ts');
      entry(dirs.root, `// @ts-ignore\nimport { leaked } from ${JSON.stringify(target)};\nexport const s = leaked;\n`);

      expect(await buildError(dirs.root))
        .to.include('outside the project')
        .and.not.include(SECRET);
    }).timeout(60_000);

    it('refuses a symlink in the project that points outside it', async () => {
      fs.symlinkSync(path.join(dirs.outside, 'secret.json'), path.join(dirs.root, 'src', 'linked.json'));
      entry(dirs.root, "import linked from './linked.json';\nexport const s = linked;\n");

      expect(await buildError(dirs.root))
        .to.include('outside the project')
        .and.not.include(SECRET);
    }).timeout(60_000);

    it('refuses a CSS @import outside the project', async () => {
      fs.writeFileSync(path.join(dirs.root, 'src', 'main.css'), '@import "../../elsewhere/secret.css";\n');
      entry(dirs.root, "import './main.css';\nexport const a = 1;\n");

      expect(await buildError(dirs.root))
        .to.include('outside the project')
        .and.not.include(SECRET);
    }).timeout(60_000);

    it('refuses a CSS url() asset outside the project', async () => {
      fs.writeFileSync(
        path.join(dirs.outside, 'mark.svg'),
        `<svg xmlns="http://www.w3.org/2000/svg"><title>${SECRET}</title></svg>`
      );
      fs.writeFileSync(
        path.join(dirs.root, 'src', 'main.css'),
        '.mark { background: url("../../elsewhere/mark.svg"); }\n'
      );
      entry(dirs.root, "import './main.css';\nexport const a = 1;\n");

      expect(await buildError(dirs.root))
        .to.include('outside the project')
        .and.not.include(SECRET);
    }).timeout(60_000);

    it('refuses a tsconfig path mapping that points outside the project', async () => {
      const tsconfig = JSON.parse(fs.readFileSync(path.join(dirs.root, 'tsconfig.json'), 'utf8'));
      tsconfig.compilerOptions.baseUrl = '.';
      tsconfig.compilerOptions.paths = { 'host-file': [path.join(dirs.outside, 'secret.json')] };
      fs.writeFileSync(path.join(dirs.root, 'tsconfig.json'), JSON.stringify(tsconfig));
      entry(dirs.root, "// @ts-ignore\nimport secret from 'host-file';\nexport const s = secret;\n");

      expect(await buildError(dirs.root))
        .to.include('outside the project')
        .and.not.include(SECRET);
    }).timeout(60_000);

    it('refuses a tsconfig that includes or extends files outside the project', async () => {
      entry(dirs.root, 'export const a = 1;\n');
      const tsconfig = JSON.parse(fs.readFileSync(path.join(dirs.root, 'tsconfig.json'), 'utf8'));
      fs.writeFileSync(
        path.join(dirs.root, 'tsconfig.json'),
        JSON.stringify({ ...tsconfig, include: ['src/**/*', '../elsewhere/**/*'] })
      );
      expect(await buildError(dirs.root))
        .to.include('Refused tsconfig.json')
        .and.not.include(SECRET);

      fs.writeFileSync(path.join(dirs.outside, 'base.json'), JSON.stringify({ compilerOptions: { strict: true } }));
      fs.writeFileSync(
        path.join(dirs.root, 'tsconfig.json'),
        JSON.stringify({ ...tsconfig, extends: '../elsewhere/base.json' })
      );
      expect(await buildError(dirs.root)).to.include('Refused tsconfig.json');
    }).timeout(60_000);

    it('leaves a symlinked file outside the project out of the manifest source', () => {
      fs.writeFileSync(path.join(dirs.root, 'src', 'index.ts'), 'export const a = 1;\n');
      fs.symlinkSync(path.join(dirs.outside, 'helper.ts'), path.join(dirs.root, 'src', 'linked.ts'));

      const source = collectSource(dirs.root, []);

      expect(Object.keys(source.files)).to.include('src/index.ts').and.not.include('src/linked.ts');
      expect(JSON.stringify(source.files)).to.not.include(SECRET);
    });
  });
}

describe('build confinement and linked packages', () => {
  let saved: string | undefined;
  let dirs: { base: string; root: string; outside: string };
  beforeEach(() => {
    saved = process.env.TOOLJET_CLI_SERVER_MODE;
    dirs = layout();
    const pkg = path.join(dirs.outside, 'linked-pkg');
    fs.mkdirSync(pkg, { recursive: true });
    fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ name: 'linked-pkg', main: 'index.js' }));
    fs.writeFileSync(path.join(pkg, 'index.js'), "exports.value = require('./inner').inner;\n");
    fs.writeFileSync(path.join(pkg, 'inner.js'), "exports.inner = 'linked-package';\n");
    fs.mkdirSync(path.join(dirs.root, 'node_modules'), { recursive: true });
    fs.symlinkSync(pkg, path.join(dirs.root, 'node_modules', 'linked-pkg'), 'dir');
    entry(dirs.root, "// @ts-ignore\nimport { value } from 'linked-pkg';\nexport const v = value;\n");
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.TOOLJET_CLI_SERVER_MODE;
    else process.env.TOOLJET_CLI_SERVER_MODE = saved;
    fs.rmSync(dirs.base, { recursive: true, force: true });
  });

  it('follows a package the developer linked into node_modules in a local build', async () => {
    delete process.env.TOOLJET_CLI_SERVER_MODE;

    await build(dirs.root);

    expect(bundled(dirs.root)).to.include('linked-package');
  }).timeout(60_000);

  it('refuses a linked package that resolves outside the project in server mode', async () => {
    process.env.TOOLJET_CLI_SERVER_MODE = '1';

    expect(await buildError(dirs.root)).to.include('outside the project');
  }).timeout(60_000);
});
