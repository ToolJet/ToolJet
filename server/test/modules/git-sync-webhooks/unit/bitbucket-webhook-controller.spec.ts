/**
 * GitSyncWebhooksController — Bitbucket request routing.
 *
 * Bitbucket differs from GitHub/GitLab only in which headers carry the signature
 * (X-Hub-Signature), delivery id (X-Request-UUID) and event type (X-Event-Key: 'repo:push',
 * 'pullrequest:*'). The webhook e2e (webhook-endpoint.spec.ts) can't cover it: Bitbucket's
 * HMAC needs the raw-body hook the e2e harness doesn't install (same reason GitHub isn't
 * covered there). So the controller is driven directly with a fake GitSyncWebhookService;
 * the HMAC itself is pinned in webhook-signature.spec.ts.
 *
 * @group gitsync
 */
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { GitSyncWebhooksController } from '@ee/git-sync-webhooks/controllers/git-sync-webhooks.controller';
import { GitSyncWebhookService } from '@ee/git-sync-webhooks/services/git-sync-webhook.service';

const ORG = 'org-1';
const SECRET = 'bb-webhook-secret';
const RAW_BODY = Buffer.from('{"push":{}}');

const bbHeaders = (eventKey: string, extra: Record<string, string> = {}) => ({
  'x-hub-signature': 'sha256=abc',
  'x-event-key': eventKey,
  'x-request-uuid': 'delivery-1',
  ...extra,
});

describe('GitSyncWebhooksController — bitbucket', () => {
  let webhookService: {
    getOrgGitConfig: jest.Mock;
    verifySignature: jest.Mock;
    isDuplicate: jest.Mock;
    enqueue: jest.Mock;
  };
  let controller: GitSyncWebhooksController;

  const handle = (headers: Record<string, string>, payload: object = {}) =>
    controller.handleWebhook('bitbucket', ORG, headers, payload, { rawBody: RAW_BODY });

  beforeEach(() => {
    webhookService = {
      getOrgGitConfig: jest.fn().mockResolvedValue({
        webhookEnabled: true,
        webhookSecret: SECRET,
        webhookEvents: ['push', 'pull_request', 'delete'],
      }),
      verifySignature: jest.fn().mockResolvedValue(true),
      isDuplicate: jest.fn().mockResolvedValue(false),
      enqueue: jest.fn().mockResolvedValue({ jobId: 'job-1' }),
    };
    controller = new GitSyncWebhooksController(webhookService as unknown as GitSyncWebhookService);
  });

  it('verifies the X-Hub-Signature header against the raw body', async () => {
    await handle(bbHeaders('repo:push'));
    expect(webhookService.verifySignature).toHaveBeenCalledWith('bitbucket', SECRET, RAW_BODY, 'sha256=abc', ORG);
  });

  it('accepts a repo:push and enqueues it as a push keyed by X-Request-UUID', async () => {
    const payload = { push: { changes: [{ new: { name: 'main' } }] } };
    await expect(handle(bbHeaders('repo:push'), payload)).resolves.toEqual({
      status: 'accepted',
      deliveryId: 'delivery-1',
      jobId: 'job-1',
    });
    expect(webhookService.isDuplicate).toHaveBeenCalledWith('delivery-1', ORG);
    expect(webhookService.enqueue).toHaveBeenCalledWith(ORG, 'bitbucket', 'push', payload, 'delivery-1');
  });

  it.each(['pullrequest:created', 'pullrequest:updated', 'pullrequest:fulfilled', 'pullrequest:rejected'])(
    'maps %s to pull_request',
    async (eventKey) => {
      await handle(bbHeaders(eventKey));
      expect(webhookService.enqueue).toHaveBeenCalledWith(ORG, 'bitbucket', 'pull_request', {}, 'delivery-1');
    }
  );

  // Bitbucket has no separate delete event — a branch delete arrives as repo:push with new: null.
  it('maps a repo:push that deletes a branch (new: null, old.type: branch) to delete', async () => {
    const payload = { push: { changes: [{ new: null, old: { type: 'branch', name: 'feat-1' } }] } };
    await handle(bbHeaders('repo:push'), payload);
    expect(webhookService.enqueue).toHaveBeenCalledWith(ORG, 'bitbucket', 'delete', payload, 'delivery-1');
  });

  it('keeps a repo:push that deletes a TAG as push (tag handling lives in the push path)', async () => {
    const payload = { push: { changes: [{ new: null, old: { type: 'tag', name: 'co-1/v1' } }] } };
    await handle(bbHeaders('repo:push'), payload);
    expect(webhookService.enqueue).toHaveBeenCalledWith(ORG, 'bitbucket', 'push', payload, 'delivery-1');
  });

  it('keeps a repo:push with no changes array as push', async () => {
    await handle(bbHeaders('repo:push'), {});
    expect(webhookService.enqueue).toHaveBeenCalledWith(ORG, 'bitbucket', 'push', {}, 'delivery-1');
  });

  it('ignores a branch delete when delete is not an enabled event', async () => {
    webhookService.getOrgGitConfig.mockResolvedValue({
      webhookEnabled: true,
      webhookSecret: SECRET,
      webhookEvents: ['push', 'pull_request'],
    });
    const payload = { push: { changes: [{ new: null, old: { type: 'branch', name: 'feat-1' } }] } };
    await expect(handle(bbHeaders('repo:push'), payload)).resolves.toMatchObject({
      status: 'ignored',
      event: 'delete',
    });
    expect(webhookService.enqueue).not.toHaveBeenCalled();
  });

  it('ignores an unmapped event key (e.g. repo:fork) as "unknown"', async () => {
    await expect(handle(bbHeaders('repo:fork'))).resolves.toEqual({
      status: 'ignored',
      reason: 'event_not_enabled',
      event: 'unknown',
      deliveryId: 'delivery-1',
    });
    expect(webhookService.enqueue).not.toHaveBeenCalled();
  });

  it('ignores a mapped event that is not enabled for the workspace', async () => {
    webhookService.getOrgGitConfig.mockResolvedValue({
      webhookEnabled: true,
      webhookSecret: SECRET,
      webhookEvents: ['push'],
    });
    await expect(handle(bbHeaders('pullrequest:fulfilled'))).resolves.toMatchObject({
      status: 'ignored',
      event: 'pull_request',
    });
  });

  it('reports a repeated X-Request-UUID as a duplicate without enqueuing', async () => {
    webhookService.isDuplicate.mockResolvedValue(true);
    await expect(handle(bbHeaders('repo:push'))).resolves.toEqual({ status: 'duplicate', deliveryId: 'delivery-1' });
    expect(webhookService.enqueue).not.toHaveBeenCalled();
  });

  it('rejects with 401 when the signature does not verify', async () => {
    webhookService.verifySignature.mockResolvedValue(false);
    await expect(handle(bbHeaders('repo:push'))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(webhookService.enqueue).not.toHaveBeenCalled();
  });

  it('rejects with 403 when webhooks are not enabled for the workspace', async () => {
    webhookService.getOrgGitConfig.mockResolvedValue({ webhookEnabled: false });
    await expect(handle(bbHeaders('repo:push'))).rejects.toBeInstanceOf(ForbiddenException);
    expect(webhookService.verifySignature).not.toHaveBeenCalled();
  });
});
