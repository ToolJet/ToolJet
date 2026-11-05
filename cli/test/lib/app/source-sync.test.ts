import { expect } from 'chai';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Session } from '../../../src/lib/app/session';
import { behindMessage, checkAgainstStored, hashProjectSource, pullStoredCode } from '../../../src/lib/app/source-sync';
import { readSourceState, writeSourceState } from '../../../src/lib/app/source-upload';

/*
  Before dev uploads a build (and while it watches) it compares the copy with ToolJet's stored code: a copy behind the
  editor's or the AI's newer code is pulled when nothing local would be lost, and never uploaded otherwise.
*/

const sha = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');

describe('dev keeps in step with code the ToolJet editor owns', () => {
  let root: string;
  const write = (rel: string, content: string) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content);
  };
  beforeEach(() => (root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-source-sync-'))));
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it("hashes the project the way ToolJet hashes stored source, without the checkout's version", () => {
    write('app.json', '{\n  "name": "A"\n}\n');
    write('frontend/src/b.tsx', 'b');
    write('frontend/src/a.tsx', 'a');
    // ToolJet: each path and its file's sha256, in path order.
    const files = [
      ['app.json', '{\n  "name": "A"\n}\n'],
      ['frontend/src/a.tsx', 'a'],
      ['frontend/src/b.tsx', 'b'],
    ];
    const expected = sha(files.map(([p, c]) => `${p}\0${sha(c)}\n`).join(''));
    expect(hashProjectSource(root)).to.equal(expected);
    write('app.json', JSON.stringify({ name: 'A', version: { id: 'v', name: 'v1_1' } }, null, 2) + '\n');
    expect(hashProjectSource(root)).to.equal(expected);
    write('frontend/src/a.tsx', 'a2');
    expect(hashProjectSource(root)).to.not.equal(expected);
  });

  describe('checkAgainstStored', () => {
    const local = { revision: 3, owner: 'platform' as const, versionId: 'v', contentHash: 'h3' };
    const stored = (revision: number, contentHash: string, owner: 'platform' | 'repository' = 'platform') => ({
      exists: true,
      revision,
      owner,
      contentHash,
    });

    it('lets the build through when the copy is at the stored revision, or the code is not editor-owned', () => {
      expect(checkAgainstStored(local, 'v', stored(3, 'h3'), 'edited')).to.deep.equal({ kind: 'in-step' });
      expect(checkAgainstStored(local, 'v', stored(9, 'h9', 'repository'), 'h3')).to.deep.equal({ kind: 'in-step' });
      expect(checkAgainstStored(local, 'v', { exists: false }, 'h3')).to.deep.equal({ kind: 'in-step' });
      expect(checkAgainstStored(local, 'v', undefined, 'h3')).to.deep.equal({ kind: 'in-step' });
    });

    it('pulls a copy that is behind and unchanged since its last sync', () => {
      expect(checkAgainstStored(local, 'v', stored(9, 'h9'), 'h3')).to.deep.equal({
        kind: 'behind',
        revision: 9,
        clean: true,
      });
    });

    it('holds back a copy that is behind and has local changes', () => {
      expect(checkAgainstStored(local, 'v', stored(9, 'h9'), 'edited')).to.deep.equal({
        kind: 'behind',
        revision: 9,
        clean: false,
      });
      // No record of the last sync (or one for another version): nothing says a pull is safe.
      expect(checkAgainstStored(undefined, 'v', stored(9, 'h9'), 'h3')).to.include({ kind: 'behind', clean: false });
      expect(checkAgainstStored({ ...local, versionId: 'other' }, 'v', stored(9, 'h9'), 'h3')).to.include({
        clean: false,
      });
    });

    it('does not call a new draft newer: its code is what this copy last synced, under a restarted revision', () => {
      const clone = { revision: 12, owner: 'platform' as const, versionId: 'released', contentHash: 'h12' };
      expect(checkAgainstStored(clone, 'draft', stored(1, 'h12'), 'edited')).to.deep.equal({
        kind: 'same-files',
        revision: 1,
      });
      // The draft's code did move on: that is newer, and local changes hold it back.
      expect(checkAgainstStored(clone, 'draft', stored(2, 'h2'), 'edited')).to.include({
        kind: 'behind',
        clean: false,
      });
    });

    it('only moves the recorded revision on when the files already match the stored code', () => {
      expect(checkAgainstStored(local, 'v', stored(9, 'h9'), 'h9')).to.deep.equal({ kind: 'same-files', revision: 9 });
    });
  });

  describe('pullStoredCode', () => {
    const where = { appId: 'a', versionId: 'v' };
    const hashOf = (files: Array<{ path: string; content: string }>) =>
      sha(
        [...files]
          .sort((x, y) => (x.path < y.path ? -1 : 1))
          .map((f) => `${f.path}\0${sha(f.content)}\n`)
          .join('')
      );
    const remote = (files: Array<{ path: string; content: string }>) => ({
      exists: true,
      revision: 9,
      owner: 'platform' as const,
      contentHash: hashOf(files),
      files,
    });
    const sessionWith = (stored: object) => ({ api: async () => stored } as unknown as Session);
    const newer = [{ path: 'frontend/src/a.tsx', content: 'theirs' }];
    const pull = (force = false) => {
      const stored = remote(newer);
      return pullStoredCode(sessionWith(stored), root, where, { ...stored, files: undefined }, force);
    };
    const synced = (content: string) =>
      writeSourceState(root, {
        revision: 3,
        owner: 'platform',
        versionId: 'v',
        contentHash: hashOf([{ path: 'frontend/src/a.tsx', content }]),
      });

    it('pulls a copy unchanged since its last sync', async () => {
      write('frontend/src/a.tsx', 'base');
      synced('base');
      expect(await pull()).to.include({ kind: 'pulled', written: 1, kept: 0 });
      expect(fs.readFileSync(path.join(root, 'frontend/src/a.tsx'), 'utf8')).to.equal('theirs');
    });

    it('never overwrites a file changed here unless told to, and records nothing when it refuses', async () => {
      write('frontend/src/a.tsx', 'my edit');
      write('frontend/src/mine.tsx', 'my new file');
      synced('base');
      expect(await pull()).to.deep.equal({
        kind: 'local-changes',
        revision: 9,
        files: ['frontend/src/a.tsx', 'frontend/src/mine.tsx'],
      });
      expect(fs.readFileSync(path.join(root, 'frontend/src/a.tsx'), 'utf8')).to.equal('my edit');
      expect(fs.existsSync(path.join(root, 'frontend/src/mine.tsx'))).to.equal(true);
      expect(readSourceState(root)?.revision).to.equal(3);
    });

    it('refuses when there is no record of a last sync, as nothing says the files are unchanged', async () => {
      write('frontend/src/a.tsx', 'unknown');
      expect(await pull()).to.include({ kind: 'local-changes' });
    });

    it('with force, takes the stored code and keeps a copy of what it replaced', async () => {
      write('frontend/src/a.tsx', 'my edit');
      write('frontend/src/mine.tsx', 'my new file');
      synced('base');
      const result = await pull(true);
      expect(result).to.include({ kind: 'pulled', kept: 2 });
      const keptIn = (result as { keptIn: string }).keptIn;
      expect(fs.readFileSync(path.join(root, keptIn, 'frontend/src/a.tsx'), 'utf8')).to.equal('my edit');
      expect(fs.readFileSync(path.join(root, keptIn, 'frontend/src/mine.tsx'), 'utf8')).to.equal('my new file');
      expect(fs.readFileSync(path.join(root, 'frontend/src/a.tsx'), 'utf8')).to.equal('theirs');
      expect(fs.existsSync(path.join(root, 'frontend/src/mine.tsx'))).to.equal(false);
      // The copies aren't project source: the next upload and comparison ignore them.
      expect(hashProjectSource(root)).to.equal(hashOf(newer));
    });

    it('only records the revision when the files already match', async () => {
      write('frontend/src/a.tsx', 'theirs');
      synced('base');
      expect(await pull()).to.deep.equal({ kind: 'same-files', revision: 9 });
      expect(readSourceState(root)).to.include({ revision: 9, versionId: 'v' });
    });
  });

  it('says plainly what to do', () => {
    expect(behindMessage(9)).to.equal(
      'ToolJet has newer code (revision 9, changed in the editor or by AI). Run tooljet app source-pull, then save again.'
    );
  });
});
