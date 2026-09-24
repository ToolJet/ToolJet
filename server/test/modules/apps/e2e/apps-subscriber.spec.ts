import { INestApplication } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, createApplication } from 'test-helper';
import { findEntityOrFail } from 'test-helper';

/** @group platform */
describe('AppsSubscriber', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  describe('afterInsert', () => {
    it('should NOT auto-fill apps.slug for a newly inserted workflow app', async () => {
      const admin = await createAdmin(app, 'subscriber-admin@tooljet.io');
      const workflow = await createApplication(app, {
        name: 'No Auto Slug Workflow',
        user: { ...admin.user, organizationId: admin.workspace.id } as any,
        type: 'workflow',
      });

      const reloaded = await findEntityOrFail(App, { id: workflow.id });
      expect(reloaded.slug).toBeNull();
    });
  });
});
