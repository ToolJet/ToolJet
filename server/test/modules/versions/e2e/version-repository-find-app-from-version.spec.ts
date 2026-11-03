import { INestApplication } from '@nestjs/common';
import { VersionRepository } from '@modules/versions/repository';
import { initTestApp, closeTestApp, NONEXISTENT_UUID } from 'test-helper';
import { createAdmin, createApplication, createApplicationVersion } from 'test-helper';

/** @group platform */
describe('VersionRepository', () => {
  let app: INestApplication;
  let versionRepository: VersionRepository;

  beforeAll(async () => {
    ({ app } = await initTestApp());
    versionRepository = app.get(VersionRepository);
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  describe('findAppFromVersion()', () => {
    it('should resolve the app for a version in the same workspace', async () => {
      const admin = await createAdmin(app, 'find-app-from-version-own@tooljet.io');
      const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;
      const application = await createApplication(app, { name: 'Own Workspace App', user: orgUser });
      const version = await createApplicationVersion(app, application as any);

      const resolved = await versionRepository.findAppFromVersion(version.id, admin.workspace.id);

      expect(resolved).toMatchObject({ id: application.id });
    });

    it('should return null for a version that belongs to another workspace', async () => {
      const owner = await createAdmin(app, 'find-app-from-version-owner@tooljet.io');
      const stranger = await createAdmin(app, 'find-app-from-version-stranger@tooljet.io');
      const orgUser = { ...owner.user, organizationId: owner.workspace.id } as any;
      const application = await createApplication(app, { name: 'Other Workspace App', user: orgUser });
      const version = await createApplicationVersion(app, application as any);

      await expect(versionRepository.findAppFromVersion(version.id, stranger.workspace.id)).resolves.toBeNull();
    });

    it('should return null for a version id that does not exist', async () => {
      const admin = await createAdmin(app, 'find-app-from-version-missing@tooljet.io');

      await expect(versionRepository.findAppFromVersion(NONEXISTENT_UUID, admin.workspace.id)).resolves.toBeNull();
    });
  });
});
