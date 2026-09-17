import { INestApplication } from '@nestjs/common';
// The test app boots with edition: 'ee', so the DI container registers the EE
// subclass (server/ee/apps/util.service.ts) as the AppsUtilService provider —
// a different class reference than the CE base class. app.get() matches by
// class-reference identity, so we must import the same class reference the
// container actually instantiated. findAppWithIdOrSlug is defined on this EE
// subclass, not the CE base class.
import { AppsUtilService } from '@ee/apps/util.service';
import { AppVersion } from '@entities/app_version.entity';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, createApplication, createApplicationVersion } from 'test-helper';
import { updateEntity } from 'test-helper';

/** @group platform */
describe('AppsUtilService.findAppWithIdOrSlug — workflow slug resolution (post-migration)', () => {
  let app: INestApplication;
  let appsUtilService: AppsUtilService;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    appsUtilService = app.get(AppsUtilService);
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('resolves a workflow by slug via app_versions.slug, with version-sourced metadata', async () => {
    const admin = await createAdmin(app, 'find-app-with-id-or-slug-admin@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;

    const workflow = await createApplication(app, { name: 'IdOrSlug Workflow', user: orgUser, type: 'workflow' });
    const version = await createApplicationVersion(app, workflow as any);
    const slug = 'my-id-or-slug-workflow';
    await updateEntity(AppVersion, version.id, {
      slug,
      appName: 'IdOrSlug Workflow Version Name',
      icon: 'id-or-slug-icon.svg',
      isPublic: true,
    });

    const resolved = await appsUtilService.findAppWithIdOrSlug(slug, admin.workspace.id);

    expect(resolved.id).toBe(workflow.id);
    expect(resolved).toMatchObject({
      name: 'IdOrSlug Workflow Version Name',
      slug,
      icon: 'id-or-slug-icon.svg',
      isPublic: true,
    });
  });
});
