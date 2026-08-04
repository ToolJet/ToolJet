/**
 * @group platform
 */
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  saveEntity,
  createApplication,
  createApplicationVersion,
  updateEntity,
} from 'test-helper';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import { OrganizationGitHttps } from 'src/entities/gitsync_entities/organization_git_https.entity';
import { WorkspaceBranch } from 'src/entities/workspace_branch.entity';
import { App } from 'src/entities/app.entity';
import { AppVersion, AppVersionType } from 'src/entities/app_version.entity';
import { SourceControlProviderService } from '@ee/app-git/source-control-provider';

// initTestApp() can exceed 60s when Jest restarts the worker to free memory
jest.setTimeout(120_000);

describe('ExternalApisAppsController - git pull', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let authHeader: string;
    let organizationId: string;
    let admin: Awaited<ReturnType<typeof createAdmin>>;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      authHeader = `Basic ${app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN')}`;

      admin = await createAdmin(app, 'ext-git-pull-admin@tooljet.io');
      organizationId = admin.workspace.id;

      // Minimal git config so findOrgGit/getSourceControlService resolve to the
      // HTTPS strategy. The branch-existence guard under test fires on DB lookups
      // only (before any clone), so these credentials are never dereferenced.
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
        isEnabled: true,
        isFinalized: true,
      });
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60000);

    describe('POST /api/ext/apps?createMode=git | branch-existence guard', () => {
      // Regression: pulling a new app via gitBranchName with no matching
      // WorkspaceBranch used to silently fall back to the org's default branch —
      // attaching content cloned from gitBranchName to a branch_id whose own git
      // history never recorded it. The next workspace-wide pull on the default
      // branch then deleted the app as "orphaned" (removeOrphanedResources).
      it('should return 400 when gitBranchName does not match an existing WorkspaceBranch', async () => {
        const res = await request
          .agent(app.getHttpServer())
          .post('/api/ext/apps?createMode=git')
          .set('Authorization', authHeader)
          .send({
            organizationId,
            gitAppName: 'ext-pull-guard-app',
            gitBranchName: 'feature-branch-that-does-not-exist',
          });

        expect(res.status).toBe(400);
        expect(res.body?.message).toContain(
          'Branch "feature-branch-that-does-not-exist" does not exist in this workspace'
        );
      });

      it('should return 403 when the authorization header is missing', async () => {
        const res = await request
          .agent(app.getHttpServer())
          .post('/api/ext/apps?createMode=git')
          .send({
            organizationId,
            gitAppName: 'ext-pull-guard-app',
            gitBranchName: 'feature-branch-that-does-not-exist',
          });

        expect(res.status).toBe(403);
      });
    });

    describe('PUT /api/ext/apps/:appId?createMode=git | branch-aware pull', () => {
      afterEach(() => {
        jest.restoreAllMocks();
      });

      // Regression: pullChangesIntoExistingApp never populated gitBranchName/
      // currentVersionId, so AppGitOperationsUtil.pullGitAppChanges's branching-aware
      // path (isBranchingEnabled && gitBranchName) never triggered — every pull fell
      // to the legacy path, which clones the org's *default* branch regardless of
      // which branch the app actually lives on.
      it('should resolve gitBranchName/currentVersionId from the app\'s own branch, not the org default', async () => {
        const featureBranch = await saveEntity(WorkspaceBranch, {
          organizationId,
          name: 'feature-y',
          isDefault: false,
        });

        const appEntity = await createApplication(app, { name: 'ext-pull-existing-app', user: admin.user });
        const version = await createApplicationVersion(app, appEntity as App & { organizationId: string });
        await updateEntity(AppVersion, version.id, {
          versionType: AppVersionType.BRANCH,
          branchId: featureBranch.id,
          isStub: false,
          // chk_app_versions_branch_metadata requires app_name + slug NOT NULL when branch_id is set.
          appName: 'ext-pull-existing-app',
          slug: `ext-pull-existing-app-${version.id}`,
        });

        const scProvider = app.get(SourceControlProviderService);
        jest.spyOn(scProvider, 'findOrgGit').mockResolvedValue({ isBranchingEnabled: true } as any);
        const mockStrategy = { pullGitAppChanges: jest.fn().mockResolvedValue({ id: appEntity.id }) };
        jest.spyOn(scProvider, 'getSourceControlService').mockResolvedValue(mockStrategy as any);

        const res = await request
          .agent(app.getHttpServer())
          .put(`/api/ext/apps/${appEntity.id}?createMode=git`)
          .set('Authorization', authHeader);

        expect(res.status).toBe(200);
        expect(mockStrategy.pullGitAppChanges).toHaveBeenCalledWith(
          expect.objectContaining({ id: expect.any(String) }),
          expect.objectContaining({
            gitBranchName: 'feature-y',
            currentVersionId: version.id,
          }),
          appEntity.id
        );
      });
    });
  });
});
