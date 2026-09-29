/** @group workflows */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { initTestApp, closeTestApp } from 'test-helper';
import { WorkflowApprovalsService } from '@ee/workflows/services/workflow-approvals.service';

// If this goes red, WorkflowsModule is not mounted and every workflow e2e spec is untrustworthy.
describe('Workflow test harness', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', withWorkflows: true }));
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('mounts the workflow-approvals controller (GET :token is not an unmounted route)', async () => {
    // Both are 404s: only the body tells the service's NotFound from Express's "Cannot GET".
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
