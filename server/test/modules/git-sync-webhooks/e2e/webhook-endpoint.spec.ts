/**
 * GitSyncWebhooksController — inbound webhook endpoint.
 *
 *   POST /api/v2/git-sync/webhooks/:provider/:organizationId  → 202
 *
 * Uses the GITLAB provider on purpose: GitLab verification is a plain X-Gitlab-Token
 * compare (no HMAC over the raw body), so it doesn't need the `rawBodyBuffer` json hook —
 * which the e2e harness (`configureApp`) does not install (GitHub HMAC would throw on an
 * undefined rawBody). Exercises the controller path: config gate → signature verify →
 * dedupe → event routing → enqueue (records a GitSyncWebhookEvent). The worker is not in the
 * e2e DI, so the enqueued job never drains — covered separately by webhook-worker.spec.ts.
 *
 * Needs the DB + Redis (dedupe SETNX + BullMQ enqueue). No git host.
 *
 * @group gitsync
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { initTestApp, createUser, closeTestApp } from 'test-helper';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';

describe('GitSyncWebhooksController (POST /api/v2/git-sync/webhooks/:provider/:org)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let orgId: string;
  const SECRET = 'gl-webhook-secret-token';

  const post = (org: string, headers: Record<string, string>, payload?: any) =>
    request(app.getHttpServer())
      .post(`/api/v2/git-sync/webhooks/gitlab/${org}`)
      .set(headers)
      .send(payload ?? { ref: 'refs/heads/main' });

  const glHeaders = (event: string, deliveryId: string, token = SECRET) => ({
    'x-gitlab-token': token,
    'x-gitlab-event': event,
    'x-gitlab-event-uuid': deliveryId,
  });

  const eventRow = async (deliveryId: string) =>
    (
      await ds.query(
        `SELECT status, event_type AS "eventType", branch_name AS "branchName" FROM git_sync_webhook_events WHERE delivery_id = $1`,
        [deliveryId]
      )
    )[0];

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    const { organization } = await createUser(app, {
      email: 'webhook-endpoint@tooljet.io',
      firstName: 'webhook',
      lastName: 'endpoint',
    });
    orgId = organization.id;
    ds = app.get<DataSource>(getDataSourceToken('default'));
    await ds.getRepository(OrganizationGitSync).save(
      ds.getRepository(OrganizationGitSync).create({
        organizationId: orgId,
        webhookEnabled: true,
        webhookSecret: SECRET,
        webhookEvents: ['push', 'pull_request', 'delete'],
      })
    );
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('403 when webhooks are not enabled for the workspace', async () => {
    // A random org id has no OrganizationGitSync row → getOrgGitConfig null → forbidden.
    await post(randomUUID(), glHeaders('Push Hook', randomUUID())).expect(403);
  });

  it('401 on an invalid X-Gitlab-Token', async () => {
    await post(orgId, glHeaders('Push Hook', randomUUID(), 'wrong-token')).expect(401);
  });

  it('202 accepted → records a queued webhook event for an enabled push', async () => {
    const deliveryId = randomUUID();
    const res = await post(orgId, glHeaders('Push Hook', deliveryId), {
      ref: 'refs/heads/main',
      event_name: 'push',
      project: { id: 1 },
    }).expect(202);

    expect(res.body.status).toBe('accepted');
    expect(res.body.deliveryId).toBe(deliveryId);
    expect(res.body.jobId).toBe(`${deliveryId}_${orgId}`);

    const row = await eventRow(deliveryId);
    expect(row?.status).toBe('queued');
    expect(row?.eventType).toBe('push');
    expect(row?.branchName).toBe('main');
  });

  it('202 duplicate on a repeated delivery id', async () => {
    const deliveryId = randomUUID();
    const headers = glHeaders('Push Hook', deliveryId);
    await post(orgId, headers, { ref: 'refs/heads/main' }).expect(202); // first → accepted
    const res = await post(orgId, headers, { ref: 'refs/heads/main' }).expect(202); // second → duplicate
    expect(res.body.status).toBe('duplicate');
    expect(res.body.deliveryId).toBe(deliveryId);
  });

  it('202 ignored for an event not in the enabled set', async () => {
    await ds.getRepository(OrganizationGitSync).update({ organizationId: orgId }, { webhookEvents: ['push'] });
    try {
      const res = await post(orgId, glHeaders('Merge Request Hook', randomUUID()), {
        object_kind: 'merge_request',
      }).expect(202);
      expect(res.body.status).toBe('ignored');
      expect(res.body.reason).toBe('event_not_enabled');
      expect(res.body.event).toBe('pull_request');
    } finally {
      await ds
        .getRepository(OrganizationGitSync)
        .update({ organizationId: orgId }, { webhookEvents: ['push', 'pull_request', 'delete'] });
    }
  });
});
