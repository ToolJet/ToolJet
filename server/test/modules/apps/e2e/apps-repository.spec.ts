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
  saveEntity,
} from 'test-helper';
import { INestApplication } from '@nestjs/common';
import { AppsRepository } from '@modules/apps/repository';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { WorkspaceBranch } from 'src/entities/workspace_branch.entity';

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

      it('should return null for an unknown UUID', async () => {
        const result = await appsRepository.findByIdOrSlug('00000000-0000-0000-0000-000000000000');

        expect(result).toBeNull();
      });
    });
  });

  // Regression: PR #16818 changed import to write apps.id as the default-branch
  // stub slug, so the real slug lives only on the feature-branch row. Both
  // findAppBySlug (PrivateAppAuthGuard) and findByIdOrSlug (external API) must
  // fall back to that row instead of returning null.
  describe('feature-branch slug resolution (PR #16818 regression)', () => {
    let nestApp: INestApplication;
    let appsRepository: AppsRepository;
    let testApp: App & { organizationId: string };
    let mainBranchId: string;
    let featBranchId: string;
    let orgId: string;
    const featureSlug = 'hydrated-feat-branch-slug';

    beforeAll(async () => {
      ({ app: nestApp } = await initTestApp());
      appsRepository = nestApp.get<AppsRepository>(AppsRepository);

      const admin = await createAdmin(nestApp, 'apps-repo-branch-slug@tooljet.io');
      orgId = admin.user.organizationId;
      testApp = await createApplication(nestApp, { name: 'branch-slug-test-app', user: admin.user }) as App & { organizationId: string };

      // Default branch — simulates a git-sync-enabled workspace.
      const mainBranch = await saveEntity(WorkspaceBranch, { organizationId: orgId, name: 'main', isDefault: true });
      mainBranchId = mainBranch.id;

      // Feature branch.
      const featBranch = await saveEntity(WorkspaceBranch, { organizationId: orgId, name: 'feature/test', isDefault: false });
      featBranchId = featBranch.id;

      // Default-branch version: slug = apps.id (PR #16818 stub placeholder).
      // chk_app_versions_branch_metadata requires app_name when branch_id is set.
      const mainVersion = await createApplicationVersion(nestApp, testApp);
      await updateEntity(AppVersion, mainVersion.id, { branchId: mainBranchId, slug: testApp.id, appName: 'branch-slug-test-app' });

      // Feature-branch version: holds the real canonical slug.
      const featVersion = await createApplicationVersion(nestApp, testApp);
      await updateEntity(AppVersion, featVersion.id, { branchId: featBranchId, slug: featureSlug, appName: 'branch-slug-test-app' });
    });

    afterAll(async () => {
      await closeTestApp(nestApp);
    }, 60000);

    it('findAppBySlug returns null for a feature-branch slug (cross-org safety)', async () => {
      // findAppBySlug is cross-workspace. Accepting feature-branch rows without
      // org context risks returning the wrong org's app when the same slug exists
      // in multiple orgs pulled from the same git source. The guard resolves this
      // via workspace-scoped findBySlug instead; findAppBySlug correctly returns
      // null so the guard can take over.
      const result = await appsRepository.findAppBySlug(featureSlug);
      expect(result).toBeNull();
    });

    it('findAppBySlug returns null for a completely unknown slug', async () => {
      const result = await appsRepository.findAppBySlug('completely-unknown-slug-xyz');
      expect(result).toBeNull();
    });

    it('findByIdOrSlug resolves via the feature-branch row when default-branch has a different slug', async () => {
      const result = await appsRepository.findByIdOrSlug(featureSlug);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(testApp.id);
    });

    // When both branches carry the same slug, findByIdOrSlug must resolve via the
    // default-branch row (the inner join with is_default=true wins). overlayMetadata
    // stamps app.name from the resolved AppVersion.appName, so setting distinct
    // appName values on each branch lets us verify which row was used.
    it('findByIdOrSlug prefers the default-branch row when both branches carry the same slug', async () => {
      const sharedSlug = 'shared-branch-slug';

      const admin = await createAdmin(nestApp, 'apps-repo-branch-pref@tooljet.io');
      const prefOrgId = admin.user.organizationId;
      const prefApp = await createApplication(nestApp, { name: 'branch-pref-app', user: admin.user }) as App & { organizationId: string };

      const mainBranch = await saveEntity(WorkspaceBranch, { organizationId: prefOrgId, name: 'main', isDefault: true });
      const featBranch = await saveEntity(WorkspaceBranch, { organizationId: prefOrgId, name: 'feat/pref', isDefault: false });

      const mainVer = await createApplicationVersion(nestApp, prefApp);
      await updateEntity(AppVersion, mainVer.id, {
        branchId: mainBranch.id,
        slug: sharedSlug,
        appName: 'from-default-branch',
      });

      const featVer = await createApplicationVersion(nestApp, prefApp);
      await updateEntity(AppVersion, featVer.id, {
        branchId: featBranch.id,
        slug: sharedSlug,
        appName: 'from-feature-branch',
      });

      const result = await appsRepository.findByIdOrSlug(sharedSlug);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(prefApp.id);
      // overlayMetadata sets app.name from the resolved AppVersion.appName.
      // If the default-branch row was used, name is 'from-default-branch'.
      expect(result!.name).toBe('from-default-branch');
    });

    it('findBySlug resolves a feature-branch slug when orgId and branchId are both provided', async () => {
      const result = await appsRepository.findBySlug(featureSlug, orgId, undefined, featBranchId);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(testApp.id);
    });

    it('findBySlug returns null for a feature-branch slug when branchId is absent (default-branch-only path)', async () => {
      // Slug lives only on the feature branch; without branchId the function
      // queries the default branch — nothing found.
      const result = await appsRepository.findBySlug(featureSlug, orgId, undefined, undefined);
      expect(result).toBeNull();
    });

    it('findBySlug returns null when the slug exists in a different org (cross-org isolation)', async () => {
      // The slug was created under testApp's org in beforeAll. Querying with a
      // different orgId must return null — no cross-org data leak.
      const otherAdmin = await createAdmin(nestApp, 'apps-repo-crossorg@tooljet.io');
      const result = await appsRepository.findBySlug(featureSlug, otherAdmin.user.organizationId, undefined, featBranchId);
      expect(result).toBeNull();
    });
  });

  describe('no-git-sync regression', () => {
    let nestApp: INestApplication;
    let appsRepository: AppsRepository;
    let branchlessApp: App & { organizationId: string };
    const branchlessSlug = 'branchless-custom-slug';

    beforeAll(async () => {
      ({ app: nestApp } = await initTestApp());
      appsRepository = nestApp.get<AppsRepository>(AppsRepository);

      // Workspace with no WorkspaceBranch rows — simulates git-sync OFF.
      const admin = await createAdmin(nestApp, 'apps-repo-nogitsync@tooljet.io');
      branchlessApp = await createApplication(nestApp, { name: 'no-gitsync-app', user: admin.user }) as App & { organizationId: string };
      const version = await createApplicationVersion(nestApp, branchlessApp);
      await updateEntity(AppVersion, version.id, { slug: branchlessSlug });
    });

    afterAll(async () => {
      await closeTestApp(nestApp);
    }, 60000);

    it('findBySlug resolves a branchless app by slug', async () => {
      const result = await appsRepository.findBySlug(branchlessSlug, branchlessApp.organizationId);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(branchlessApp.id);
    });

    it('findAppBySlug resolves a branchless app by slug', async () => {
      const result = await appsRepository.findAppBySlug(branchlessSlug);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(branchlessApp.id);
    });

    it('findByIdOrSlug resolves a branchless app by slug', async () => {
      const result = await appsRepository.findByIdOrSlug(branchlessSlug);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(branchlessApp.id);
    });

    it('findByIdOrSlug resolves a branchless app by UUID', async () => {
      const result = await appsRepository.findByIdOrSlug(branchlessApp.id);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(branchlessApp.id);
    });
  });
});
