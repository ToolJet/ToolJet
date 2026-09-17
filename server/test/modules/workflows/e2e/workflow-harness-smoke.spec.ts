/**
 * Harness smoke test for the opt-in `withWorkflows` flag on initTestApp.
 *
 * WHY THIS EXISTS: AppModule.register omits WorkflowsModule under IS_GET_CONTEXT
 * (see src/modules/app/module.ts — the conditional import gated on !IS_GET_CONTEXT),
 * which is exactly the mode initTestApp uses. So by default the test app has NO
 * workflow controllers mounted and NO workflow services in its DI container — every
 * workflow HTTP spec and every `app.get(<workflow service>)` silently fails.
 *
 * `initTestApp({ withWorkflows: true })` registers WorkflowsModule explicitly, in its
 * own cache slot (`${edition}:wf`) so no other test's app is affected. This spec proves
 * that opt-in works end to end:
 *   (a) a workflow-approvals route is actually mounted (GET does not 404 "Cannot GET"), and
 *   (b) WorkflowApprovalsService resolves from the app's DI container.
 *
 * If this goes red, every other HITL e2e spec built on the flag is untrustworthy.
 *
 * @group workflows
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { initTestApp, closeTestApp } from 'test-helper';
import { WorkflowApprovalsService } from '@ee/workflows/services/workflow-approvals.service';

describe('Workflow test harness — withWorkflows opt-in', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', withWorkflows: true }));
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('mounts the workflow-approvals controller (GET :token is not an unmounted route)', async () => {
    // An unknown token: the route runs, the service throws NotFound → 404 with a Nest
    // exception body. What we are ruling out is Express's "Cannot GET /api/..." 404, which
    // is the body you get when the controller was never registered at all. Status alone is
    // not decisive (a real NotFound is also 404); the body text is.
    const res = await request(app.getHttpServer()).get('/api/workflow-approvals/definitely-not-a-real-token');
    const bodyText = JSON.stringify(res.body) + (res.text || '');
    expect(bodyText).not.toContain('Cannot GET');
  });

  it('resolves WorkflowApprovalsService from the DI container', () => {
    const svc = app.get(WorkflowApprovalsService, { strict: false });
    expect(svc).toBeDefined();
    expect(typeof svc.getByToken).toBe('function');
  });
});
