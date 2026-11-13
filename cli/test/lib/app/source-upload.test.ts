import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
  applyStoredSource,
  baseRevisionFor,
  inStepWith,
  collectProjectSource,
  readSourceState,
  storeSource,
  uploadSource,
  writeSourceState,
} from '../../../src/lib/app/source-upload';
import { codeSavedLine } from '../../../src/lib/app/source-flags';

describe('tooljet app --source', () => {
  let root: string;
  const write = (rel: string, content = 'x') => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content);
  };
  beforeEach(() => (root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-source-'))));
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it('collects the project files the server stores, and nothing else', () => {
    for (const rel of [
      'app.json',
      'frontend/package.json',
      'frontend/package-lock.json',
      'frontend/tailwind.config.cjs',
      'frontend/.tooljet/config.json',
      'frontend/src/index.ts',
      'frontend/src/App/index.tsx',
      'frontend/styles/theme.css',
      // not sent:
      'frontend/node_modules/react/index.js',
      'frontend/dist/index.js',
      'frontend/src/logo.png',
      'frontend/src/.DS_Store',
      '.tooljet/snapshot.json',
      'frontend/.env',
    ])
      write(rel);
    expect(collectProjectSource(root).map((f) => f.path).sort()).to.deep.equal([
      'app.json',
      'frontend/.tooljet/config.json',
      'frontend/package-lock.json',
      'frontend/package.json',
      'frontend/src/App/index.tsx',
      'frontend/src/index.ts',
      'frontend/styles/theme.css',
      'frontend/tailwind.config.cjs',
    ]);
  });

  it('imports into the app version with the owner, through the session', async () => {
    write('app.json', '{"name":"A"}');
    const calls: { path: string; init: any }[] = [];
    const session: any = {
      api: async (p: string, init: any) => {
        calls.push({ path: p, init });
        return { revision: 1, owner: 'repository', files: init.body.files };
      },
    };
    const result = await uploadSource(session, { appId: 'app-1', versionId: 'v-1', root }, { owner: 'repository' });
    expect(calls[0].path).to.equal('/code-mode-source/app-1/versions/v-1/import');
    expect(calls[0].init.method).to.equal('POST');
    expect(calls[0].init.body).to.deep.equal({
      files: [{ path: 'app.json', content: '{"name":"A"}' }],
      owner: 'repository',
      replace: false,
    });
    expect(result.files).to.have.length(1);
  });
  it('sends the revision the project was last in step with', async () => {
    write('app.json', '{}');
    let body: any;
    const session: any = { api: async (_path: string, init: any) => ((body = init.body), { revision: 4, owner: 'platform', files: [] }) };
    await uploadSource(session, { appId: 'a', versionId: 'v', root }, { owner: 'platform', baseRevision: 3 });
    expect(body.baseRevision).to.equal(3);
    await uploadSource(session, { appId: 'a', versionId: 'v', root }, { owner: 'platform' });
    expect(body).to.not.have.property('baseRevision');
  });

  it('remembers the synced revision in .tooljet/source.json', () => {
    expect(readSourceState(root)).to.equal(undefined);
    writeSourceState(root, { revision: 2, owner: 'platform' });
    expect(readSourceState(root)).to.deep.equal({ revision: 2, owner: 'platform' });
  });

  it('brings editor edits down: writes stored files, removes deleted ones, keeps the rest of the project', () => {
    write('frontend/src/App/index.tsx', 'old');
    write('frontend/src/App/Gone.tsx', 'deleted in the editor');
    write('frontend/node_modules/x/index.js', 'kept');
    const result = applyStoredSource(root, {
      exists: true,
      revision: 5,
      owner: 'platform',
      files: [
        { path: 'frontend/src/App/index.tsx', content: 'new' },
        { path: 'frontend/src/App/New.tsx', content: 'added' },
        { path: '../outside.txt', content: 'never written' },
        { path: 'frontend/dist/index.js', content: 'not a project file' },
      ],
    });
    expect(result).to.deep.equal({ pulled: true, written: 2, removed: 1 });
    expect(fs.readFileSync(path.join(root, 'frontend/src/App/index.tsx'), 'utf8')).to.equal('new');
    expect(fs.existsSync(path.join(root, 'frontend/src/App/Gone.tsx'))).to.equal(false);
    expect(fs.existsSync(path.join(root, 'frontend/node_modules/x/index.js'))).to.equal(true);
    expect(fs.existsSync(path.join(root, '..', 'outside.txt'))).to.equal(false);
    expect(fs.existsSync(path.join(root, 'frontend/dist/index.js'))).to.equal(false);
    expect(readSourceState(root)).to.deep.equal({ revision: 5, owner: 'platform' });
  });
});

