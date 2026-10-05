import * as fs from 'fs';
import * as path from 'path';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { createUser, initTestApp, closeTestApp, saveEntity, findEntity, getEntityRepository } from 'test-helper';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { Page } from '@entities/page.entity';
import { Component } from '@entities/component.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { OrganizationGitHttps } from '@entities/gitsync_entities/organization_git_https.entity';
import { AppImportExportService } from '@ee/apps/services/app-import-export.service';
import { PlatformGitPullService } from '@ee/platform-git-sync/pull.service';
import { APP_TYPES } from '@modules/apps/constants';

/**
 * Regression: AppsService.getOne runs hydrateStaleReferencedModules on every open. For a
 * ModuleViewer pinned to a version that already exists locally, it still resolved the git
 * tag and re-imported it through hydrateStubApp, which cloned + imported and only then threw
 * `Version "v3" already exists locally` — on every refresh, per pinned module (~20s loads).
 * On a feature branch the same path appended a fresh BRANCH draft each refresh instead.
 */
/** @group platform */
describe('hydrateStaleReferencedModules — pinned module version already local', () => {
  let nestApp: INestApplication;
  let importService: AppImportExportService;
  let pullService: PlatformGitPullService;

  const appDef = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'common-app-1.json'), 'utf-8'));

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    importService = nestApp.get(AppImportExportService, { strict: false });
    pullService = nestApp.get(PlatformGitPullService, { strict: false });
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  afterEach(() => jest.restoreAllMocks());

  async function setup(onFeatureBranch: boolean) {
    const { organization: org, user } = await createUser(nestApp, {
      email: `mpro-${uuidv4().slice(0, 8)}@tooljet.io`,
      groups: ['all_users', 'admin'],
    });
    user.organizationId = org.id;

    const orgGitSync = await saveEntity(OrganizationGitSync, {
      organizationId: org.id,
      autoCommit: false,
      isBranchingEnabled: true,
    });
    await saveEntity(OrganizationGitHttps, {
      configId: orgGitSync.id,
      httpsUrl: 'https://github.com/tooljet-test/e2e-fixture',
      githubBranch: 'main',
      githubAppId: 'test-app-id',
      githubInstallationId: 'test-installation-id',
      githubPrivateKey: 'dummy-key-not-dereferenced-in-this-test',
      isEnabled: true,
      isFinalized: true,
    } as any);

    const branch: WorkspaceBranch = onFeatureBranch
      ? await saveEntity(WorkspaceBranch, {
          organizationId: org.id,
          name: `feat-${uuidv4().slice(0, 8)}`,
          isDefault: false,
        } as any)
      : await findEntity(WorkspaceBranch, { organizationId: org.id, isDefault: true });

    const definition = JSON.parse(JSON.stringify(appDef.app[0].definition));
    const imported = await importService.import(
      user,
      definition,
      'Pinned-consumer',
      {},
      false,
      appDef.tooljet_version ?? '3.0.0',
      false,
      undefined,
      branch.id
    );
    const parentApp = await findEntity(App, { id: imported.newApp.id });

    const moduleApp = await getEntityRepository(App).findOneOrFail({
      where: { organizationId: org.id, type: APP_TYPES.MODULE },
    });

    const viewer = await getEntityRepository(Component)
      .createQueryBuilder('c')
      .innerJoin(Page, 'p', 'p.id = c.page_id')
      .innerJoin(AppVersion, 'av', 'av.id = p.app_version_id')
      .where('av.app_id = :appId', { appId: parentApp.id })
      .andWhere("c.type = 'ModuleViewer'")
      .getOneOrFail();

    const pinTo = async (versionName: string) => {
      const props: any = viewer.properties;
      props.moduleAppId = { ...props.moduleAppId, value: moduleApp.co_relation_id };
      props.moduleVersionId = { ...props.moduleVersionId, versionName };
      await getEntityRepository(Component).update({ id: viewer.id }, { properties: props });
    };

    const moduleDraft = await findEntity(AppVersion, { appId: moduleApp.id, branchId: branch.id, isStub: false });
    const addLocalVersion = (fields: Partial<AppVersion>) =>
      saveEntity(AppVersion, {
        ...moduleDraft,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        moduleReferenceId: uuidv4(),
        ...fields,
      });

    const getRef = jest.fn().mockResolvedValue({ data: { object: { type: 'commit', sha: 'tag-commit-sha' } } });
    const svc = pullService as any;
    jest
      .spyOn(svc.organizationGitSyncRepository, 'findOrgGitByOrganizationId')
      .mockResolvedValue({ id: orgGitSync.id });
    jest
      .spyOn(svc.httpsGitSyncUtilService, 'resolveHttpsConfigs')
      .mockResolvedValue({ httpsUrl: 'https://github.com/o/r' });
    jest
      .spyOn(svc.httpsGitSyncUtilService, 'getAuthenticatedOctokitForInstallation')
      .mockResolvedValue({ octokit: { rest: { git: { getRef, getTag: jest.fn() } } } });
    jest.spyOn(svc.httpsGitSyncUtilService, 'parseDetailsFromUrl').mockResolvedValue({ owner: 'o', repo: 'r' });
    const hydrate = jest
      .spyOn(pullService, 'hydrateStubApp')
      .mockResolvedValue({ app: moduleApp, draftVersionId: null });

    return { user, branch, parentApp, moduleApp, pinTo, addLocalVersion, getRef, hydrate };
  }

  const tagHydrates = (hydrate: jest.SpyInstance) => hydrate.mock.calls.filter((args) => !!args[3]);

  it('skips the tag lookup and tag hydrate when the pinned version is already PUBLISHED locally', async () => {
    const { user, branch, parentApp, pinTo, addLocalVersion, getRef, hydrate } = await setup(false);
    await addLocalVersion({ name: 'v3', status: AppVersionStatus.PUBLISHED, versionType: AppVersionType.VERSION });
    await pinTo('v3');

    await pullService.hydrateStaleReferencedModules(parentApp, user, branch.id);

    expect(getRef).not.toHaveBeenCalled();
    expect(tagHydrates(hydrate)).toHaveLength(0);
  });

  it('skips the tag hydrate on a feature branch that already holds a draft sourced from the pinned tag', async () => {
    const { user, branch, parentApp, moduleApp, pinTo, getRef, hydrate } = await setup(true);
    await getEntityRepository(AppVersion).update(
      { appId: moduleApp.id, branchId: branch.id, isStub: false },
      { sourceTag: 'v3' }
    );
    await pinTo('v3');

    await pullService.hydrateStaleReferencedModules(parentApp, user, branch.id);

    expect(getRef).not.toHaveBeenCalled();
    expect(tagHydrates(hydrate)).toHaveLength(0);
  });

  it('still resolves and hydrates the tag when the pinned version is not local', async () => {
    const { user, branch, parentApp, pinTo, getRef, hydrate } = await setup(false);
    await pinTo('v9');

    await pullService.hydrateStaleReferencedModules(parentApp, user, branch.id);

    expect(getRef).toHaveBeenCalledWith(expect.objectContaining({ ref: expect.stringMatching(/\/v9$/) }));
    expect(tagHydrates(hydrate)).toHaveLength(1);
    expect(tagHydrates(hydrate)[0][4]).toBe('v9');
  });

  it('skips the in-pull tag hydrate when the pinned version is already PUBLISHED on the default branch', async () => {
    const { user, branch, moduleApp, addLocalVersion, hydrate } = await setup(false);
    await addLocalVersion({ name: 'v3', status: AppVersionStatus.PUBLISHED, versionType: AppVersionType.VERSION });
    const resolveTagToSha = jest
      .spyOn((pullService as any).gitOperationsUtil, 'resolveTagToSha')
      .mockResolvedValue('tag-commit-sha');

    await (pullService as any).hydrateModulePinnedVersion(
      user,
      moduleApp,
      moduleApp.co_relation_id,
      'v3',
      branch.id,
      branch.id,
      true,
      '/unused-repo-path',
      undefined,
      getEntityRepository(App).manager
    );

    expect(resolveTagToSha).not.toHaveBeenCalled();
    expect(tagHydrates(hydrate)).toHaveLength(0);
  });
});
