import { INestApplication } from '@nestjs/common';
import { VersionRepository } from '@modules/versions/repository';
import { AppVersion } from '@entities/app_version.entity';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, createApplication, createApplicationVersion } from 'test-helper';
import { updateEntity } from 'test-helper';

/** @group platform */
describe('VersionRepository — workflow metadata overlay (post-migration)', () => {
  let app: INestApplication;
  let versionRepository: VersionRepository;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    versionRepository = app.get(VersionRepository);
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('findAppFromVersion should overlay version metadata onto a workflow app', async () => {
    const admin = await createAdmin(app, 'version-repo-overlay-1@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;
    const workflow = await createApplication(app, { name: 'Version Repo Overlay', user: orgUser, type: 'workflow' });
    const version = await createApplicationVersion(app, workflow as any);
    await updateEntity(AppVersion, version.id, { slug: 'version-repo-overlay-slug', appName: 'Overlay Name' });

    const resolvedApp = await versionRepository.findAppFromVersion(version.id, admin.workspace.id);
    expect(resolvedApp).toMatchObject({ slug: 'version-repo-overlay-slug', name: 'Overlay Name' });
  });

  it('getAppVersionById should overlay version metadata onto a workflow app', async () => {
    const admin = await createAdmin(app, 'version-repo-overlay-2@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;
    const workflow = await createApplication(app, { name: 'Version Repo Overlay 2', user: orgUser, type: 'workflow' });
    const version = await createApplicationVersion(app, workflow as any);
    await updateEntity(AppVersion, version.id, { slug: 'get-app-version-by-id-slug', appName: 'Overlay Name 2' });

    const result = await versionRepository.getAppVersionById(version.id);
    expect(result.app).toMatchObject({ slug: 'get-app-version-by-id-slug', name: 'Overlay Name 2' });
  });
});
