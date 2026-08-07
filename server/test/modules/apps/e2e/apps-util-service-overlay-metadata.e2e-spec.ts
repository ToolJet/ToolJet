import { INestApplication } from '@nestjs/common';
// The test app boots with edition: 'ee', so the DI container registers the EE
// subclass (server/ee/apps/util.service.ts) as the AppsUtilService provider —
// app.get() matches by class-reference identity, so we must import that class
// reference even though overlayAppMetadata itself is defined on the CE base.
import { AppsUtilService } from '@ee/apps/util.service';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, createApplication, createApplicationVersion, updateEntity, getDefaultDataSource } from 'test-helper';
import { App } from '@entities/app.entity';

/** @group platform */
describe('AppsUtilService.overlayAppMetadata — workflow support', () => {
  let app: INestApplication;
  let appsUtilService: AppsUtilService;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    appsUtilService = app.get(AppsUtilService);
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('should overlay name/slug/icon/isPublic from app_versions onto a workflow App entity', async () => {
    const admin = await createAdmin(app, 'overlay-metadata-admin@tooljet.io');
    // No `name` passed here — the real create() flow leaves apps.name null for
    // every type post-migration; passing it would just write it straight to the
    // raw apps.name column via this seed helper, defeating the point of the test.
    const workflowApp = await createApplication(app, {
      user: { ...admin.user, organizationId: admin.workspace.id } as any,
      type: 'workflow',
    });
    const version = await createApplicationVersion(app, workflowApp as any);
    // createApplicationVersion leaves status null (no DB default) -- overlayAppMetadata's
    // canonical-row lookup requires status=DRAFT, matching the real create() flow's v1.
    await updateEntity(AppVersion, version.id, {
      status: AppVersionStatus.DRAFT,
      appName: 'Overlaid Workflow Name',
      slug: 'overlaid-workflow-slug',
      icon: 'overlaid-icon.svg',
      isPublic: true,
    });

    // Raw row as read straight off `apps` — placeholder/null metadata, matching what
    // every non-overlaid read path sees post-migration (Task 1's backfill zeroes these).
    const rawApp = await getDefaultDataSource().getRepository(App).findOne({ where: { id: workflowApp.id } });
    expect(rawApp.name).toBeNull();

    await appsUtilService.overlayAppMetadata(rawApp);

    expect(rawApp.name).toBe('Overlaid Workflow Name');
    expect(rawApp.slug).toBe('overlaid-workflow-slug');
    expect(rawApp.icon).toBe('overlaid-icon.svg');
    expect(rawApp.isPublic).toBe(true);
  });
});
