import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { ApiError } from '../../../src/lib/app/session';
import { devSourceOwner, isSourceConflict, sourceConflictLines } from '../../../src/lib/app/source-flags';
import { readSourceState, storeSource, writeSourceState } from '../../../src/lib/app/source-upload';

/*
  `tooljet app dev` stores the source after every build when the ToolJet editor owns it, so the AI, the Code panel and
  Save version work from the code that is running; a newer editor or AI edit stops it with a conflict, never an
  overwrite.
*/

describe('tooljet app dev stores the source by default', () => {
  const platform = { revision: 2, owner: 'platform' as const, versionId: 'v' };

  it('stores it when source.json or ToolJet says the editor owns the code', () => {
    expect(devSourceOwner({}, platform, undefined)).to.equal('platform');
    expect(devSourceOwner({}, undefined, { exists: true, owner: 'platform', revision: 2 })).to.equal('platform');
  });

  it('leaves repository-owned or missing code alone unless --source asks', () => {
    expect(devSourceOwner({}, undefined, undefined)).to.equal(null);
    expect(devSourceOwner({}, undefined, { exists: false })).to.equal(null);
    expect(devSourceOwner({}, { ...platform, owner: 'repository' }, { exists: true, owner: 'repository' })).to.equal(
      null
    );
    expect(devSourceOwner({ source: 'repository' }, undefined, undefined)).to.equal('repository');
  });

  it('--no-source turns it off, and an explicit --source wins over what is stored', () => {
    expect(devSourceOwner({ 'no-source': true }, platform, { exists: true, owner: 'platform' })).to.equal(null);
    expect(devSourceOwner({ source: 'repository' }, platform, undefined)).to.equal('repository');
  });

  describe('a newer editor or AI edit', () => {
    let root: string;
    beforeEach(() => (root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-dev-source-'))));
    afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

    it('stops the upload with what to do, and keeps the recorded revision', async () => {
      fs.writeFileSync(path.join(root, 'app.json'), '{}');
      writeSourceState(root, platform);
      const body = JSON.stringify({
        statusCode: 409,
        message: 'ToolJet holds edits made in the editor (revision 4).',
        currentRevision: 4,
      });
      const session = {
        api: async (p: string) => {
          if (!p.endsWith('/import')) return { exists: true, owner: 'platform', revision: 4 };
          throw new ApiError(`POST ${p} failed (HTTP 409)`, 409, body);
        },
      } as any;
      let error: unknown;
      await storeSource(session, { appId: 'a', versionId: 'v', root }, { owner: 'platform', builtBundle: true }).catch(
        (e) => (error = e)
      );
      expect(isSourceConflict(error)).to.equal(true);
      expect(sourceConflictLines(error as ApiError)).to.deep.equal([
        'ToolJet has newer code (revision 4, changed in the editor or by AI). Run tooljet app source-pull, then save again.',
      ]);
      expect(readSourceState(root)?.revision).to.equal(2);
    });

    it('only a 409 counts as that conflict', () => {
      expect(isSourceConflict(new ApiError('failed (HTTP 500)', 500, ''))).to.equal(false);
      expect(isSourceConflict(new Error('offline'))).to.equal(false);
      expect(sourceConflictLines(new ApiError('failed (HTTP 409)', 409, 'not json'))[0]).to.contain(
        'ToolJet has newer code (changed in the editor or by AI).'
      );
    });
  });
});
