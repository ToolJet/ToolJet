import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import { scaffoldTemplate, writeLibraryConfig } from '../../src/lib/library/scaffolder';
import { build } from '../../src/lib/library/builder';
import { ProjectConfig } from '../../src/lib/library/project-config';
import { withTempCwd } from '../helpers/fixtures';

// Every other test stubs scaffoldTemplate to avoid invoking Hygen, so these are the
// only tests that exercise the shipped templates in src/_templates/library/new/ —
// they run Hygen for real and then feed the result into the real build pipeline.
describe('scaffoldTemplate (real Hygen run)', () => {
  const cwd = withTempCwd();

  it('writes every file the template declares', async () => {
    await scaffoldTemplate('my-lib', 'My Library');

    const projectRoot = path.join(cwd.get(), 'my-lib');
    for (const relPath of [
      '.gitignore',
      'package.json',
      'tsconfig.json',
      'src/index.ts',
      'src/global.d.ts',
      'src/components/HelloWorld/index.tsx',
    ]) {
      expect(fs.existsSync(path.join(projectRoot, relPath)), `${relPath} should exist`).to.be.true;
    }
  }).timeout(60000);

  it('names package.json after the directory and wires up the lib: scripts', async () => {
    await scaffoldTemplate('my-lib', 'My Library');

    const projectRoot = path.join(cwd.get(), 'my-lib');
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));

    expect(pkg.name).to.equal('my-lib');
    expect(pkg.dependencies).to.have.property('@tooljet/custom-component-sdk');
    expect(pkg.scripts).to.include.keys('lib:dev', 'lib:build', 'lib:publish');
  }).timeout(60000);

  it('builds end-to-end: a freshly scaffolded project produces a bundle and a HelloWorld manifest', async () => {
    await scaffoldTemplate('my-lib', 'My Library');
    writeLibraryConfig('my-lib', { libraryName: 'My Library', correlationId: 'corr-1' });

    const projectRoot = path.join(cwd.get(), 'my-lib');
    const result = await build(projectRoot, { env: 'production' });

    expect(result.componentCount).to.equal(1);
    expect(fs.existsSync(path.join(projectRoot, 'dist', 'index.js'))).to.be.true;

    const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'dist', 'manifest.json'), 'utf8'));
    expect(manifest.components.HelloWorld).to.deep.include({
      displayName: 'Hello World',
      defaultWidth: 7,
      defaultHeight: 11,
    });
    expect(manifest.components.HelloWorld.props).to.deep.equal([
      { name: 'firstName', type: 'string', default: 'John', label: 'First Name' },
    ]);
    expect(manifest.components.HelloWorld.actions).to.deep.equal([{ name: 'reset', displayName: 'Reset' }]);

    // tsErrors isn't asserted: the scaffolded project declares react/@types/react
    // as devDependencies, and nothing is npm-installed into this temp dir, so the
    // type checker can't resolve them. esbuild still bundles fine — `react` is
    // marked external and the SDK import is replaced by builder.ts's plugin.
    expect(ProjectConfig.readFile(projectRoot)).to.deep.equal({
      libraryName: 'My Library',
      correlationId: 'corr-1',
    });
  }).timeout(120000);
});
