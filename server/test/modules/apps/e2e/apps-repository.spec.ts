/**
 * @group platform
 */
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  updateEntity,
} from 'test-helper';
import { INestApplication } from '@nestjs/common';
import { AppsRepository } from '@modules/apps/repository';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';

// initTestApp() can exceed 60s when Jest restarts the worker to free memory
jest.setTimeout(120_000);

describe('AppsRepository', () => {
  describe('EE (plan: enterprise)', () => {
    let nestApp: INestApplication;
    let appsRepository: AppsRepository;
    let app: App;
    let version: AppVersion;
    const versionSlug = 'release-regression-slug';

    beforeAll(async () => {
      ({ app: nestApp } = await initTestApp());
      appsRepository = nestApp.get<AppsRepository>(AppsRepository);

      const admin = await createAdmin(nestApp, 'apps-repo-admin@tooljet.io');
      app = await createApplication(nestApp, { name: 'release-regression-app', user: admin.user });
      version = await createApplicationVersion(nestApp, app as App & { organizationId: string });
      // Slug resolution is keyed on app_versions.slug; the factory leaves it null.
      await updateEntity(AppVersion, version.id, { slug: versionSlug });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(nestApp);
    }, 60000);

    describe('findByIdOrSlug()', () => {
      // Regression: the slug path resolved the app through an `av.app` join that
      // never loaded the `appVersions` collection, so consumers reading
      // `app.appVersions` (e.g. external-api autoDeployApp) broke on slug input.
      it('should load appVersions when resolved by slug', async () => {
        const result = await appsRepository.findByIdOrSlug(versionSlug);

        expect(result).not.toBeNull();
        expect(result!.id).toBe(app.id);
        expect(Array.isArray(result!.appVersions)).toBe(true);
        expect(result!.appVersions.map((v) => v.id)).toContain(version.id);
      });

      it('should load appVersions when resolved by UUID', async () => {
        const result = await appsRepository.findByIdOrSlug(app.id);

        expect(result).not.toBeNull();
        expect(result!.id).toBe(app.id);
        expect(Array.isArray(result!.appVersions)).toBe(true);
        expect(result!.appVersions.map((v) => v.id)).toContain(version.id);
      });

      it('should return null for an unknown slug', async () => {
        const result = await appsRepository.findByIdOrSlug('does-not-exist-slug');

        expect(result).toBeNull();
      });
    });
  });
});
