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
import { AppVersion, AppVersionStatus, AppVersionType } from 'src/entities/app_version.entity';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { App } from 'src/entities/app.entity';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import { OrganizationGitHttps } from 'src/entities/gitsync_entities/organization_git_https.entity';
import { WorkspaceBranch } from 'src/entities/workspace_branch.entity';
import { SourceControlProviderService } from '@ee/app-git/source-control-provider';
import { Repository } from 'typeorm';

/**
 * External API — the "promote to next version" hook (VersionsUtilService.handleDefaultBranchPublish)
 *
 * Fired by both POST /ext/apps/:appIdOrSlug/versions/save and
 * POST /ext/apps/:appIdOrSlug/git-sync/release whenever a default-branch,
 * VERSION-type row transitions from a non-PUBLISHED status to PUBLISHED:
 * seeds a fresh DRAFT on the same branch and detaches branch_id from the
 * just-published row.
 *
 * Every other spec in this suite seeds versions via createApplicationVersion,
 * which never sets branchId — so the hook's `if (!appVersion.branchId) return`
 * guard silently no-ops everywhere else. This file is the only place these
 * effects are exercised.
 *
 * Tested cases:
 *   - Hook fires via save: new DRAFT seeded, old row's branchId nulled
 *   - Guard: non-default branch — no new draft seeded
 *   - Guard: no default branch configured — no new draft seeded
 *   - Guard: branchId null (today's implicit default elsewhere) — no new draft seeded
 *   - Full lifecycle chain: save -> release -> push (see Task 2)
 */

