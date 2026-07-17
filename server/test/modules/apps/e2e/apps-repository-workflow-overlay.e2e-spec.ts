import { INestApplication } from '@nestjs/common';
import { AppsRepository } from '@modules/apps/repository';
import { AppVersion } from '@entities/app_version.entity';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, createApplication, createApplicationVersion } from 'test-helper';
import { updateEntity } from 'test-helper';
import { createWorkflowDataQuery } from 'test-helper';
import { getDefaultDataSource } from 'test-helper';
import { DataSource as DataSourceEntity } from '@entities/data_source.entity';

/** @group platform */
describe('AppsRepository — workflow metadata overlay (post-migration)', () => {
  let app: INestApplication;
  let appsRepository: AppsRepository;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    appsRepository = app.get(AppsRepository);
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  async function seedWorkflowWithVersionMetadata(orgUser: any, overrides: Record<string, any> = {}) {
    const workflow = await createApplication(app, { name: 'Overlay Workflow', user: orgUser, type: 'workflow' });
    const version = await createApplicationVersion(app, workflow as any);
    await updateEntity(AppVersion, version.id, {
      slug: overrides.slug ?? 'overlay-workflow-slug',
      appName: overrides.appName ?? 'Overlay Workflow Version Name',
      icon: overrides.icon ?? 'overlay-icon.svg',
      isPublic: overrides.isPublic ?? true,
    });
    return { workflow, version };
  }

  it('findOneById should overlay version metadata onto a workflow app', async () => {
    const admin = await createAdmin(app, 'overlay-admin-1@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;
    const { workflow } = await seedWorkflowWithVersionMetadata(orgUser);

    const resolved = await appsRepository.findOneById(workflow.id);
    expect(resolved).toMatchObject({
      name: 'Overlay Workflow Version Name',
      slug: 'overlay-workflow-slug',
      icon: 'overlay-icon.svg',
      isPublic: true,
    });
  });

  it('findById should overlay version metadata onto a workflow app', async () => {
    const admin = await createAdmin(app, 'overlay-admin-2@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;
    const { workflow } = await seedWorkflowWithVersionMetadata(orgUser, { slug: 'find-by-id-slug' });

    const resolved = await appsRepository.findById(workflow.id, admin.workspace.id);
    expect(resolved.slug).toBe('find-by-id-slug');
  });

  it('findByAppId should overlay version metadata onto a workflow app', async () => {
    const admin = await createAdmin(app, 'overlay-admin-3@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;
    const { workflow } = await seedWorkflowWithVersionMetadata(orgUser, { slug: 'find-by-app-id-slug' });

    const resolved = await appsRepository.findByAppId(workflow.id);
    expect(resolved.slug).toBe('find-by-app-id-slug');
  });

  it('findByIdOrSlug should overlay version metadata onto a workflow app (by UUID)', async () => {
    const admin = await createAdmin(app, 'overlay-admin-4@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;
    const { workflow } = await seedWorkflowWithVersionMetadata(orgUser, { slug: 'find-by-id-or-slug-uuid' });

    const resolved = await appsRepository.findByIdOrSlug(workflow.id);
    expect(resolved.slug).toBe('find-by-id-or-slug-uuid');
  });

  it('findByIdOrSlug should resolve a workflow via app_versions.slug (by slug)', async () => {
    const admin = await createAdmin(app, 'overlay-admin-5@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;
    const { workflow } = await seedWorkflowWithVersionMetadata(orgUser, { slug: 'find-by-id-or-slug-string' });

    const resolved = await appsRepository.findByIdOrSlug('find-by-id-or-slug-string');
    expect(resolved?.id).toBe(workflow.id);
  });

  it('findBySlug should resolve a workflow via app_versions.slug', async () => {
    const admin = await createAdmin(app, 'overlay-admin-6@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;
    const { workflow } = await seedWorkflowWithVersionMetadata(orgUser, { slug: 'find-by-slug-workflow' });

    const resolved = await appsRepository.findBySlug('find-by-slug-workflow', admin.workspace.id);
    expect(resolved?.id).toBe(workflow.id);
  });

  it('findAppBySlug should resolve a workflow via app_versions.slug', async () => {
    const admin = await createAdmin(app, 'overlay-admin-7@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;
    const { workflow } = await seedWorkflowWithVersionMetadata(orgUser, { slug: 'find-app-by-slug-workflow' });

    const resolved = await appsRepository.findAppBySlug('find-app-by-slug-workflow');
    expect(resolved?.id).toBe(workflow.id);
  });

  it('findByDataQuery should overlay version metadata onto a workflow app', async () => {
    const admin = await createAdmin(app, 'overlay-admin-8@tooljet.io');
    const orgUser = { ...admin.user, organizationId: admin.workspace.id } as any;
    const { version } = await seedWorkflowWithVersionMetadata(orgUser, { slug: 'find-by-data-query-slug' });

    // Attach a DataQuery to the workflow version. The data source is created directly
    // (rather than via the createWorkflowDataSource test helper) because that helper also
    // writes a DataSourceOptions row, and data_source_options no longer exists in this
    // environment's test DB (dropped by a migration from another branch's checkout that
    // isn't part of this branch's migration set). findByDataQuery only needs a DataSource
    // row to satisfy DataQuery.dataSourceId, so the options step is unnecessary here.
    const ds = getDefaultDataSource();
    const dataSource = await ds.getRepository(DataSourceEntity).save(
      ds.getRepository(DataSourceEntity).create({
        id: require('crypto').randomUUID(),
        name: 'restapi',
        kind: 'restapi',
        type: 'default',
        scope: 'global',
        appVersionId: null,
        organizationId: admin.workspace.id,
      })
    );
    const dataQuery = await createWorkflowDataQuery(app, version, dataSource, {
      name: 'overlay-data-query',
      options: {},
    });

    const resolved = await appsRepository.findByDataQuery(dataQuery.id);
    expect(resolved).toMatchObject({
      name: 'Overlay Workflow Version Name',
      slug: 'find-by-data-query-slug',
      icon: 'overlay-icon.svg',
      isPublic: true,
    });
  });
});
