import { ConfigService } from '@modules/configs/service';
import { InMemoryCacheService } from '@modules/inMemoryCache/in-memory-cache.service';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';

/** @group platform */
describe('ConfigService.public_config cache', () => {
  // Concurrent /api/config calls on page load share one lookup, but nothing is kept once it settles, so
  // a setting changed through the API, directly in the database or on another server applies at once.
  const makeService = (getSettings: jest.Mock) =>
    new ConfigService({ getSettings } as unknown as InstanceSettingsUtilService, new InMemoryCacheService());

  beforeEach(() => new InMemoryCacheService().clear());

  it('shares one lookup between concurrent calls', async () => {
    const getSettings = jest.fn().mockResolvedValue({ ENABLE_COMMENTS: 'true' });
    const service = makeService(getSettings);

    await Promise.all([service.public_config(), service.public_config(), service.public_config()]);

    expect(getSettings).toHaveBeenCalledTimes(1);
  });

  it('reads the current settings on the next call after a lookup settles', async () => {
    const getSettings = jest
      .fn()
      .mockResolvedValueOnce({ ENABLE_COMMENTS: 'true' })
      .mockResolvedValueOnce({ ENABLE_COMMENTS: 'false' });
    const service = makeService(getSettings);
    await service.public_config();

    await expect(service.public_config()).resolves.toMatchObject({ ENABLE_COMMENTS: 'false' });
  });

  it("doesn't keep a failed lookup", async () => {
    const getSettings = jest
      .fn()
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValueOnce({ ENABLE_COMMENTS: 'true' });
    const service = makeService(getSettings);

    await expect(service.public_config()).rejects.toThrow('db down');

    await expect(service.public_config()).resolves.toMatchObject({ ENABLE_COMMENTS: 'true' });
  });
});
