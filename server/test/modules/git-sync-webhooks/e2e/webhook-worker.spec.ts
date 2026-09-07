/**
 * GitSyncWebhookWorker — auto-sync decision flow.
 *
 * The worker is NOT registered in the e2e DI (gated behind isMainImport && !IS_GET_CONTEXT,
 * and initTestApp builds IS_GET_CONTEXT=true), so we construct it manually with fakes and
 * drive `process(job)` directly. This exercises the 585-line worker's decision tree
 * (PR-merge → pull, branch-push skip, self-trigger skip, event-disabled skip, non-default
 * skip, branch delete, tag push) WITHOUT the git simulator — the pull is a spy.
 *
 * Needs the DB (the worker reads OrganizationGitSync / WorkspaceBranch and writes
 * GitSyncWebhookEvent via getConnectionInstance()) but no git host.
 *
 * @group gitsync
 */
import { INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { initTestApp, createUser, closeTestApp } from 'test-helper';
import { GitSyncWebhookWorker } from '@ee/git-sync-webhooks/processors/git-sync-webhook.worker';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';

describe('GitSyncWebhookWorker (auto-sync decision flow)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let orgId: string;
  let defaultBranchId: string;

  // Fakes rebuilt per test so call assertions are isolated.
  let pullWorkspace: jest.Mock;
  let deleteWorkspaceBranch: jest.Mock;
  let pullTagVersion: jest.Mock;
  let checkAndClear: jest.Mock;
  let worker: GitSyncWebhookWorker;

  const buildWorker = () => {
    pullWorkspace = jest.fn().mockResolvedValue({ success: true });
    deleteWorkspaceBranch = jest.fn().mockResolvedValue({ enqueued: true });
    pullTagVersion = jest.fn().mockResolvedValue(undefined);
    checkAndClear = jest.fn().mockResolvedValue(null); // no self-trigger by default
    const workspaceBranchService = { pullWorkspace, deleteWorkspaceBranch, pullTagVersion } as any;
    const skipFlagService = { checkAndClear } as any;
    const redisClient = {
      set: jest.fn().mockResolvedValue('OK'), // lock acquired (NX)
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      publish: jest.fn().mockResolvedValue(1),
      eval: jest.fn().mockResolvedValue(null),
    };
    const redisService = { getClient: () => redisClient } as any;
    const notificationService = {} as any;
    return new GitSyncWebhookWorker(redisService, skipFlagService, workspaceBranchService, notificationService);
  };

  const job = (data: Record<string, any>): any => ({
    data,
    updateProgress: jest.fn().mockResolvedValue(undefined),
  });

  const seedBranch = async (name: string, isDefault: boolean): Promise<string> =>
    (
      await ds.query(
        `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
         VALUES ($1, $2, $3) ON CONFLICT (organization_id, branch_name) DO UPDATE SET is_default = EXCLUDED.is_default
         RETURNING id`,
        [orgId, name, isDefault]
      )
    )[0].id;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    const { organization } = await createUser(app, {
      email: 'webhook-worker@tooljet.io',
      firstName: 'webhook',
      lastName: 'worker',
    });
    orgId = organization.id;
    ds = app.get<DataSource>(getDataSourceToken('default'));

    // Webhooks enabled, multi-branch, all events. (organizationId is the only required column;
    // is_branching_enabled defaults true, webhook_events has a jsonb default.)
    await ds.getRepository(OrganizationGitSync).save(
      ds.getRepository(OrganizationGitSync).create({
        organizationId: orgId,
        webhookEnabled: true,
        isBranchingEnabled: true,
        webhookEvents: ['push', 'pull_request', 'delete'],
      })
    );
    defaultBranchId = await seedBranch('main', true);
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  beforeEach(() => {
    worker = buildWorker();
  });

  const prMerged = (baseRef: string) => ({ action: 'closed', pull_request: { merged: true, base: { ref: baseRef } } });

  it('PR merged into the DEFAULT branch → triggers an auto-sync pullWorkspace', async () => {
    const res = await worker.process(
      job({
        organizationId: orgId,
        provider: 'github',
        event: 'pull_request',
        deliveryId: 'd-pr-default',
        payload: prMerged('main'),
      })
    );
    expect(pullWorkspace).toHaveBeenCalledWith(orgId, null, 'main', defaultBranchId, { source: 'auto-sync' });
    expect(res.action).toBe('pulled');
    expect(res.trigger).toBe('pr_merged');
  });

  it('PR opened (not merged) → ignored, no pull', async () => {
    const res = await worker.process(
      job({
        organizationId: orgId,
        provider: 'github',
        event: 'pull_request',
        deliveryId: 'd-pr-open',
        payload: { action: 'opened', pull_request: { merged: false, base: { ref: 'main' } } },
      })
    );
    expect(pullWorkspace).not.toHaveBeenCalled();
    expect(res.action).toBe('ignored');
  });

  it('PR merged into a NON-default branch → skipped, no pull', async () => {
    await seedBranch('feat-nd', false);
    const res = await worker.process(
      job({
        organizationId: orgId,
        provider: 'github',
        event: 'pull_request',
        deliveryId: 'd-pr-nd',
        payload: prMerged('feat-nd'),
      })
    );
    expect(pullWorkspace).not.toHaveBeenCalled();
    expect(res.action).toBe('skipped');
  });

  it('branch push → skipped (only PR merges + tags sync), no pull', async () => {
    const res = await worker.process(
      job({
        organizationId: orgId,
        provider: 'github',
        event: 'push',
        deliveryId: 'd-push',
        payload: { ref: 'refs/heads/main' },
      })
    );
    expect(pullWorkspace).not.toHaveBeenCalled();
    expect(res.reason).toBe('branch_push_skipped');
  });

  it('self-triggered PR (skip-flag present) → skipped, no pull', async () => {
    checkAndClear.mockResolvedValue('push:1700000000000');
    const res = await worker.process(
      job({
        organizationId: orgId,
        provider: 'github',
        event: 'pull_request',
        deliveryId: 'd-self',
        payload: prMerged('main'),
      })
    );
    expect(pullWorkspace).not.toHaveBeenCalled();
    expect(res.reason).toBe('self_triggered');
  });

  it('event disabled at processing time → skipped, no pull', async () => {
    await ds.getRepository(OrganizationGitSync).update({ organizationId: orgId }, { webhookEvents: ['push'] });
    try {
      const res = await worker.process(
        job({
          organizationId: orgId,
          provider: 'github',
          event: 'pull_request',
          deliveryId: 'd-disabled',
          payload: prMerged('main'),
        })
      );
      expect(pullWorkspace).not.toHaveBeenCalled();
      expect(res.reason).toBe('event_disabled_at_processing');
    } finally {
      await ds
        .getRepository(OrganizationGitSync)
        .update({ organizationId: orgId }, { webhookEvents: ['push', 'pull_request', 'delete'] });
    }
  });

  it('branch delete on a feature branch → deleteWorkspaceBranch', async () => {
    const featDelId = await seedBranch('feat-del', false);
    const res = await worker.process(
      job({
        organizationId: orgId,
        provider: 'github',
        event: 'delete',
        deliveryId: 'd-del',
        payload: { ref: 'feat-del', ref_type: 'branch' },
      })
    );
    expect(deleteWorkspaceBranch).toHaveBeenCalledWith(orgId, featDelId);
    expect(res.action).toBe('deleted');
  });

  it('tag push for an unknown app → skipped (pattern matches, app not found), no tag import', async () => {
    const res = await worker.process(
      job({
        organizationId: orgId,
        provider: 'github',
        event: 'push',
        deliveryId: 'd-tag',
        payload: { ref: 'refs/tags/11111111-2222-3333-4444-555555555555/v1', after: 'abc1234def' },
      })
    );
    expect(pullTagVersion).not.toHaveBeenCalled();
    expect(res.status).toBe('skipped');
  });
});
