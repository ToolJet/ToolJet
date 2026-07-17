import { INestApplication } from '@nestjs/common';
import { AppVersion } from '@entities/app_version.entity';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, createApplication, createApplicationVersion } from 'test-helper';
import { updateEntity } from 'test-helper';

/** @group platform */
describe('Workflow app_versions slug uniqueness trigger', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  describe('enforce_app_versions_default_branch_slug_unique (workflow branch)', () => {
    it('should reject updating a workflow app_version to a slug already used by a different workflow app', async () => {
      const admin = await createAdmin(app, 'workflow-slug-admin@tooljet.io');
      const workflowA = await createApplication(app, {
        name: 'Workflow A',
        user: { ...admin.user, organizationId: admin.workspace.id } as any,
        type: 'workflow',
      });
      const workflowB = await createApplication(
        app,
        {
          name: 'Workflow B',
          user: { ...admin.user, organizationId: admin.workspace.id } as any,
          type: 'workflow',
        },
        false // same org as workflowA — envs already seeded, avoid unique_organization_id_priority collision
      );
      const versionA = await createApplicationVersion(app, workflowA as any);
      const versionB = await createApplicationVersion(app, workflowB as any);

      await updateEntity(AppVersion, versionA.id, { slug: 'taken-slug' });

      await expect(updateEntity(AppVersion, versionB.id, { slug: 'TAKEN-SLUG' })).rejects.toThrow(
        /app_versions_workflow_slug_unique/
      );
    });

    it('should allow two app_versions rows of the SAME workflow to share the same slug', async () => {
      const admin = await createAdmin(app, 'workflow-slug-admin-2@tooljet.io');
      const workflow = await createApplication(app, {
        name: 'Workflow Multi-Version',
        user: { ...admin.user, organizationId: admin.workspace.id } as any,
        type: 'workflow',
      });
      const draft = await createApplicationVersion(app, workflow as any, { name: 'draft' });
      const published = await createApplicationVersion(app, workflow as any, { name: 'published' });

      await updateEntity(AppVersion, draft.id, { slug: 'shared-slug' });

      // Must NOT throw — this is the exact scenario the app_id-scoped fix protects:
      // a workflow's own sibling version sharing its slug is expected, not a collision.
      await expect(updateEntity(AppVersion, published.id, { slug: 'shared-slug' })).resolves.toBeUndefined();
    });

    it('should not reject a slug collision between a workflow and a non-workflow app', async () => {
      const admin = await createAdmin(app, 'workflow-slug-admin-3@tooljet.io');
      const workflow = await createApplication(app, {
        name: 'Workflow C',
        user: { ...admin.user, organizationId: admin.workspace.id } as any,
        type: 'workflow',
      });
      const frontEndApp = await createApplication(
        app,
        {
          name: 'Front End App',
          user: { ...admin.user, organizationId: admin.workspace.id } as any,
          type: 'front-end',
        },
        false // same org as workflow — envs already seeded, avoid unique_organization_id_priority collision
      );
      const workflowVersion = await createApplicationVersion(app, workflow as any);
      const frontEndVersion = await createApplicationVersion(app, frontEndApp as any);

      await updateEntity(AppVersion, frontEndVersion.id, { slug: 'cross-type-slug' });

      // The workflow trigger only fires for type='workflow' rows — a front-end app
      // holding the same slug string must not block a workflow from taking it.
      await expect(updateEntity(AppVersion, workflowVersion.id, { slug: 'cross-type-slug' })).resolves.toBeUndefined();
    });
  });
});
