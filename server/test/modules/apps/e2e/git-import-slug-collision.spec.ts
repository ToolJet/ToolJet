import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  initTestApp,
  closeTestApp,
  createUser,
  createApplication,
  createApplicationVersion,
  findEntityOrFail,
  updateEntity,
  getDefaultDataSource,
} from 'test-helper';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionType } from '@entities/app_version.entity';
import { User } from '@entities/user.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { AppImportExportService } from '@modules/apps/services/app-import-export.service';

/**
 * Importing an app from git creates a NEW App row, and the slug carried in the git
 * app.json is checked against the instance-wide, type-scoped slug triggers
 * (enforce_app_versions_slug_branch_unique / enforce_app_versions_default_branch_slug_unique),
 * which look at every branch of every workspace.
 *
 * The import's slug pre-flight used to scope git imports to default-branch rows only. A slug
 * another app held only on a feature branch (e.g. an app in another workspace on the same
 * instance, pushed from a feature branch) slipped past it, and the INSERT failed with
 * `app_versions_slug_branch_id_unique`. The pre-flight now matches the triggers, and a taken
 * slug falls back to the imported app's own id — the random-UUID placeholder pull also uses.
 */
/** @group platform */
describe('AppImportExportService.import | git import slug collision', () => {
  let nestApp: INestApplication;
  let service: AppImportExportService;

  let holderUser: User & { organizationId: string };
  let holderDefaultBranchId: string;
  let holderFeatureBranchId: string;

  let importerUser: User & { organizationId: string };
  let importerFeatureBranchId: string;

  async function seedBranches(organizationId: string): Promise<{ defaultId: string; featureId: string }> {
    const branchRepo = getDefaultDataSource().getRepository(WorkspaceBranch);
    const defaultBranch =
      (await branchRepo.findOne({ where: { organizationId, isDefault: true } })) ??
      (await branchRepo.save(branchRepo.create({ organizationId, name: 'main', isDefault: true })));
    const featureBranch = await branchRepo.save(
      branchRepo.create({ organizationId, name: `feature-${uuidv4()}`, isDefault: false })
    );
    return { defaultId: defaultBranch.id, featureId: featureBranch.id };
  }

  // An app in the holder workspace whose only version row owns `slug` on `branchId`.
  async function seedSlugHolder(slug: string, branchId: string, versionType: AppVersionType): Promise<App> {
    const app = await createApplication(nestApp, { name: `holder-${uuidv4()}`, user: holderUser });
    const version = await createApplicationVersion(nestApp, app as App & { organizationId: string });
    await updateEntity(AppVersion, version.id, { branchId, versionType, slug });
    return app;
  }

  // Simulates the app.json read from git: a real export whose slug is the one in the repo.
  async function gitPayloadWithSlug(slug: string): Promise<App> {
    const source = await createApplication(nestApp, { name: `source-${uuidv4()}`, user: holderUser });
    await createApplicationVersion(nestApp, source as App & { organizationId: string });
    const { appV2 } = await service.export(holderUser, source.id);
    return { ...appV2, slug } as App;
  }

  async function importFromGit(payload: App, branchId: string): Promise<AppVersion> {
    const { newApp } = await service.import(
      importerUser,
      payload,
      `git-import-${uuidv4()}`,
      {},
      true, // isGitApp
      '',
      false,
      undefined,
      branchId
    );
    return findEntityOrFail(AppVersion, { appId: newApp.id } as any);
  }

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
    service = nestApp.get(AppImportExportService);

    ({ user: holderUser } = await createUser(nestApp, {
      email: 'slug-holder@tooljet.com',
      organizationName: 'Slug holder WS',
    }));
    ({ defaultId: holderDefaultBranchId, featureId: holderFeatureBranchId } = await seedBranches(
      holderUser.organizationId
    ));

    ({ user: importerUser } = await createUser(nestApp, {
      email: 'git-importer@tooljet.com',
      organizationName: 'Git importer WS',
    }));
    ({ featureId: importerFeatureBranchId } = await seedBranches(importerUser.organizationId));
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  it('should fall back to the imported app id when another app holds the slug only on a feature branch', async () => {
    const slug = `orders-${uuidv4()}`;
    await seedSlugHolder(slug, holderFeatureBranchId, AppVersionType.BRANCH);

    const imported = await importFromGit(await gitPayloadWithSlug(slug), importerFeatureBranchId);

    expect(imported).toMatchObject({
      slug: imported.appId,
      branchId: importerFeatureBranchId,
      versionType: AppVersionType.BRANCH,
    });
  });

  it('should treat a slug differing only in case as taken', async () => {
    const slug = `Invoices-${uuidv4()}`;
    await seedSlugHolder(slug.toLowerCase(), holderFeatureBranchId, AppVersionType.BRANCH);

    const imported = await importFromGit(await gitPayloadWithSlug(slug), importerFeatureBranchId);

    expect(imported.slug).toBe(imported.appId);
  });

  it('should fall back to the imported app id when another app holds the slug on the default branch', async () => {
    const slug = `customers-${uuidv4()}`;
    await seedSlugHolder(slug, holderDefaultBranchId, AppVersionType.VERSION);

    const imported = await importFromGit(await gitPayloadWithSlug(slug), importerFeatureBranchId);

    expect(imported.slug).toBe(imported.appId);
  });

  it('should keep the git slug when no other app holds it', async () => {
    const slug = `free-${uuidv4()}`;

    const imported = await importFromGit(await gitPayloadWithSlug(slug), importerFeatureBranchId);

    expect(imported.slug).toBe(slug);
  });
});
