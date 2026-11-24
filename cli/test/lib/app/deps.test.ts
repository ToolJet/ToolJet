import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { detectPackageManager, installCommand, installDependencies, LockfileMissingError, requireLockfile } from '../../../src/lib/app/deps';
import { scaffoldApp } from '../../../src/lib/app/scaffold';

describe('dependency installs never run install scripts', () => {
  let dir: string;
  beforeEach(() => (dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-deps-'))));
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('turns scripts off for every package manager', () => {
    for (const pm of ['npm', 'pnpm', 'yarn'] as const) {
      for (const frozen of [false, true]) {
        const cmd = installCommand(pm, frozen);
        expect(cmd.args, `${pm} frozen=${frozen}`).to.include('--ignore-scripts');
        expect(cmd.env.npm_config_ignore_scripts).to.equal('true');
      }
    }
    const berry = installCommand('yarn-berry', true);
    expect(berry.env.YARN_ENABLE_SCRIPTS).to.equal('false');
    expect(berry.args).to.include('--immutable');
  });

  it('installs exactly the lockfile when frozen', () => {
    expect(installCommand('npm', true).args.slice(0, 2)).to.deep.equal(['ci', '--ignore-scripts']);
    expect(installCommand('pnpm', true).args).to.include('--frozen-lockfile');
    expect(installCommand('yarn', true).args).to.include('--frozen-lockfile');
  });

  it('picks the package manager from the lockfile', () => {
    expect(detectPackageManager(dir)).to.equal('npm');
    fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), '');
    expect(detectPackageManager(dir)).to.equal('pnpm');
    fs.rmSync(path.join(dir, 'pnpm-lock.yaml'));
    fs.writeFileSync(path.join(dir, 'yarn.lock'), '');
    expect(detectPackageManager(dir)).to.equal('yarn');
    fs.writeFileSync(path.join(dir, '.yarnrc.yml'), '');
    expect(detectPackageManager(dir)).to.equal('yarn-berry');
  });

  it('publish refuses a project without a lockfile, with a message that says what to do', () => {
    expect(() => requireLockfile(dir)).to.throw(LockfileMissingError, /tooljet app install/);
    fs.writeFileSync(path.join(dir, 'package-lock.json'), '{}');
    expect(requireLockfile(dir)).to.equal('package-lock.json');
  });

  it('runs the install with scripts off and reports a failure', () => {
    const calls: { command: string; args: string[]; env: NodeJS.ProcessEnv }[] = [];
    const cmd = installDependencies(dir, { run: (command, args, o) => (calls.push({ command, args, env: o.env }), { status: 0 }) });
    expect(cmd.command).to.equal('npm');
    expect(calls[0].args).to.include('--ignore-scripts');
    expect(calls[0].env.npm_config_ignore_scripts).to.equal('true');
    // Dev dependencies install even when the caller runs under NODE_ENV=production.
    expect(calls[0].env.NODE_ENV).to.equal('development');
    expect(() => installDependencies(dir, { run: () => ({ status: 1 }) })).to.throw(/failed \(exit 1\)/);
  });

  it('new projects carry frontend/.npmrc with ignore-scripts, so a plain npm install skips them too', () => {
    const project = path.join(dir, 'app');
    scaffoldApp(project, 'App');
    expect(fs.readFileSync(path.join(project, 'frontend', '.npmrc'), 'utf8')).to.contain('ignore-scripts=true');
    expect(fs.existsSync(path.join(project, 'frontend', 'npmrc'))).to.equal(false);
  });
  it('new projects start with the vetted template lockfile, named for the project and matching its package.json', () => {
    const project = path.join(dir, 'gear-log');
    scaffoldApp(project, 'Gear log');
    const pkg = JSON.parse(fs.readFileSync(path.join(project, 'frontend', 'package.json'), 'utf8'));
    const lock = JSON.parse(fs.readFileSync(path.join(project, 'frontend', 'package-lock.json'), 'utf8'));
    expect(lock.name).to.equal('gear-log');
    expect(lock.packages[''].name).to.equal('gear-log');
    // Regenerate with scripts/pin-template-deps.mjs whenever the template's dependencies change.
    expect(lock.packages[''].dependencies).to.deep.equal(pkg.dependencies);
    expect(lock.packages[''].devDependencies).to.deep.equal(pkg.devDependencies);
    expect(requireLockfile(path.join(project, 'frontend'))).to.equal('package-lock.json');
  });
});
