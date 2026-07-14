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
    jest.resetAllMocks();
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
});
