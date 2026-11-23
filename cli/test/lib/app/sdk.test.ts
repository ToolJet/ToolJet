import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import nock = require('nock');

import { collectSource } from '../../../src/lib/library/source-tree';
import { scaffoldApp } from '../../../src/lib/app/scaffold';
import {
  installCodeModeSdk,
  lockWithPublishedSdk,
  manifestWithPublishedSdk,
  prepareDependencies,
  publishedSdk,
  repairSdk,
  SDK_PACKAGE,
  SDK_TYPES_FILE,
  sdkTarballUrl,
} from '../../../src/lib/app/sdk';
import { applyStoredSource, collectProjectSource } from '../../../src/lib/app/source-upload';
import { hashProjectSource } from '../../../src/lib/app/source-sync';

/*
  The ToolJet image's SDK path, /app/code-mode/custom-component-sdk, in a stored project: a teammate's clone had no SDK
  (TS2307) and `tooljet app dev` would not upload. It must not leave a machine, and is repaired where it arrives.
*/

const SERVER_PATH = 'file:/app/code-mode/custom-component-sdk';
const LOCK_KEY = `node_modules/${SDK_PACKAGE}`;

const leaky = (frontend: string, spec = SERVER_PATH) => {
  const manifestFile = path.join(frontend, 'package.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  manifest.dependencies[SDK_PACKAGE] = spec;
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  const target = '../../../../app/code-mode/custom-component-sdk';
  fs.writeFileSync(
    path.join(frontend, 'package-lock.json'),
    JSON.stringify(
      {
        name: 'x',
        lockfileVersion: 3,
        packages: {
          '': { name: 'x', dependencies: { [SDK_PACKAGE]: spec, react: '^18.0.0' } },
          [target]: { name: SDK_PACKAGE, version: '0.1.0-beta.3' },
          [`${target}/node_modules/typescript`]: { version: '5.0.0' },
          [LOCK_KEY]: { resolved: target, link: true },
          'node_modules/react': { version: '18.3.1' },
        },
      },
      null,
      2
    ) + '\n'
  );
};

const read = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'));

describe('the custom component SDK in an app project', () => {
  let root: string;
  let frontend: string;
  const savedSpec = process.env.TOOLJET_SDK_SPEC;
  beforeEach(() => {
    delete process.env.TOOLJET_SDK_SPEC;
    root = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tj-sdk-')), 'talent-pipeline');
    scaffoldApp(root, 'Talent Pipeline');
    frontend = path.join(root, 'frontend');
  });
  afterEach(() => {
    fs.rmSync(path.dirname(root), { recursive: true, force: true });
    if (savedSpec === undefined) delete process.env.TOOLJET_SDK_SPEC;
    else process.env.TOOLJET_SDK_SPEC = savedSpec;
  });

  const assertPublished = (manifest: any, lock: any) => {
    const { version, entry } = publishedSdk();
    expect(manifest.dependencies[SDK_PACKAGE]).to.equal(version);
    expect(lock.packages[''].dependencies[SDK_PACKAGE]).to.equal(version);
    expect(lock.packages[LOCK_KEY]).to.deep.equal(entry);
    expect(JSON.stringify(lock)).not.to.include('code-mode/custom-component-sdk');
  };

  it('the published version is the one the template pins', () => {
    expect(read(path.join(frontend, 'package.json')).dependencies[SDK_PACKAGE]).to.equal(publishedSdk().version);
    expect(publishedSdk().entry.resolved).to.match(/^https:\/\/registry\.npmjs\.org\//);
  });

  it('leaves a project that names the published version exactly as it is', () => {
    const manifest = fs.readFileSync(path.join(frontend, 'package.json'), 'utf8');
    const lock = fs.readFileSync(path.join(frontend, 'package-lock.json'), 'utf8');
    expect(manifestWithPublishedSdk(manifest)).to.equal(manifest);
    expect(lockWithPublishedSdk(lock)).to.equal(lock);
    expect(repairSdk(frontend)).to.equal(false);
  });

  describe('what leaves the machine', () => {
    it('an upload stores the published version, whatever this checkout uses', () => {
      const sdk = path.join(path.dirname(root), 'sdk');
      fs.mkdirSync(sdk);
      leaky(frontend, `file:${sdk}`);
      const files = collectProjectSource(root);
      const content = (rel: string) => JSON.parse(files.find((f) => f.path === rel)?.content as string);
      assertPublished(content('frontend/package.json'), {
        packages: { ...content('frontend/package-lock.json').packages },
      });
      // The checkout itself keeps its path, and hashes as what it would store.
      expect(read(path.join(frontend, 'package.json')).dependencies[SDK_PACKAGE]).to.equal(`file:${sdk}`);
      const before = hashProjectSource(root);
      repairSdk(frontend);
      expect(hashProjectSource(root)).to.equal(before);
    });

    it("a build's manifest does too", () => {
      leaky(frontend);
      const { files } = collectSource(frontend, []);
      expect(JSON.parse(files['package.json']).dependencies[SDK_PACKAGE]).to.equal(publishedSdk().version);
    });
  });

  describe('repair', () => {
    it('a path that does not exist here becomes the published version, with a clean lockfile entry', () => {
      leaky(frontend);
      expect(repairSdk(frontend)).to.equal(true);
      const lock = read(path.join(frontend, 'package-lock.json'));
      assertPublished(read(path.join(frontend, 'package.json')), lock);
      expect(lock.packages['node_modules/react']).to.deep.equal({ version: '18.3.1' });
      expect(repairSdk(frontend)).to.equal(false);
    });

    it('a path that exists here stays', () => {
      const sdk = path.join(path.dirname(root), 'sdk');
      fs.mkdirSync(sdk);
      leaky(frontend, `file:${sdk}`);
      expect(repairSdk(frontend)).to.equal(false);
      expect(read(path.join(frontend, 'package.json')).dependencies[SDK_PACKAGE]).to.equal(`file:${sdk}`);
    });

    it('stored code with the path is repaired as it is written (clone, source-pull)', () => {
      const manifest = { name: 'x', dependencies: { [SDK_PACKAGE]: SERVER_PATH } };
      applyStoredSource(root, {
        exists: true,
        revision: 3,
        owner: 'platform',
        files: [{ path: 'frontend/package.json', content: JSON.stringify(manifest) }],
      });
      expect(read(path.join(frontend, 'package.json')).dependencies[SDK_PACKAGE]).to.equal(publishedSdk().version);
    });
  });

  describe('the SDK with the app types', () => {
    const origin = 'https://tooljet.test';
    const serves = (status = 200, type = 'application/gzip') =>
      nock(origin).head('/api/code-mode/cli/custom-component-sdk.tgz').reply(status, '', { 'content-type': type });
    const calls: string[][] = [];
    /** Stands in for npm: records the arguments; a run with a spec lays down an SDK with the types. */
    const run = (_command: string, args: string[], options: { cwd: string }) => {
      calls.push(args);
      const file = path.join(options.cwd, SDK_TYPES_FILE);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, args.includes('--no-save') ? 'useNavigation' : 'npm published, older');
      return { status: 0 };
    };

    beforeEach(() => {
      calls.length = 0;
    });

    it('a fresh clone with the path: repaired, installed, then given the SDK this ToolJet serves, unsaved', async () => {
      leaky(frontend);
      serves();
      const { success, warnings } = await prepareDependencies(frontend, { server: origin, run });
      expect(calls[0]).to.include('--ignore-scripts');
      expect(calls[0]).not.to.include('--no-save');
      expect(calls[1]).to.include.members(['--no-save', '--ignore-scripts', sdkTarballUrl(origin)]);
      expect(success.join('\n')).to.include('another machine');
      expect(warnings).to.deep.equal([]);
      assertPublished(read(path.join(frontend, 'package.json')), read(path.join(frontend, 'package-lock.json')));
    });

    it('does nothing once the SDK has the types', async () => {
      serves();
      await prepareDependencies(frontend, { server: origin, run });
      // What npm records after installing exactly the lockfile.
      fs.writeFileSync(path.join(frontend, 'node_modules', '.package-lock.json'), JSON.stringify(read(path.join(frontend, 'package-lock.json'))));
      calls.length = 0;
      expect(await prepareDependencies(frontend, { server: origin, run })).to.deep.equal({ success: [], warnings: [] });
      expect(calls).to.deep.equal([]);
    });

    it('TOOLJET_SDK_SPEC wins over the server, and is not written to the project', async () => {
      process.env.TOOLJET_SDK_SPEC = 'file:/app/code-mode/custom-component-sdk';
      expect(await installCodeModeSdk(frontend, { server: origin, run })).to.equal('installed');
      expect(calls[0]).to.include('file:/app/code-mode/custom-component-sdk');
      expect(read(path.join(frontend, 'package.json')).dependencies[SDK_PACKAGE]).to.equal(publishedSdk().version);
    });

    describe('in server mode, where a build reads only the project', () => {
      const savedMode = process.env.TOOLJET_CLI_SERVER_MODE;
      let sdkFolder: string;
      beforeEach(() => {
        process.env.TOOLJET_CLI_SERVER_MODE = '1';
        sdkFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-sdk-folder-'));
        fs.mkdirSync(path.join(sdkFolder, 'dist'), { recursive: true });
        fs.writeFileSync(path.join(sdkFolder, 'dist', 'types.d.ts'), 'useNavigation');
        process.env.TOOLJET_SDK_SPEC = `file:${sdkFolder}`;
      });
      afterEach(() => {
        if (savedMode === undefined) delete process.env.TOOLJET_CLI_SERVER_MODE;
        else process.env.TOOLJET_CLI_SERVER_MODE = savedMode;
        fs.rmSync(sdkFolder, { recursive: true, force: true });
      });
      const sdkDir = () => path.join(frontend, 'node_modules', SDK_PACKAGE);
      const link = () => {
        fs.mkdirSync(path.dirname(sdkDir()), { recursive: true });
        fs.symlinkSync(sdkFolder, sdkDir(), 'dir');
      };
      /** npm with --install-links: the link goes, a copy takes its place. */
      const copying: typeof run = (command, args, options) => {
        fs.rmSync(sdkDir(), { recursive: true, force: true });
        return run(command, args, options);
      };

      it('copies a file: SDK into node_modules instead of linking it', async () => {
        expect(await installCodeModeSdk(frontend, { run: copying })).to.equal('installed');
        expect(calls[0]).to.include.members(['--install-links', `file:${sdkFolder}`]);
      });

      it('replaces a linked SDK that has the types (TS2307 on every ToolJet import, 2026-11-04)', async () => {
        link();
        expect(await installCodeModeSdk(frontend, { run: copying })).to.equal('installed');
        expect(calls[0]).to.include('--install-links');
        expect(await installCodeModeSdk(frontend, { run: copying })).to.equal('current');
      });

      it('leaves a linked SDK alone in a local build, which may read it', async () => {
        delete process.env.TOOLJET_CLI_SERVER_MODE;
        link();
        expect(await installCodeModeSdk(frontend, { run: copying })).to.equal('current');
        expect(calls).to.deep.equal([]);
      });
    });

    it('warns, naming the server, when it offers none: a 404, or a dev frontend answering HTML', async () => {
      for (const [status, type] of [
        [404, 'application/json'],
        [200, 'text/html'],
      ] as const) {
        serves(status, type);
        calls.length = 0;
        const { warnings } = await prepareDependencies(frontend, { server: origin, run });
        expect(warnings.join('\n')).to.include(origin);
        expect(calls.filter((args) => args.includes('--no-save'))).to.deep.equal([]);
        fs.rmSync(path.join(frontend, 'node_modules'), { recursive: true, force: true });
      }
    });

    it('does not touch a pnpm or yarn project', async () => {
      fs.renameSync(path.join(frontend, 'package-lock.json'), path.join(frontend, 'pnpm-lock.yaml'));
      expect(await installCodeModeSdk(frontend, { server: origin, run })).to.equal('unavailable');
      expect(calls).to.deep.equal([]);
    });
  });
});
