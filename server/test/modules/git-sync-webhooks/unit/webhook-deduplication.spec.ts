/** @group gitsync */
import { WebhookDeduplicationService } from '@ee/git-sync-webhooks/services/webhook-deduplication.service';

describe('WebhookDeduplicationService', () => {
  const makeService = (setResult: string | null) => {
    const set = jest.fn().mockResolvedValue(setResult);
    const redisService = { getClient: () => ({ set }) } as any;
    return { service: new WebhookDeduplicationService(redisService), set };
  };

  it('is NOT a duplicate on first delivery (SET NX returns "OK")', async () => {
    const { service, set } = makeService('OK');
    await expect(service.isDuplicate('delivery-1', 'org-1')).resolves.toBe(false);
    // key is org + delivery scoped, 24h TTL, NX
    expect(set).toHaveBeenCalledWith('gitsync:delivery:org-1:delivery-1', '1', 'EX', 86400, 'NX');
  });

  it('IS a duplicate when SET NX returns null (key already set)', async () => {
    const { service } = makeService(null);
    await expect(service.isDuplicate('delivery-1', 'org-1')).resolves.toBe(true);
  });

  it('scopes the dedup key by organization (same delivery id, different org)', async () => {
    const { service, set } = makeService('OK');
    await service.isDuplicate('dup', 'org-A');
    await service.isDuplicate('dup', 'org-B');
    expect(set.mock.calls[0][0]).toBe('gitsync:delivery:org-A:dup');
    expect(set.mock.calls[1][0]).toBe('gitsync:delivery:org-B:dup');
  });
});
