/** @group gitsync */
import { WebhookSkipFlagService } from '@ee/git-sync-webhooks/services/webhook-skip-flag.service';

describe('WebhookSkipFlagService', () => {
  const make = (evalResult: string | null = null) => {
    const set = jest.fn().mockResolvedValue('OK');
    const evalFn = jest.fn().mockResolvedValue(evalResult);
    const redisService = { getClient: () => ({ set, eval: evalFn }) } as any;
    return { service: new WebhookSkipFlagService(redisService), set, evalFn };
  };

  describe('setSkipFlag', () => {
    it('sets an org+branch-scoped key with a 120s TTL and a push: value by default', async () => {
      const { service, set } = make();
      await service.setSkipFlag('org-1', 'main');
      expect(set).toHaveBeenCalledTimes(1);
      const [key, value, ex, ttl] = set.mock.calls[0];
      expect(key).toBe('gitsync:skip:org-1:main');
      expect(String(value)).toMatch(/^push:\d+$/);
      expect(ex).toBe('EX');
      expect(ttl).toBe(120);
    });

    it('encodes the operation in the value', async () => {
      const { service, set } = make();
      await service.setSkipFlag('org-1', 'feat', 'delete');
      expect(String(set.mock.calls[0][1])).toMatch(/^delete:\d+$/);
    });
  });

  describe('checkAndClear', () => {
    it('returns the flag value (atomic GETDEL via eval) when present', async () => {
      const { service, evalFn } = make('push:1700000000000');
      await expect(service.checkAndClear('org-1', 'main')).resolves.toBe('push:1700000000000');
      const [, numKeys, key] = evalFn.mock.calls[0];
      expect(numKeys).toBe(1);
      expect(key).toBe('gitsync:skip:org-1:main');
    });

    it('returns null when no flag exists', async () => {
      const { service } = make(null);
      await expect(service.checkAndClear('org-1', 'main')).resolves.toBeNull();
    });
  });
});
