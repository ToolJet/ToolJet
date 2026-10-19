import { EntityManager } from 'typeorm';
import { getAppDataRevision, resetAppDataRevisionCache } from '@modules/apps/app-data-revision';
import { findUserGroupsWithAppAccess } from '@modules/group-permissions/repository';

jest.mock('@modules/group-permissions/repository', () => ({ findUserGroupsWithAppAccess: jest.fn() }));
const viewerGroups = findUserGroupsWithAppAccess as jest.Mock;

/** @group platform */
describe('getAppDataRevision', () => {
  const app = { id: 'app-1', name: 'Orders', isPublic: false, isMaintenanceOn: false, organizationId: 'org-1' };
  const scope = { versionId: 'ver-1', userId: 'user-1', licenseTerms: { valid: true } };
  const makeManager = (query: jest.Mock) => ({ query }) as unknown as EntityManager;
  const isMigrationRead = (sql: string) => sql.includes('FROM migrations');

  // Answers the migration read with a fixed timestamp and the change-stamp read with `stamp`.
  const queryReturning = (stamp: string | null = null) =>
    jest.fn((sql: string) => Promise.resolve(isMigrationRead(sql) ? [{ revision: '1787800000000' }] : [{ stamp }]));

  let serverVersion: unknown;
  beforeEach(() => {
    resetAppDataRevisionCache();
    serverVersion = globalThis.TOOLJET_VERSION;
    globalThis.TOOLJET_VERSION = '3.21.78';
    viewerGroups.mockReset().mockResolvedValue([{ id: 'group-a' }]);
  });
  afterEach(() => {
    globalThis.TOOLJET_VERSION = serverVersion;
  });

  it('starts with the latest migration and is stable when nothing changes', async () => {
    const manager = makeManager(queryReturning());

    const first = await getAppDataRevision(manager, app, scope);
    const second = await getAppDataRevision(manager, { ...app }, { ...scope });

    expect(first).toMatch(/^1787800000000\.[0-9a-f]{12}$/);
    expect(second).toBe(first);
  });

  it.each([
    ['name', { name: 'Orders v2' }],
    ['public setting', { isPublic: true }],
    ['maintenance setting', { isMaintenanceOn: true }],
  ])('changes when the app %s changes', async (_label, change) => {
    const manager = makeManager(queryReturning());

    const before = await getAppDataRevision(manager, app, scope);
    const after = await getAppDataRevision(manager, { ...app, ...change }, scope);

    expect(after).not.toBe(before);
  });

  it("changes when the app's change stamp moves", async () => {
    const before = await getAppDataRevision(makeManager(queryReturning()), app, scope);
    const after = await getAppDataRevision(makeManager(queryReturning('2026-10-19 10:05:00+00')), app, scope);

    expect(after).not.toBe(before);
  });

  it("changes when the viewer's groups with access to the app change", async () => {
    const manager = makeManager(queryReturning());
    const before = await getAppDataRevision(manager, app, scope);

    viewerGroups.mockResolvedValue([{ id: 'group-a' }, { id: 'group-b' }]);

    expect(await getAppDataRevision(manager, app, scope)).not.toBe(before);
    expect(viewerGroups).toHaveBeenCalledWith(manager, 'user-1', 'app-1', 'org-1');
  });

  it('ignores groups on a public app, where permissions are not checked against them', async () => {
    await getAppDataRevision(makeManager(queryReturning()), { ...app, isPublic: true }, scope);

    expect(viewerGroups).not.toHaveBeenCalled();
  });

  it.each([
    ['released version', { versionId: 'ver-2' }],
    ['viewer', { userId: 'user-2' }],
    ['license', { licenseTerms: { valid: false } }],
  ])('changes with the %s', async (_label, change) => {
    const manager = makeManager(queryReturning());

    const before = await getAppDataRevision(manager, app, scope);
    const after = await getAppDataRevision(manager, app, { ...scope, ...change });

    expect(after).not.toBe(before);
  });

  it('changes when a new server version is deployed', async () => {
    const manager = makeManager(queryReturning());
    const before = await getAppDataRevision(manager, app, scope);

    globalThis.TOOLJET_VERSION = '3.21.79';

    expect(await getAppDataRevision(manager, app, scope)).not.toBe(before);
  });

  it("reads the app's change stamp, and no groups for an anonymous viewer", async () => {
    const query = queryReturning();

    await getAppDataRevision(makeManager(query), app, { versionId: 'ver-1', licenseTerms: {} });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('app_viewer_cache_stamps'), ['app-1']);
    expect(viewerGroups).not.toHaveBeenCalled();
  });

  it('reads the latest migration once per process', async () => {
    const query = queryReturning();

    await getAppDataRevision(makeManager(query), app, scope);
    await getAppDataRevision(makeManager(query), app, scope);

    expect(query.mock.calls.filter(([sql]) => isMigrationRead(sql))).toHaveLength(1);
  });

  it('returns null when the migration read fails, and retries on the next call', async () => {
    const query = jest
      .fn()
      .mockRejectedValueOnce(new Error('db down'))
      .mockImplementation((sql: string) =>
        Promise.resolve(isMigrationRead(sql) ? [{ revision: '1787800000000' }] : [{ stamp: null }])
      );

    await expect(getAppDataRevision(makeManager(query), app, scope)).resolves.toBeNull();
    await expect(getAppDataRevision(makeManager(query), app, scope)).resolves.toMatch(/^1787800000000\./);
  });

  it('returns null when the change stamp cannot be read', async () => {
    const query = jest.fn((sql: string) =>
      isMigrationRead(sql) ? Promise.resolve([{ revision: '1787800000000' }]) : Promise.reject(new Error('db down'))
    );

    await expect(getAppDataRevision(makeManager(query), app, scope)).resolves.toBeNull();
  });

  it('returns null when there are no migrations', async () => {
    const query = jest.fn().mockResolvedValue([{ revision: null }]);

    await expect(getAppDataRevision(makeManager(query), app, scope)).resolves.toBeNull();
  });
});
