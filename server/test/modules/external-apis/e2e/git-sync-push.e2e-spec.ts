import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  resetDB,
  initTestApp,
  closeTestApp,
  createUser,
  createApplication,
  createApplicationVersion,
  saveEntity,
  getDefaultDataSource,
} from 'test-helper';
import { AppVersion, AppVersionStatus } from 'src/entities/app_version.entity';
import { App } from 'src/entities/app.entity';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import { OrganizationGitHttps } from 'src/entities/gitsync_entities/organization_git_https.entity';
import { WorkspaceBranch } from 'src/entities/workspace_branch.entity';
import { SourceControlProviderService } from '@ee/app-git/source-control-provider';
import { AppsUtilService } from '@ee/apps/util.service';
import { Repository } from 'typeorm';

/**
 * External API — POST /ext/apps/:appId/versions/:versionId/git-sync/push
 *
 * Pushes a version's current commit to the configured remote. No slug
 * resolution on this route (unlike save/release) — appId is a UUID only.
 *
 * Tested cases:
 *   - Auth: missing header, wrong token
 *   - 400: versionId doesn't belong to appId, app cannot be resolved, no org
 *     git config, git configured but not enabled
 *   - 201 happy path: gitPushApp called with the expected payload, including
 *     the gitAppName / gitVersionName fallback chains
 */

