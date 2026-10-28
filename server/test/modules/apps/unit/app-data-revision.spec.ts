import { EntityManager } from 'typeorm';
import { getAppDataRevision, VIEWER_LICENSE_FIELDS } from '@modules/apps/app-data-revision';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { findUserGroupsWithAppAccess } from '@modules/group-permissions/repository';

jest.mock('@modules/group-permissions/repository', () => ({ findUserGroupsWithAppAccess: jest.fn() }));
const viewerGroups = findUserGroupsWithAppAccess as jest.Mock;

/** @group platform */
describe('getAppDataRevision', () => {
  const app = { id: 'app-1', name: 'Orders', isPublic: false, isMaintenanceOn: false, organizationId: 'org-1' };
  const scope = { versionId: 'ver-1', userId: 'user-1', licenseTerms: { valid: true } };
  const makeManager = (query: jest.Mock) => ({ query }) as unknown as EntityManager;
  // Answers the change-stamp read with `stamp`.
  const queryReturning = (stamp: string | null = null) => jest.fn(() => Promise.resolve([{ stamp, epoch: '520' }]));

  let serverVersion: unknown;
  beforeEach(() => {
    serverVersion = globalThis.TOOLJET_VERSION;
    globalThis.TOOLJET_VERSION = '3.21.78';
    viewerGroups.mockReset().mockResolvedValue([{ id: 'group-a' }]);
  });
  afterEach(() => {
    globalThis.TOOLJET_VERSION = serverVersion;
  });

  it('is stable when nothing changes', async () => {
    const manager = makeManager(queryReturning());

    const first = await getAppDataRevision(manager, app, scope);
    const second = await getAppDataRevision(manager, { ...app }, { ...scope });

    expect(first).toMatch(/^[0-9a-f]{16}$/);
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

  it('changes when a migration commits, such as a backfill that rewrites components after boot', async () => {
    const epoch = (latest: string) => jest.fn(() => Promise.resolve([{ stamp: null, epoch: latest }]));

    const before = await getAppDataRevision(makeManager(epoch('520')), app, scope);
    const after = await getAppDataRevision(makeManager(epoch('521')), app, scope);

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

  it('covers every license flag the released-app and released-version responses read', () => {
    // getBySlug and getVersion (CE and EE) gate on these; a flag missing here lets a license change
    // leave a stale cached copy or 304.
    expect(VIEWER_LICENSE_FIELDS).toEqual(
      expect.arrayContaining([
        LICENSE_FIELD.VALID,
        LICENSE_FIELD.APP_PERMISSIONS_PAGES,
        LICENSE_FIELD.APP_PERMISSIONS_QUERY,
        LICENSE_FIELD.APP_PERMISSIONS_COMPONENT,
        LICENSE_FIELD.APP_PAGES_NAV_GROUP,
        LICENSE_FIELD.MODULES,
        LICENSE_FIELD.APP_JS_LIBRARIES,
        LICENSE_FIELD.MULTI_ENVIRONMENT,
        LICENSE_FIELD.GIT_SYNC_MULTI_BRANCH,
      ])
    );
  });

  it('changes when a new server version is deployed', async () => {
    const manager = makeManager(queryReturning());
    const before = await getAppDataRevision(manager, app, scope);

    globalThis.TOOLJET_VERSION = '3.21.79';

    expect(await getAppDataRevision(manager, app, scope)).not.toBe(before);
  });

  it("reads only the app's change stamp, and no groups for an anonymous viewer", async () => {
    const query = queryReturning();

    await getAppDataRevision(makeManager(query), app, { versionId: 'ver-1', licenseTerms: {} });

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('app_viewer_cache_stamps'), ['app-1']);
    expect(viewerGroups).not.toHaveBeenCalled();
  });

  it('returns null when the change stamp cannot be read', async () => {
    const query = jest.fn().mockRejectedValue(new Error('db down'));

    await expect(getAppDataRevision(makeManager(query), app, scope)).resolves.toBeNull();
  });
});
