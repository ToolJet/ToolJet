import { EntityManager } from 'typeorm';
import { AppsUtilService } from '@modules/apps/util.service';

/**
 * The release/promote library gates answer 400 only for a real block. A failure reading the pins (database down,
 * bad SQL) is a server error and must surface as one, not as "your app can't be released".
 */
describe('AppsUtilService library gates | read failures', () => {
  const service = Object.create(AppsUtilService.prototype) as AppsUtilService;
  const outage = new Error('connection terminated');
  const manager = { query: jest.fn().mockRejectedValue(outage) } as unknown as EntityManager;

  it('should not turn a failed release check into a 400', async () => {
    await expect(service.checkLibraryQueriesReleasedInApp('version', 'workspace', manager)).rejects.toBe(outage);
  });

  it('should not turn a failed promote check into a 400', async () => {
    await expect(
      service.checkLibraryQueriesPromotableToEnvironment('version', 'staging', 2, 'workspace', manager)
    ).rejects.toBe(outage);
  });
});