/** @group platform */
describe('External API — POST /ext/apps/:appId/versions/:versionId/git-sync/push', () => {
  let AUTH_HEADER: string;
  let nestApp: INestApplication;
  let versionRepo: Repository<AppVersion>;

  beforeAll(async () => {
    process.env.ENABLE_EXTERNAL_API = 'true';
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise', freshApp: true }));

    const configService = nestApp.get<ConfigService>(ConfigService);
    AUTH_HEADER = `Basic ${configService.get('EXTERNAL_API_ACCESS_TOKEN')}`;

    versionRepo = getDefaultDataSource().getRepository(AppVersion);
  });

  afterEach(async () => {
    // resetAllMocks clears a spy's mock implementation but leaves it a bare
    // mock (resolving undefined) instead of restoring the real method — a
    // spy from one test would otherwise silently poison every later test.
    jest.restoreAllMocks();
    await resetDB();
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  async function seedOrg() {
    const { user, organization } = await createUser(nestApp, {
      email: `admin+${Date.now()}@tooljet.io`,
      groups: ['admin'],
    });
    return { user, organization };
  }

  async function seedApp(user: any) {
    return createApplication(nestApp, { user, name: `App-${Date.now()}`, isPublic: false });
  }

  async function seedPublishedVersion(
    app: App & { organizationId: string },
    name = 'v1'
  ): Promise<AppVersion> {
    const version = await createApplicationVersion(nestApp, app, { name });
    await versionRepo.update(version.id, { status: AppVersionStatus.PUBLISHED });
    return versionRepo.findOne({ where: { id: version.id } });
  }

  /** Seeds a minimal, real org git config. `isEnabled` controls the provider
   *  row's isEnabled flag, gating pushVersionToGit's "Git is not enabled" check. */
  async function seedOrgGit(organizationId: string, isEnabled = true) {
    const orgGitSync = await saveEntity(OrganizationGitSync, {
      organizationId,
      autoCommit: false,
      isBranchingEnabled: true,
    });
    await saveEntity(OrganizationGitHttps, {
      configId: orgGitSync.id,
      httpsUrl: 'https://github.com/tooljet-test/e2e-fixture',
      githubBranch: 'main',
      githubAppId: 'test-app-id',
      githubInstallationId: 'test-installation-id',
      githubPrivateKey: 'dummy-key-not-dereferenced-before-guard-fires',
      isEnabled,
      isFinalized: true,
    });
    return orgGitSync;
  }

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  describe('auth', () => {
    it('returns 403 when Authorization header is missing', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      const version = await seedPublishedVersion(app as any);

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/${version.id}/git-sync/push`)
        .send({ commitMessage: 'msg' })
        .expect(403);
    });

    it('returns 403 when Authorization header has wrong token', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      const version = await seedPublishedVersion(app as any);

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/${version.id}/git-sync/push`)
        .set('Authorization', 'Basic wrong-token')
        .send({ commitMessage: 'msg' })
        .expect(403);
    });
  });

  // ---------------------------------------------------------------------------
  // 400 — validation
  // ---------------------------------------------------------------------------

  describe('400 — validation', () => {
    it('returns 400 when versionId does not belong to appId', async () => {
      // Two separate orgs/users, not two apps under one user: the check under
      // test (service.ts's `version.appId != appId`) has no org relationship
      // requirement, and ensureAppEnvironments (seed.ts) isn't idempotent per
      // org — seeding a second app for the same user re-inserts that org's
      // environments and hits unique_organization_id_priority.
      const { user: userA } = await seedOrg();
      const { user: userB } = await seedOrg();
      const appA = await seedApp(userA);
      const appB = await seedApp(userB);
      const versionOnB = await seedPublishedVersion(appB as any);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${appA.id}/versions/${versionOnB.id}/git-sync/push`)
        .set('Authorization', AUTH_HEADER)
        .send({ commitMessage: 'msg' })
        .expect(400);

      expect(response.body.message).toContain('Wrong version Id');
    });

    it('returns 400 when the app cannot be resolved', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      const version = await seedPublishedVersion(app as any);

      const appsUtilService = nestApp.get(AppsUtilService);
      jest.spyOn(appsUtilService, 'findByAppId').mockResolvedValueOnce(null);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/${version.id}/git-sync/push`)
        .set('Authorization', AUTH_HEADER)
        .send({ commitMessage: 'msg' })
        .expect(400);

      expect(response.body.message).toContain('App not found');
    });

    it('returns 400 when the organization has no git configuration', async () => {
      const { user } = await seedOrg();
      const app = await seedApp(user);
      const version = await seedPublishedVersion(app as any);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/${version.id}/git-sync/push`)
        .set('Authorization', AUTH_HEADER)
        .send({ commitMessage: 'msg' })
        .expect(400);

      expect(response.body.message).toContain('No git configuration found');
    });

    it('returns 400 when git is configured but not enabled', async () => {
      const { user, organization } = await seedOrg();
      const app = await seedApp(user);
      const version = await seedPublishedVersion(app as any);
      await seedOrgGit(organization.id, false);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/${version.id}/git-sync/push`)
        .set('Authorization', AUTH_HEADER)
        .send({ commitMessage: 'msg' })
        .expect(400);

      expect(response.body.message).toBe('Git is not enabled');
    });
  });

  // ---------------------------------------------------------------------------
  // 201 — happy path
  // ---------------------------------------------------------------------------

  describe('201 — happy path', () => {
    it('pushes the version and calls gitPushApp with the expected payload', async () => {
      const { user, organization } = await seedOrg();
      const app = await seedApp(user);
      const version = await seedPublishedVersion(app as any, 'v1');
      await versionRepo.update(version.id, { appName: 'custom-app-name' });
      await seedOrgGit(organization.id);

      const scProvider = nestApp.get(SourceControlProviderService);
      const mockStrategy = { gitPushApp: jest.fn().mockResolvedValue({ success: true }) };
      jest.spyOn(scProvider, 'getSourceControlService').mockResolvedValue(mockStrategy as any);

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/${version.id}/git-sync/push`)
        .set('Authorization', AUTH_HEADER)
        .send({ commitMessage: 'release commit' })
        .expect(201);

      expect(mockStrategy.gitPushApp).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: organization.id }),
        app.id,
        expect.objectContaining({
          lastCommitMessage: 'release commit',
          versionId: version.id,
          gitAppName: 'custom-app-name',
          gitVersionName: version.name,
        }),
        expect.objectContaining({ id: version.id })
      );
    });

    it('falls back to app.name for gitAppName when the version has no appName', async () => {
      const { user, organization } = await seedOrg();
      const app = await seedApp(user);
      const version = await seedPublishedVersion(app as any, 'v1');
      await seedOrgGit(organization.id);

      const scProvider = nestApp.get(SourceControlProviderService);
      const mockStrategy = { gitPushApp: jest.fn().mockResolvedValue({ success: true }) };
      jest.spyOn(scProvider, 'getSourceControlService').mockResolvedValue(mockStrategy as any);

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/${version.id}/git-sync/push`)
        .set('Authorization', AUTH_HEADER)
        .send({ commitMessage: 'release commit' })
        .expect(201);

      expect(mockStrategy.gitPushApp).toHaveBeenCalledWith(
        expect.anything(),
        app.id,
        expect.objectContaining({ gitAppName: app.name }),
        expect.anything()
      );
    });

    it('uses the branch name for gitVersionName when the version is on a branch', async () => {
      const { user, organization } = await seedOrg();
      const app = await seedApp(user);
      // Not seedPublishedVersion: chk_app_versions_branched_implies_draft
      // requires branch_id IS NULL OR status = 'DRAFT' — a published,
      // branched version can't exist. pushVersionToGit doesn't gate on
      // status (unlike autoDeployApp), so a DRAFT version exercises the
      // same gitVersionName fallback with a realistic, constructable row.
      const version = await createApplicationVersion(nestApp, app as any, { name: 'v1' });
      const branch = await saveEntity(WorkspaceBranch, {
        organizationId: organization.id,
        name: 'feature-push',
        isDefault: false,
      });
      await versionRepo.update(version.id, {
        status: AppVersionStatus.DRAFT,
        branchId: branch.id,
        appName: 'app-name',
        slug: `app-name-${version.id}`,
      });
      await seedOrgGit(organization.id);

      const scProvider = nestApp.get(SourceControlProviderService);
      const mockStrategy = { gitPushApp: jest.fn().mockResolvedValue({ success: true }) };
      jest.spyOn(scProvider, 'getSourceControlService').mockResolvedValue(mockStrategy as any);

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/${version.id}/git-sync/push`)
        .set('Authorization', AUTH_HEADER)
        .send({ commitMessage: 'release commit' })
        .expect(201);

      expect(mockStrategy.gitPushApp).toHaveBeenCalledWith(
        expect.anything(),
        app.id,
        expect.objectContaining({ gitVersionName: 'feature-push' }),
        expect.anything()
      );
    });
  });
});