/** @group platform */
describe('External API — promote to next version (handleDefaultBranchPublish)', () => {
  let AUTH_HEADER: string;
  let nestApp: INestApplication;
  let versionRepo: Repository<AppVersion>;
  let envRepo: Repository<AppEnvironment>;

  beforeAll(async () => {
    process.env.ENABLE_EXTERNAL_API = 'true';
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise', freshApp: true }));

    const configService = nestApp.get<ConfigService>(ConfigService);
    AUTH_HEADER = `Basic ${configService.get('EXTERNAL_API_ACCESS_TOKEN')}`;

    const ds = getDefaultDataSource();
    versionRepo = ds.getRepository(AppVersion);
    envRepo = ds.getRepository(AppEnvironment);
  });

  afterEach(async () => {
    // restoreAllMocks (not resetAllMocks): resetAllMocks clears a spy's mock
    // implementation but leaves it a bare mock resolving undefined instead of
    // restoring the real method — a spy from one test would otherwise
    // silently poison any later test appended to this file.
    jest.restoreAllMocks();
    await resetDB();
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Seeds an admin + org with a minimal, real git config so findOrgGit/
   *  getSourceControlService resolve without hitting a real remote. */
  async function seedOrgWithGit() {
    const { user, organization } = await createUser(nestApp, {
      email: `admin+${Date.now()}@tooljet.io`,
      groups: ['admin'],
    });
    const orgGitSync = await saveEntity(OrganizationGitSync, {
      organizationId: organization.id,
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
    return { user, organization };
  }

  async function seedDefaultBranch(organizationId: string, name = 'main') {
    return saveEntity(WorkspaceBranch, { organizationId, name, isDefault: true });
  }

  async function seedApp(user: any) {
    return createApplication(nestApp, { user, name: `App-${Date.now()}`, isPublic: false });
  }

  /** Creates a VERSION-type DRAFT pinned to `branchId`, satisfying
   *  chk_app_versions_branch_metadata (appName/slug required once branchId is set). */
  async function seedDefaultBranchDraft(
    app: App & { organizationId: string },
    branchId: string,
    name = 'v1'
  ): Promise<AppVersion> {
    const version = await createApplicationVersion(nestApp, app, { name });
    await versionRepo.update(version.id, {
      status: AppVersionStatus.DRAFT,
      branchId,
      appName: app.name,
      slug: `${app.name}-${version.id}`,
    });
    return versionRepo.findOne({ where: { id: version.id } });
  }

  // ---------------------------------------------------------------------------
  // Hook fires via save
  // ---------------------------------------------------------------------------

  describe('fires via save', () => {
    it('seeds a new DRAFT on the default branch and detaches branchId from the published row', async () => {
      const { user, organization } = await seedOrgWithGit();
      const branch = await seedDefaultBranch(organization.id);
      const app = await seedApp(user);
      const draft = await seedDefaultBranchDraft(app as any, branch.id, 'v1');

      const devEnv = await envRepo.findOne({
        where: { organizationId: organization.id },
        order: { priority: 'ASC' },
      });

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(201);

      const published = await versionRepo.findOne({ where: { id: draft.id } });
      expect(published.status).toBe(AppVersionStatus.PUBLISHED);
      expect(published.branchId).toBeNull();

      const newDraft = await versionRepo.findOne({
        where: { appId: app.id, branchId: branch.id },
      });
      expect(newDraft).toBeDefined();
      expect(newDraft.id).not.toBe(draft.id);
      expect(newDraft.status).toBe(AppVersionStatus.DRAFT);
      expect(newDraft.versionType).toBe(AppVersionType.VERSION);
      expect(newDraft.name).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(newDraft.parentVersionId).toBe(draft.id);
      expect(newDraft.co_relation_id).toBe(published.co_relation_id);
      expect(newDraft.currentEnvironmentId).toBe(devEnv.id);
      expect(newDraft.appName).toBe(published.appName);
      expect(newDraft.slug).toBe(published.slug);
      expect(newDraft.homePageId).toBeTruthy();
      expect(newDraft.homePageId).not.toBe(published.homePageId);
    });
  });

  // ---------------------------------------------------------------------------
  // No-op guards
  // ---------------------------------------------------------------------------

  describe('no-op guards', () => {
    it('publishes the version and detaches branchId, but does not seed a new draft, when the version is on a non-default branch', async () => {
      const { user, organization } = await seedOrgWithGit();
      await seedDefaultBranch(organization.id, 'main');
      const featureBranch = await saveEntity(WorkspaceBranch, {
        organizationId: organization.id,
        name: 'feature-x',
        isDefault: false,
      });
      const app = await seedApp(user);
      const draft = await seedDefaultBranchDraft(app as any, featureBranch.id, 'v1');

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(201);

      const versions = await versionRepo.find({ where: { appId: app.id } });
      expect(versions).toHaveLength(1);
      expect(versions[0].id).toBe(draft.id);
      expect(versions[0].status).toBe(AppVersionStatus.PUBLISHED);
      expect(versions[0].branchId).toBeNull();
    });

    it('publishes the version and detaches branchId, but does not seed a new draft, when the org has no default branch', async () => {
      const { user, organization } = await seedOrgWithGit();
      const nonDefaultBranch = await saveEntity(WorkspaceBranch, {
        organizationId: organization.id,
        name: 'main',
        isDefault: false,
      });
      const app = await seedApp(user);
      const draft = await seedDefaultBranchDraft(app as any, nonDefaultBranch.id, 'v1');

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(201);

      const versions = await versionRepo.find({ where: { appId: app.id } });
      expect(versions).toHaveLength(1);
      expect(versions[0].id).toBe(draft.id);
      expect(versions[0].status).toBe(AppVersionStatus.PUBLISHED);
      expect(versions[0].branchId).toBeNull();
    });

    it('does not seed a new draft when the version has no branchId', async () => {
      const { user } = await seedOrgWithGit();
      const app = await seedApp(user);
      const draft = await createApplicationVersion(nestApp, app as any, { name: 'v1' });
      await versionRepo.update(draft.id, { status: AppVersionStatus.DRAFT });

      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(201);

      const versions = await versionRepo.find({ where: { appId: app.id } });
      expect(versions).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Full lifecycle: save -> release -> push
  // ---------------------------------------------------------------------------

  describe('full lifecycle', () => {
    // Release can never itself be the DRAFT -> PUBLISHED transition that fires
    // this hook: autoDeployApp rejects DRAFT targets outright, and any version
    // that's already PUBLISHED has status === PUBLISHED before the write, so
    // the hook's pre-check (`status !== PUBLISHED`) is false. Only save can
    // trigger it. This chain proves the realistic sequence: save publishes +
    // seeds the next draft, release promotes that published version to prod,
    // push pushes its commit — closing the "save then release" claim that
    // used to be a stale comment in save-version.e2e-spec.ts.
    it('chains save -> release -> push through a full git-sync lifecycle', async () => {
      const { user, organization } = await seedOrgWithGit();
      const branch = await seedDefaultBranch(organization.id);
      const app = await seedApp(user);
      const draft = await seedDefaultBranchDraft(app as any, branch.id, 'v1');

      const devEnv = await envRepo.findOne({
        where: { organizationId: organization.id },
        order: { priority: 'ASC' },
      });
      const prodEnv = await envRepo.findOne({
        where: { organizationId: organization.id },
        order: { priority: 'DESC' },
      });

      const scProvider = nestApp.get(SourceControlProviderService);
      const mockStrategy = {
        createGitTag: jest.fn().mockResolvedValue({ success: true, tagName: 'co_rel/v1' }),
        gitPushApp: jest.fn().mockResolvedValue({ success: true }),
      };
      jest.spyOn(scProvider, 'getSourceControlService').mockResolvedValue(mockStrategy as any);

      // Step 1: save
      const saveRes = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/save`)
        .set('Authorization', AUTH_HEADER)
        .send({})
        .expect(201);

      expect(saveRes.body.status).toBe(AppVersionStatus.PUBLISHED);
      expect(saveRes.body.currentEnvironmentId).toBe(devEnv.id);

      const newDraft = await versionRepo.findOne({ where: { appId: app.id, branchId: branch.id } });
      expect(newDraft).toBeDefined();
      expect(newDraft.status).toBe(AppVersionStatus.DRAFT);

      // Step 2: release the just-published version to prod
      const releaseRes = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/git-sync/release`)
        .set('Authorization', AUTH_HEADER)
        .send({ versionId: draft.id })
        .expect(201);

      expect(releaseRes.body.currentVersionId).toBe(draft.id);
      const releasedVersion = await versionRepo.findOne({ where: { id: draft.id } });
      expect(releasedVersion.currentEnvironmentId).toBe(prodEnv.id);
      // Still detached from the save step — release does not re-fire the hook
      // (the version was already PUBLISHED going into the release call).
      expect(releasedVersion.branchId).toBeNull();

      // Step 3: push the released version's commit
      await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/versions/${draft.id}/git-sync/push`)
        .set('Authorization', AUTH_HEADER)
        .send({ commitMessage: 'release v1' })
        .expect(201);

      expect(mockStrategy.gitPushApp).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: organization.id }),
        app.id,
        expect.objectContaining({
          lastCommitMessage: 'release v1',
          versionId: draft.id,
          gitAppName: app.name,
          gitVersionName: releasedVersion.name,
        }),
        expect.objectContaining({ id: draft.id })
      );
    });
  });
});
