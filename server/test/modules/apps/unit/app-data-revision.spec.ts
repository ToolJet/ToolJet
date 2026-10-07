import { EntityManager } from 'typeorm';
import { getAppDataRevision, resetAppDataRevisionCache } from '@modules/apps/app-data-revision';

/** @group platform */
describe('getAppDataRevision', () => {
  const app = { name: 'Orders', isPublic: false, isMaintenanceOn: false };
  const makeManager = (query: jest.Mock) => ({ query }) as unknown as EntityManager;
  const migrationManager = () => makeManager(jest.fn().mockResolvedValue([{ revision: '1787800000000' }]));

  beforeEach(() => resetAppDataRevisionCache());

  it('starts with the latest migration and is stable for the same app settings', async () => {
    const manager = migrationManager();

    const first = await getAppDataRevision(manager, app);
    const second = await getAppDataRevision(manager, { ...app });

    expect(first).toMatch(/^1787800000000\.[0-9a-f]{12}$/);
    expect(second).toBe(first);
  });

  it.each([
    ['name', { name: 'Orders v2' }],
    ['public setting', { isPublic: true }],
    ['maintenance setting', { isMaintenanceOn: true }],
  ])('changes when the %s changes', async (_label, change) => {
    const manager = migrationManager();

    const before = await getAppDataRevision(manager, app);
    const after = await getAppDataRevision(manager, { ...app, ...change });

    expect(after).not.toBe(before);
  });

  it('reads the latest migration once per process', async () => {
    const query = jest.fn().mockResolvedValue([{ revision: '1787800000000' }]);

    await getAppDataRevision(makeManager(query), app);
    await getAppDataRevision(makeManager(query), app);

    expect(query).toHaveBeenCalledTimes(1);
  });

  it('returns null when the migration read fails, and retries on the next call', async () => {
    const query = jest
      .fn()
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValueOnce([{ revision: '1787800000000' }]);

    await expect(getAppDataRevision(makeManager(query), app)).resolves.toBeNull();
    await expect(getAppDataRevision(makeManager(query), app)).resolves.toMatch(/^1787800000000\./);
  });

  it('returns null when there are no migrations', async () => {
    const query = jest.fn().mockResolvedValue([{ revision: null }]);

    await expect(getAppDataRevision(makeManager(query), app)).resolves.toBeNull();
  });
});
