import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { failedScanSarif, scannedSourceIdentity, uploadScan } from '../../../src/lib/app/scan';
import { Session } from '../../../src/lib/app/session';
import { hashProjectSource } from '../../../src/lib/app/source-sync';
import { writeSourceState } from '../../../src/lib/app/source-upload';

/*
  A scan upload names the stored code it is of (the last pull or push), so ToolJet can count it toward a required
  scanner: only when the state is for this version and the scanned files are that code.
*/
describe('scan uploads name the stored code they scanned', () => {
  let root: string;
  let bodies: Record<string, unknown>[];
  const session = () =>
    ({
      api: async (_p: string, init: { body?: Record<string, unknown> } = {}) => {
        bodies.push(init.body ?? {});
        return {};
      },
    } as unknown as Session);
  const write = (rel: string, content: string) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content);
  };
  const scan = { sarif: failedScanSarif('synthetic') };

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-scan-identity-'));
    bodies = [];
    write('app.json', '{"appId":"a"}');
    write('frontend/src/App.tsx', 'export default 1;');
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it('sends the revision and content hash when the files are the stored code', async () => {
    const hash = hashProjectSource(root);
    writeSourceState(root, { revision: 7, owner: 'platform', versionId: 'v-1', contentHash: hash });
    await uploadScan(session(), { appId: 'app-1', versionId: 'v-1', root }, scan, 'ci');
    expect(bodies[0]).to.include({ source: 'ci', sourceRevision: 7, sourceContentHash: hash });
  });

  it('sends neither for local changes not yet stored, another version, or no sync state', async () => {
    writeSourceState(root, { revision: 7, owner: 'platform', versionId: 'v-1', contentHash: hashProjectSource(root) });
    expect(scannedSourceIdentity(root, 'v-2')).to.equal(undefined);
    write('frontend/src/App.tsx', 'export default 2;');
    expect(scannedSourceIdentity(root, 'v-1')).to.equal(undefined);
    await uploadScan(session(), { appId: 'app-1', versionId: 'v-1', root }, scan, 'dev');
    expect(bodies[0]).to.not.have.any.keys('sourceRevision', 'sourceContentHash');
    fs.rmSync(path.join(root, '.tooljet'), { recursive: true });
    expect(scannedSourceIdentity(root, 'v-1')).to.equal(undefined);
  });

  it('sends neither for a state without a content hash, or without the project root', async () => {
    writeSourceState(root, { revision: 3, owner: 'platform', versionId: 'v-1' });
    expect(scannedSourceIdentity(root, 'v-1')).to.equal(undefined);
    await uploadScan(session(), { appId: 'app-1', versionId: 'v-1' }, scan, 'dev');
    expect(bodies[0]).to.not.have.any.keys('sourceRevision', 'sourceContentHash');
  });
});
