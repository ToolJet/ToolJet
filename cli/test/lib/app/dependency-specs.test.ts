import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { installDependencies } from '../../../src/lib/app/deps';
import {
  allowedRegistries,
  assertRegistryOnly,
  linksOutOfProject,
  lockfileProblems,
  NonRegistryDependencyError,
  specProblem,
} from '../../../src/lib/app/dependency-specs';
import { scaffoldApp } from '../../../src/lib/app/scaffold';
import { SERVER_MODE_ENV } from '../../../src/lib/server-mode';

const NPM = 'https://registry.npmjs.org/';
const manifest = (deps: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  path: 'frontend/package.json',
  content: JSON.stringify({ name: 'app', dependencies: deps, ...extra }),
});

describe('registry-only dependencies', () => {
  let dir: string;
  let saved: string | undefined;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-dep-specs-'));
    saved = process.env[SERVER_MODE_ENV];
  });
  afterEach(() => {
    if (saved === undefined) delete process.env[SERVER_MODE_ENV];
    else process.env[SERVER_MODE_ENV] = saved;
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('accepts versions, ranges and tags, and refuses every other kind of spec', () => {
    for (const spec of ['1.2.3', '^4', '>=1 <2', '1.x || 2.x', 'latest', ''])
      expect(specProblem(spec), spec).to.equal(undefined);
    for (const spec of [
      'file:/',
      'link:../x',
      '../x',
      'a/b',
      'github:a/b',
      'git+https://h/a.git',
      'https://h/x.tgz',
      'workspace:*',
      'npm:x@1',
    ])
      expect(specProblem(spec), spec).to.be.a('string');
  });

  it('refuses a manifest or lockfile that names a folder, a link, git or another host', () => {
    expect(() => assertRegistryOnly([manifest({ x: 'file:/' })], null)).to.throw(
      NonRegistryDependencyError,
      /"x" in dependencies/
    );
    expect(() => assertRegistryOnly([manifest({}, { workspaces: ['..'] })], null)).to.throw(/workspaces/);
    const lock = (packages: Record<string, unknown>) => ({ lockfileVersion: 3, packages: { '': {}, ...packages } });
    expect(lockfileProblems(lock({ 'node_modules/x': { link: true, resolved: '../..' } }), null)).to.have.length(1);
    expect(lockfileProblems(lock({ 'node_modules/y': { resolved: 'git+ssh://git@h/a.git#1' } }), null)).to.have.length(
      1
    );
    // Without registries (an upload) only non-http addresses are refused; with them, the host must match.
    expect(lockfileProblems(lock({ 'node_modules/z': { resolved: 'http://127.0.0.1:9/z.tgz' } }), null)).to.deep.equal(
      []
    );
    expect(
      lockfileProblems(lock({ 'node_modules/z': { resolved: 'http://127.0.0.1:9/z.tgz' } }), [NPM])
    ).to.have.length(1);
    expect(lockfileProblems(lock({ 'node_modules/r': { resolved: `${NPM}r/-/r-1.tgz` } }), [NPM])).to.deep.equal([]);
    expect(allowedRegistries({ npm_config_registry: 'http://localhost:4873' })).to.include('http://localhost:4873/');
  });

  it('passes the app template in server mode', () => {
    const project = path.join(dir, 'app');
    scaffoldApp(project, 'App');
    process.env[SERVER_MODE_ENV] = '1';
    let ran = false;
    installDependencies(path.join(project, 'frontend'), { run: () => ((ran = true), { status: 0 }) });
    expect(ran).to.equal(true);
  });

  it('in server mode, refuses to install a file: dependency and never starts npm', () => {
    const frontend = path.join(dir, 'frontend');
    fs.mkdirSync(frontend);
    fs.writeFileSync(path.join(frontend, 'package.json'), JSON.stringify({ dependencies: { x: 'file:/' } }));
    process.env[SERVER_MODE_ENV] = '1';
    let ran = false;
    expect(() => installDependencies(frontend, { run: () => ((ran = true), { status: 0 }) })).to.throw(
      NonRegistryDependencyError
    );
    expect(ran).to.equal(false);
    // Outside server mode a developer's own machine is theirs to install on.
    delete process.env[SERVER_MODE_ENV];
    installDependencies(frontend, { run: () => ((ran = true), { status: 0 }) });
    expect(ran).to.equal(true);
  });

  it('in server mode, removes node_modules when the install linked a folder outside the project', () => {
    const frontend = path.join(dir, 'frontend');
    fs.mkdirSync(frontend);
    fs.writeFileSync(path.join(frontend, 'package.json'), JSON.stringify({ dependencies: {} }));
    process.env[SERVER_MODE_ENV] = '1';
    const linkOut = () => {
      fs.mkdirSync(path.join(frontend, 'node_modules', '@s', 'inner', 'node_modules'), { recursive: true });
      fs.mkdirSync(path.join(frontend, 'node_modules', '.bin'), { recursive: true });
      fs.symlinkSync(
        path.join(frontend, 'node_modules', '@s', 'inner'),
        path.join(frontend, 'node_modules', '.bin', 'ok')
      );
      fs.symlinkSync(os.tmpdir(), path.join(frontend, 'node_modules', '@s', 'inner', 'node_modules', 'out'));
      return { status: 0 };
    };
    expect(() => installDependencies(frontend, { run: linkOut })).to.throw(/outside the project/);
    expect(fs.existsSync(path.join(frontend, 'node_modules'))).to.equal(false);
  });

  it('finds only links that leave the project', () => {
    fs.mkdirSync(path.join(dir, 'node_modules', 'a'), { recursive: true });
    fs.symlinkSync(path.join(dir, 'node_modules', 'a'), path.join(dir, 'node_modules', 'b'));
    expect(linksOutOfProject(dir)).to.deep.equal([]);
    fs.symlinkSync('/', path.join(dir, 'node_modules', 'root'));
    expect(linksOutOfProject(dir)).to.deep.equal([path.join('node_modules', 'root')]);
  });
});
