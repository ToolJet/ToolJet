import { expect } from 'chai';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { behindMessage, checkAgainstStored, hashProjectSource } from '../../../src/lib/app/source-sync';

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

    it('only moves the recorded revision on when the files already match the stored code', () => {
      expect(checkAgainstStored(local, 'v', stored(9, 'h9'), 'h9')).to.deep.equal({ kind: 'same-files', revision: 9 });
    });
  });

  it('says plainly what to do', () => {
    expect(behindMessage(9)).to.equal(
      'ToolJet has newer code (revision 9, changed in the editor or by AI). Run tooljet app source-pull, then save again.'
    );
  });
});
