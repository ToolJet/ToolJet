/** @group gitsync */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { listGitResources, findGitResourcePathByCoRelationId } from '@ee/git-sync/git-resource-fs.util';

describe('git-resource-fs.util', () => {
  let repo: string;

  const writeAppJson = (rel: string, content: any) => {
    const full = path.join(repo, rel, 'app', 'app.json');
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, typeof content === 'string' ? content : JSON.stringify(content));
  };

  beforeAll(() => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'git-res-'));
    // direct (top-level) app
    writeAppJson('apps/direct-app', { id: 'c-direct', updatedAt: '2020-01-01T00:00:00.000Z' });
    // dashboard-folder nested app: apps/<folder>/<app>/app/app.json
    writeAppJson('apps/folderX/nested-app', { id: 'c-nested' });
    // malformed app.json → skipped
    writeAppJson('apps/bad', 'not json {');
    // missing id → skipped
    writeAppJson('apps/noid', { name: 'x' });
  });
  afterAll(() => fs.rmSync(repo, { recursive: true, force: true }));

  it('returns [] when the resource folder does not exist', () => {
    expect(listGitResources(repo, 'modules')).toEqual([]);
  });

  it('reads top-level and dashboard-folder apps, skipping malformed / id-less', () => {
    const byId = new Map(listGitResources(repo, 'apps').map((e) => [e.coRelationId, e]));

    expect([...byId.keys()].sort()).toEqual(['c-direct', 'c-nested']);

    // top-level app: no folderName, appPath = apps/<name>
    expect(byId.get('c-direct')).toMatchObject({
      name: 'direct-app',
      folderName: null,
      appPath: 'apps/direct-app',
      updatedAt: new Date('2020-01-01T00:00:00.000Z').getTime(),
    });

    // nested app: folderName set, appPath = apps/<folder>/<name>
    expect(byId.get('c-nested')).toMatchObject({
      name: 'nested-app',
      folderName: 'folderX',
      appPath: 'apps/folderX/nested-app',
    });
    // no updatedAt in the JSON → defaults to 0
    expect(byId.get('c-nested')!.updatedAt).toBe(0);
  });

  describe('findGitResourcePathByCoRelationId', () => {
    it('resolves a resource by its co_relation_id', () => {
      expect(findGitResourcePathByCoRelationId(repo, 'apps', 'c-nested')?.appPath).toBe('apps/folderX/nested-app');
    });
    it('returns null when no resource matches', () => {
      expect(findGitResourcePathByCoRelationId(repo, 'apps', 'does-not-exist')).toBeNull();
    });
  });
});
