/**
 * @group platform
 */

/**
 * Shared version behavior (validation, promote targets, release gate, list filters) is covered in
 * app-versions-v2; this file covers what differs for modules.
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import {
  createUser,
  initTestApp,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  getDefaultDataSource,
  findEntityOrFail,
  saveEntity,
} from 'test-helper';
import { APP_TYPES } from '@modules/apps/constants';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { Page } from '@entities/page.entity';
import { Component } from '@entities/component.entity';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

function base(workspaceId: string, moduleId: string) {
  return `/api/v2/ext/workspaces/${workspaceId}/modules/${moduleId}/versions`;
}

describe('ExternalApisModuleVersionsControllerV2 (EE enterprise)', () => {
  let app: INestApplication;
  let versionRepo: Repository<AppVersion>;
  let envRepo: Repository<AppEnvironment>;
  let appRepo: Repository<App>;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
    const ds = getDefaultDataSource();
    versionRepo = ds.getRepository(AppVersion);
    envRepo = ds.getRepository(AppEnvironment);
    appRepo = ds.getRepository(App);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  async function seedWorkspace(tag: string) {
    const { user } = await createUser(app, { email: `mvv2-${tag}-${Date.now()}@tooljet.io` });
    const module = await createApplication(app, {
      name: `Module ${tag} ${Date.now()}`,
      user,
      type: APP_TYPES.MODULE,
    });
    const production = await envRepo.findOneOrFail({
      where: { organizationId: user.organizationId, isDefault: true },
    });
    return { user, orgId: user.organizationId, module, production };
  }

  async function seedVersion(resource: App, status: AppVersionStatus): Promise<AppVersion> {
    const version = await createApplicationVersion(app, resource as App & { organizationId: string }, { name: 'v' });
    await versionRepo.update(version.id, { status });
    return versionRepo.findOneOrFail({ where: { id: version.id } });
  }

  async function pinModuleVersion(consumerVersionId: string, module: App, moduleVersionId: string) {
    const homePage = await findEntityOrFail(Page, { appVersionId: consumerVersionId } as Partial<Page>);
    await saveEntity(Component, {
      name: 'module1',
      type: 'ModuleViewer',
      pageId: homePage.id,
      properties: {
        moduleAppId: { value: module.co_relation_id },
        moduleVersionId: { value: moduleVersionId },
      },
      general: {},
      styles: {},
      generalStyles: {},
      validation: {},
    } as unknown as Component);
  }

  it('should take a module version from a new draft through save, promote and release', async () => {
    const { orgId, module, production } = await seedWorkspace('lifecycle');
    const source = await seedVersion(module, AppVersionStatus.PUBLISHED);

    const created = await request(app.getHttpServer())
      .post(base(orgId, module.id))
      .set('Authorization', getExtAuth())
      .send({ name: 'v2.0.0', version_from_id: source.id })
      .expect(201);
    expect(created.body).toMatchObject({ status: 'draft', parent_version_id: source.id });
    const createdRow = await versionRepo.findOneOrFail({ where: { id: created.body.id } });
    expect(createdRow.moduleReferenceId).toEqual(expect.any(String));

    const versionPath = `${base(orgId, module.id)}/${created.body.id}`;
    await request(app.getHttpServer()).post(`${versionPath}/save`).set('Authorization', getExtAuth()).expect(200);
    await request(app.getHttpServer())
      .post(`${versionPath}/promote`)
      .set('Authorization', getExtAuth())
      .send({ target_environment_id: production.id })
      .expect(200);
    const released = await request(app.getHttpServer())
      .post(`${versionPath}/release`)
      .set('Authorization', getExtAuth())
      .expect(200);

    expect(released.body).toMatchObject({ status: 'released', environment_id: production.id });
    const releasedModule = await appRepo.findOneOrFail({ where: { id: module.id } });
    expect(releasedModule.currentVersionId).toBe(created.body.id);
  });

  it('should save a module even when it embeds another module that is still a draft', async () => {
    const { user, orgId, module } = await seedWorkspace('nested');
    const draft = await seedVersion(module, AppVersionStatus.DRAFT);
    const nested = await createApplication(app, { name: `Nested ${Date.now()}`, user, type: APP_TYPES.MODULE });
    const nestedDraft = await seedVersion(nested, AppVersionStatus.DRAFT);
    await pinModuleVersion(draft.id, nested, nestedDraft.id);

    const res = await request(app.getHttpServer())
      .post(`${base(orgId, module.id)}/${draft.id}/save`)
      .set('Authorization', getExtAuth())
      .expect(200);
    expect(res.body).toMatchObject({ status: 'published' });
  });

  it('should only list and resolve module versions on the default branch', async () => {
    const { orgId, module } = await seedWorkspace('branch');
    const onDefault = await seedVersion(module, AppVersionStatus.PUBLISHED);
    const onFeature = await seedVersion(module, AppVersionStatus.PUBLISHED);
    const feature = await saveEntity(WorkspaceBranch, {
      organizationId: orgId,
      name: `feature-${Date.now()}`,
      isDefault: false,
    } as Partial<WorkspaceBranch>);
    await versionRepo.update(onFeature.id, { branchId: feature.id });

    const list = await request(app.getHttpServer())
      .get(base(orgId, module.id))
      .set('Authorization', getExtAuth())
      .expect(200);
    expect(list.body.data.map((v) => v.id)).toEqual([onDefault.id]);

    await request(app.getHttpServer())
      .get(`${base(orgId, module.id)}/${onFeature.id}`)
      .set('Authorization', getExtAuth())
      .expect(404);
  });

  it('should refuse to delete a module version an app still uses', async () => {
    const { user, orgId, module } = await seedWorkspace('in-use');
    const pinned = await seedVersion(module, AppVersionStatus.PUBLISHED);
    const unpinned = await seedVersion(module, AppVersionStatus.PUBLISHED);
    const consumer = await createApplication(app, { name: `Consumer ${Date.now()}`, user });
    const consumerVersion = await seedVersion(consumer, AppVersionStatus.DRAFT);
    await pinModuleVersion(consumerVersion.id, module, pinned.id);

    const res = await request(app.getHttpServer())
      .delete(`${base(orgId, module.id)}/${pinned.id}`)
      .set('Authorization', getExtAuth())
      .expect(409);
    expect(res.body.message).toContain('Cannot delete this version.');

    await request(app.getHttpServer())
      .delete(`${base(orgId, module.id)}/${unpinned.id}`)
      .set('Authorization', getExtAuth())
      .expect(204);
    expect(await versionRepo.findOne({ where: { id: pinned.id } })).not.toBeNull();
  });

  it('should keep the last version of a module', async () => {
    const { orgId, module } = await seedWorkspace('last');
    const only = await seedVersion(module, AppVersionStatus.DRAFT);

    const res = await request(app.getHttpServer())
      .delete(`${base(orgId, module.id)}/${only.id}`)
      .set('Authorization', getExtAuth())
      .expect(409);
    expect(res.body.message).toBe('Cannot delete only version of module');
  });

  it('should not address a module through the app routes, or an app through the module routes', async () => {
    const { user, orgId, module } = await seedWorkspace('cross-type');
    const moduleVersion = await seedVersion(module, AppVersionStatus.DRAFT);
    const frontEnd = await createApplication(app, { name: `Front end ${Date.now()}`, user });

    await request(app.getHttpServer())
      .get(`/api/v2/ext/workspaces/${orgId}/apps/${module.id}/versions/${moduleVersion.id}`)
      .set('Authorization', getExtAuth())
      .expect(404);
    await request(app.getHttpServer()).get(base(orgId, frontEnd.id)).set('Authorization', getExtAuth()).expect(404);
  });
});