describe('codeSavedLine', () => {
  const stored = { revision: 4, owner: 'platform' as const, files: [{ path: 'a' }, { path: 'b' }] };
  it('says the code is saved, with revision and owner only when verbose', () => {
    expect(codeSavedLine(stored, false)).to.equal('Code saved in ToolJet (2 files)');
    expect(codeSavedLine(stored, true)).to.equal('Code saved in ToolJet (2 files, revision 4, owner platform)');
  });
  describe('storeSource (dev and publish --source)', () => {
    let root: string;
    const write = (rel: string, content = 'x') => {
      fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      fs.writeFileSync(path.join(root, rel), content);
    };
    beforeEach(() => (root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-store-source-'))));
    afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
    const where = { appId: 'a', versionId: 'v' };
    const fakeSession = (stored: any, onImport: (body: any) => any) =>
      ({
        api: async (p: string, init?: any) => (p.endsWith('/import') ? onImport(init.body) : stored),
      }) as any;

    it('sends the synced revision and records the new one', async () => {
      write('app.json', '{}');
      writeSourceState(root, { revision: 2, owner: 'platform' });
      let sent: any;
      const session = fakeSession({ exists: true, owner: 'platform', revision: 2 }, (body) => ((sent = body), { revision: 3, owner: 'platform', files: [] }));
      await storeSource(session, { ...where, root }, { owner: 'platform' });
      expect(sent.baseRevision).to.equal(2);
      // Recorded with its version: revision numbers restart in every new draft.
      expect(readSourceState(root)).to.deep.equal({ revision: 3, owner: 'platform', versionId: 'v' });
    });

    it('says when the dev build was made from these files, so Save version may freeze it', async () => {
      write('app.json', '{}');
      let sent: any;
      const session = fakeSession({ exists: false }, (body) => ((sent = body), { revision: 1, owner: 'platform', files: [] }));
      await storeSource(session, { ...where, root }, { owner: 'platform', builtBundle: true });
      expect(sent.builtBundle).to.equal(true);
      await storeSource(session, { ...where, root }, { owner: 'platform' });
      expect(sent).to.not.have.property('builtBundle');
    });

    it('passes on a conflict and keeps the recorded revision', async () => {
      write('app.json', '{}');
      writeSourceState(root, { revision: 2, owner: 'platform' });
      const session = fakeSession({ exists: true, owner: 'platform', revision: 4 }, () => {
        throw new Error('ToolJet holds edits made in the editor (revision 4)');
      });
      let error: Error | undefined;
      await storeSource(session, { ...where, root }, { owner: 'platform' }).catch((e) => (error = e));
      expect(error?.message).to.match(/revision 4/);
      expect(readSourceState(root)?.revision).to.equal(2);
    });

    it('will not take a repository-owned source over unless asked', async () => {
      write('app.json', '{}');
      let imported = false;
      const session = fakeSession({ exists: true, owner: 'repository', revision: 7 }, () => ((imported = true), { revision: 8, owner: 'platform', files: [] }));
      let error: Error | undefined;
      await storeSource(session, { ...where, root }, { owner: 'platform' }).catch((e) => (error = e));
      expect(error?.message).to.match(/owned by its repository/);
      expect(imported).to.equal(false);
      await storeSource(session, { ...where, root }, { owner: 'platform', replace: true });
      expect(imported).to.equal(true);
    });
  });

  describe("app.json's version is this checkout's, not the app's code", () => {
    let root: string;
    beforeEach(() => (root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-app-json-'))));
    afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
    const appJson = (extra: object = {}) => JSON.stringify({ name: 'Plants', appId: 'a', ...extra }, null, 2) + '\n';
    const readAppJson = () => JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));

    it('is never uploaded', () => {
      fs.writeFileSync(path.join(root, 'app.json'), appJson({ version: { id: 'v2', name: 'v2_1' } }));
      const stored = collectProjectSource(root).find((f) => f.path === 'app.json');
      expect(JSON.parse(stored!.content)).to.deep.equal({ name: 'Plants', appId: 'a' });
    });

    it('survives a pull, and a stored one never pins a project that follows the editing version', () => {
      const pull = (content: string) =>
        applyStoredSource(
          root,
          { exists: true, revision: 3, owner: 'platform', files: [{ path: 'app.json', content }] },
          'v2'
        );
      fs.writeFileSync(path.join(root, 'app.json'), appJson({ version: { id: 'v2', name: 'v2_1' } }));
      pull(appJson({ name: 'Plant tracker' }));
      expect(readAppJson()).to.deep.equal({ name: 'Plant tracker', appId: 'a', version: { id: 'v2', name: 'v2_1' } });
      fs.writeFileSync(path.join(root, 'app.json'), appJson());
      pull(appJson({ version: { id: 'old', name: 'v1' } }));
      expect(readAppJson()).to.deep.equal({ name: 'Plants', appId: 'a' });
    });
  });

  describe('a revision belongs to one version', () => {
    const stored = { exists: true, revision: 1, owner: 'platform' as const, contentHash: 'h-new' };

    it('is not in step with a new draft that happens to have the same revision number', () => {
      expect(inStepWith({ revision: 1, owner: 'platform', versionId: 'v1', contentHash: 'h-old' }, 'v2', stored)).to.equal(false);
    });

    it('is in step only with the same version, revision and code', () => {
      expect(inStepWith({ revision: 1, owner: 'platform', versionId: 'v2', contentHash: 'h-new' }, 'v2', stored)).to.equal(true);
      expect(inStepWith({ revision: 1, owner: 'platform', versionId: 'v2', contentHash: 'h-x' }, 'v2', stored)).to.equal(false);
      expect(inStepWith({ revision: 2, owner: 'platform', versionId: 'v2' }, 'v2', stored)).to.equal(false);
    });

    it('treats a state without a version as out of step, and nothing stored as out of step', () => {
      expect(inStepWith({ revision: 1, owner: 'platform' }, 'v2', stored)).to.equal(false);
      expect(inStepWith({ revision: 1, owner: 'platform', versionId: 'v2' }, 'v2', { exists: false })).to.equal(false);
      expect(inStepWith(undefined, 'v2', stored)).to.equal(false);
    });

    it("sends a base revision only for the version it was recorded for", () => {
      expect(baseRevisionFor({ revision: 4, owner: 'platform', versionId: 'v1' }, 'v1')).to.equal(4);
      expect(baseRevisionFor({ revision: 4, owner: 'platform', versionId: 'v1' }, 'v2')).to.equal(undefined);
      expect(baseRevisionFor({ revision: 4, owner: 'platform' }, 'v2')).to.equal(4);
      expect(baseRevisionFor(undefined, 'v2')).to.equal(undefined);
    });
  });
});

/*
  Source sync reads and writes only the project: a symlinked frontend/src, frontend, root file or .tooljet that leads
  outside is refused, before anything is sent or written. Links that stay inside the project still work.
*/
describe('source sync stays inside the project', () => {
  let root: string;
  let outside: string;
  const write = (base: string, rel: string, content = 'x') => {
    fs.mkdirSync(path.dirname(path.join(base, rel)), { recursive: true });
    fs.writeFileSync(path.join(base, rel), content);
  };
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-confine-'));
    outside = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-outside-'));
    write(root, 'app.json', '{"appId":"a"}');
    write(outside, 'sentinel.json', '{"secret":true}');
  });
  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  });

  it('refuses to collect a symlinked frontend/src that leads outside', () => {
    fs.mkdirSync(path.join(root, 'frontend'));
    fs.symlinkSync(outside, path.join(root, 'frontend', 'src'), 'dir');
    expect(() => collectProjectSource(root)).to.throw(/frontend\/src.*outside the project/);
  });

  it('refuses a symlinked frontend folder and a symlinked root file', () => {
    write(outside, 'src/index.ts', 'export const secret = 1;');
    fs.symlinkSync(outside, path.join(root, 'frontend'), 'dir');
    expect(() => collectProjectSource(root)).to.throw(/frontend\/src.*outside the project/);
    fs.rmSync(path.join(root, 'frontend'));
    write(root, 'frontend/src/index.ts');
    fs.symlinkSync(path.join(outside, 'sentinel.json'), path.join(root, 'frontend', 'package.json'));
    expect(() => collectProjectSource(root)).to.throw(/frontend\/package.json.*outside the project/);
  });

  it('still collects a tree linked inside the project, and skips links inside a tree as before', () => {
    write(root, 'shared/src/index.ts', 'export {}');
    fs.mkdirSync(path.join(root, 'frontend'));
    fs.symlinkSync(path.join(root, 'shared', 'src'), path.join(root, 'frontend', 'src'), 'dir');
    fs.symlinkSync(path.join(outside, 'sentinel.json'), path.join(root, 'shared', 'src', 'leak.json'));
    expect(collectProjectSource(root).map((f) => f.path)).to.deep.equal(['app.json', 'frontend/src/index.ts']);
  });

  it('refuses a pull that would write through a link outside, and writes nothing', () => {
    write(root, 'frontend/src/App.tsx', 'local');
    fs.symlinkSync(outside, path.join(root, 'frontend', 'src', 'lib'), 'dir');
    const stored = {
      exists: true,
      revision: 2,
      owner: 'platform' as const,
      files: [
        { path: 'frontend/src/App.tsx', content: 'pulled' },
        { path: 'frontend/src/lib/evil.ts', content: 'escaped' },
      ],
    };
    expect(() => applyStoredSource(root, stored, 'v1')).to.throw(/frontend\/src\/lib\/evil.ts.*outside the project/);
    expect(fs.existsSync(path.join(outside, 'evil.ts'))).to.equal(false);
    expect(fs.readFileSync(path.join(root, 'frontend', 'src', 'App.tsx'), 'utf8')).to.equal('local');
  });

  it('refuses to write the sync state through a symlinked .tooljet', () => {
    fs.symlinkSync(outside, path.join(root, '.tooljet'), 'dir');
    expect(() => writeSourceState(root, { revision: 1, owner: 'platform' })).to.throw(/outside the project/);
    expect(fs.existsSync(path.join(outside, 'source.json'))).to.equal(false);
    expect(readSourceState(root)).to.equal(undefined);
  });
});
