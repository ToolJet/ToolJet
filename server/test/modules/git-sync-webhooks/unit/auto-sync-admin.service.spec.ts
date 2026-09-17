/**
 * AutoSyncAdminService — the admin surface for inbound-webhook auto-sync
 * (enable/provision/disable, update events, rotate secret, status, list events).
 *
 * Every method routes DB access through getConnectionInstance().manager, so we mock
 * @helpers/database.helper and hand each test a fake manager. ConfigService + RedisService
 * are fakes; crypto is real (secrets are just asserted to be hex of the right length).
 * No Nest app / DB / Redis.
 *
 * @group gitsync
 */
jest.mock('@helpers/database.helper', () => ({ getConnectionInstance: jest.fn() }));

import { BadRequestException } from '@nestjs/common';
import { getConnectionInstance } from '@helpers/database.helper';
import { AutoSyncAdminService } from '@ee/git-sync-webhooks/services/auto-sync-admin.service';

const getConn = getConnectionInstance as unknown as jest.Mock;

describe('AutoSyncAdminService', () => {
  let manager: {
    findOne: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
    findAndCount: jest.Mock;
  };
  let redisClient: { del: jest.Mock; set: jest.Mock; get: jest.Mock };
  let svc: AutoSyncAdminService;

  const config = { get: jest.fn().mockReturnValue('https://tj.example.com') };

  beforeEach(() => {
    manager = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(0),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    redisClient = { del: jest.fn().mockResolvedValue(1), set: jest.fn().mockResolvedValue('OK'), get: jest.fn() };
    getConn.mockReturnValue({ manager });
    const redisService = { getClient: () => redisClient } as any;
    svc = new AutoSyncAdminService(config as any, redisService);
    config.get.mockClear();
  });

  const isHex64 = (s: string) => /^[0-9a-f]{64}$/.test(s);

  describe('resolveProvider (private)', () => {
    const resolve = (orgGit: any) => (svc as any).resolveProvider(orgGit);
    it('env config → provider from envGitProvider', () => {
      expect(resolve({ useEnvConfig: true, envGitProvider: 'gitlab' })).toBe('gitlab');
      expect(resolve({ useEnvConfig: true, envGitProvider: 'github_https' })).toBe('github');
    });
    it('db config → gitlab when gitLab is enabled, else github', () => {
      expect(resolve({ gitLab: { isEnabled: true } })).toBe('gitlab');
      expect(resolve({ gitHttps: { isEnabled: true } })).toBe('github');
      expect(resolve({})).toBe('github');
    });
  });

  describe('enableAutoSync', () => {
    it('throws when git sync is not configured', async () => {
      manager.findOne.mockResolvedValue(null);
      await expect(svc.enableAutoSync('org')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('generates a secret, defaults to all events, and returns the webhook URL', async () => {
      manager.findOne.mockResolvedValue({ gitLab: { isEnabled: true } }); // no webhookSecret
      const res = await svc.enableAutoSync('org1');
      expect(isHex64(res.secret)).toBe(true);
      expect(res.provider).toBe('gitlab');
      expect(res.events).toEqual(['push', 'pull_request', 'delete']);
      expect(res.webhookUrl).toBe('https://tj.example.com/api/v2/git-sync/webhooks/gitlab/org1');
      expect(manager.update).toHaveBeenCalledWith(
        expect.anything(),
        { organizationId: 'org1' },
        expect.objectContaining({ webhookEnabled: true, webhookSecret: res.secret, webhookEvents: res.events })
      );
    });

    it('reuses an already-provisioned secret and filters to allowed events', async () => {
      manager.findOne.mockResolvedValue({ webhookSecret: 'existing-secret' });
      const res = await svc.enableAutoSync('org1', ['push', 'bogus', 'delete']);
      expect(res.secret).toBe('existing-secret');
      expect(res.events).toEqual(['push', 'delete']);
    });

    it('throws when the requested events contain nothing valid', async () => {
      manager.findOne.mockResolvedValue({ webhookSecret: 's' });
      await expect(svc.enableAutoSync('org1', ['nope'])).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('provisionWebhook', () => {
    it('throws when git sync is not configured', async () => {
      manager.findOne.mockResolvedValue(null);
      await expect(svc.provisionWebhook('org')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('generates + persists a secret on first provision', async () => {
      manager.findOne.mockResolvedValue({}); // no secret
      const res = await svc.provisionWebhook('org1');
      expect(isHex64(res.secret)).toBe(true);
      expect(manager.update).toHaveBeenCalledWith(
        expect.anything(),
        { organizationId: 'org1' },
        { webhookSecret: res.secret }
      );
    });

    it('reuses an existing secret without a DB write', async () => {
      manager.findOne.mockResolvedValue({ webhookSecret: 'keep' });
      const res = await svc.provisionWebhook('org1');
      expect(res.secret).toBe('keep');
      expect(manager.update).not.toHaveBeenCalled();
    });
  });

  describe('disableAutoSync', () => {
    it('clears the flag + secret and deletes the old-secret redis key', async () => {
      await svc.disableAutoSync('org1');
      expect(manager.update).toHaveBeenCalledWith(
        expect.anything(),
        { organizationId: 'org1' },
        { webhookEnabled: false, webhookSecret: null }
      );
      expect(redisClient.del).toHaveBeenCalledWith('gitsync:old_secret:org1');
    });
  });

  describe('updateEvents', () => {
    it('throws when auto-sync is not enabled', async () => {
      manager.findOne.mockResolvedValue({ webhookEnabled: false });
      await expect(svc.updateEvents('org1', ['push'])).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when no valid events remain after filtering', async () => {
      manager.findOne.mockResolvedValue({ webhookEnabled: true });
      await expect(svc.updateEvents('org1', ['bogus'])).rejects.toBeInstanceOf(BadRequestException);
    });

    it('filters to allowed events and persists them', async () => {
      manager.findOne.mockResolvedValue({ webhookEnabled: true });
      const res = await svc.updateEvents('org1', ['push', 'x', 'delete']);
      expect(res.events).toEqual(['push', 'delete']);
      expect(manager.update).toHaveBeenCalledWith(
        expect.anything(),
        { organizationId: 'org1' },
        { webhookEvents: ['push', 'delete'] }
      );
    });
  });

  describe('rotateSecret', () => {
    it('throws when auto-sync is not enabled', async () => {
      manager.findOne.mockResolvedValue({ webhookEnabled: false });
      await expect(svc.rotateSecret('org1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('stores the old secret in redis (1h TTL), sets a new secret, and returns it', async () => {
      manager.findOne.mockResolvedValue({
        webhookEnabled: true,
        webhookSecret: 'old',
        gitLab: { isEnabled: true },
        webhookEvents: ['push'],
      });
      const res = await svc.rotateSecret('org1');
      expect(isHex64(res.secret)).toBe(true);
      expect(res.secret).not.toBe('old');
      expect(redisClient.set).toHaveBeenCalledWith('gitsync:old_secret:org1', 'old', 'EX', 3600);
      expect(manager.update).toHaveBeenCalledWith(
        expect.anything(),
        { organizationId: 'org1' },
        { webhookSecret: res.secret }
      );
      expect(res.provider).toBe('gitlab');
      expect(res.events).toEqual(['push']);
    });
  });

  describe('getStatus', () => {
    it('returns the disabled shape when git sync is not configured', async () => {
      manager.findOne.mockResolvedValue(null);
      const res = await svc.getStatus('org1');
      expect(res).toMatchObject({ enabled: false, provider: null, webhookUrl: null, events: [], recentEventsCount: 0 });
    });

    it('returns nulls/empty when configured but auto-sync disabled', async () => {
      manager.findOne.mockResolvedValue({ webhookEnabled: false, gitLab: { isEnabled: true } });
      const res = await svc.getStatus('org1');
      expect(res.enabled).toBe(false);
      expect(res.provider).toBeNull();
      expect(res.webhookUrl).toBeNull();
      expect(res.events).toEqual([]);
    });

    it('aggregates last-processed / last-failure / count when enabled', async () => {
      const processedAt = new Date('2026-01-02T00:00:00Z');
      const failedAt = new Date('2026-01-01T00:00:00Z');
      manager.findOne
        .mockResolvedValueOnce({ webhookEnabled: true, gitLab: { isEnabled: true }, webhookEvents: ['push'] }) // orgGit
        .mockResolvedValueOnce({ processedAt }) // last processed
        .mockResolvedValueOnce({ createdAt: failedAt }); // last failed
      manager.count.mockResolvedValue(7);

      const res = await svc.getStatus('org1');
      expect(res.enabled).toBe(true);
      expect(res.provider).toBe('gitlab');
      expect(res.webhookUrl).toBe('https://tj.example.com/api/v2/git-sync/webhooks/gitlab/org1');
      expect(res.events).toEqual(['push']);
      expect(res.lastProcessed).toBe(processedAt);
      expect(res.lastFailure).toBe(failedAt);
      expect(res.recentEventsCount).toBe(7);
    });
  });

  describe('getEvents', () => {
    it('clamps limit to [1,100], computes skip + totalPages', async () => {
      manager.findAndCount.mockResolvedValue([[{ id: 'e1' }], 45]);
      const res = await svc.getEvents('org1', 3, 500); // limit clamps to 100
      expect(manager.findAndCount).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ take: 100, skip: 200, order: { createdAt: 'DESC' } })
      );
      expect(res.total).toBe(45);
      expect(res.page).toBe(3);
      expect(res.totalPages).toBe(1); // ceil(45/100)
    });

    it('defaults page/limit and floors page at 1', async () => {
      manager.findAndCount.mockResolvedValue([[], 0]);
      const res = await svc.getEvents('org1', -5);
      expect(manager.findAndCount).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ take: 20, skip: 0 })
      );
      expect(res.page).toBe(1);
    });
  });
});
