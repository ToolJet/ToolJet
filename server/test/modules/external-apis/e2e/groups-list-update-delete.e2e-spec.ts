import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initTestApp, closeTestApp, createUser, createApplication, createApplicationVersion, getDefaultDataSource } from 'test-helper';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { AppVersion } from '@entities/app_version.entity';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { AppsGroupPermissions } from '@entities/apps_group_permissions.entity';
import { DataSourcesGroupPermissions } from '@entities/data_sources_group_permissions.entity';
import { GroupApps } from '@entities/group_apps.entity';
import { GroupDataSources } from '@entities/group_data_source.entity';
import { DataSource } from '@entities/data_source.entity';
import { User } from '@entities/user.entity';
import { GROUP_PERMISSIONS_TYPE, ResourceType } from '@modules/group-permissions/constants';
import { Repository } from 'typeorm';

/**
 * External API — PATCH /ext/workspace/:workspaceId/groups/:groupId (update)
 *                 GET   /ext/workspace/:workspaceId/groups (list)
 *                 DELETE /ext/workspace/:workspaceId/groups/:groupId (delete)
 *
 * create/get-one are covered in groups-create-get.e2e-spec.ts.
 */

/** @group platform */
describe('External API — Groups list/update/delete', () => {
  let app: INestApplication;
  let AUTH_HEADER: string;
  let groupRepo: Repository<GroupPermissions>;
  let granularRepo: Repository<GranularPermissions>;
  let appsGroupRepo: Repository<AppsGroupPermissions>;
  let groupAppsRepo: Repository<GroupApps>;
  let dsGroupRepo: Repository<DataSourcesGroupPermissions>;
  let groupDataSourcesRepo: Repository<GroupDataSources>;
  let dataSourceRepo: Repository<DataSource>;
  let appVersionRepo: Repository<AppVersion>;
  const NONEXISTENT_UUID = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    AUTH_HEADER = `Basic ${app.get(ConfigService).get('EXTERNAL_API_ACCESS_TOKEN')}`;
    const ds = getDefaultDataSource();
    groupRepo = ds.getRepository(GroupPermissions);
    granularRepo = ds.getRepository(GranularPermissions);
    appsGroupRepo = ds.getRepository(AppsGroupPermissions);
    groupAppsRepo = ds.getRepository(GroupApps);
    dsGroupRepo = ds.getRepository(DataSourcesGroupPermissions);
    groupDataSourcesRepo = ds.getRepository(GroupDataSources);
    dataSourceRepo = ds.getRepository(DataSource);
    appVersionRepo = ds.getRepository(AppVersion);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  async function seedOrg() {
    const { organization, user } = await createUser(app, {
      email: `groups-lud-${Date.now()}-${Math.random()}@tooljet.io`,
    });
    return { organization, user };
  }

  async function seedCustomGroup(organizationId: string, name: string, overrides: Partial<GroupPermissions> = {}) {
    const group = groupRepo.create({
      organizationId,
      name,
      type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
      appCreate: false,
      appDelete: false,
      folderCreate: false,
      folderDelete: false,
      orgConstantCRUD: false,
      workflowCreate: false,
      workflowDelete: false,
      dataSourceCreate: false,
      dataSourceDelete: false,
      appPromote: false,
      appRelease: false,
      ...overrides,
    });
    return groupRepo.save(group);
  }

  async function seedApp(seedUser: User & { organizationId: string }, name: string, shouldCreateEnvs = true) {
    const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    return createApplication(app, { name, user: seedUser, isPublic: false, slug }, shouldCreateEnvs);
  }

  async function seedDataSource(organizationId: string, name: string) {
    const ds = dataSourceRepo.create({
      name,
      kind: 'restapi',
      organizationId,
    });
    return dataSourceRepo.save(ds);
  }

  async function seedAppGranularPermission(
    groupId: string,
    appIds: string[],
    {
      canEdit = false,
      canView = true,
      hideFromDashboard = false,
      canAccessDevelopment = true,
      canAccessStaging = false,
      canAccessProduction = false,
      canAccessReleased = true,
    } = {}
  ) {
    const gp = await granularRepo.save(
      granularRepo.create({
        groupId,
        name: `app_gp_${Date.now()}`,
        type: ResourceType.APP,
        isAll: false,
      })
    );
    const agp = await appsGroupRepo.save(
      appsGroupRepo.create({
        granularPermissionId: gp.id,
        appType: 'front-end' as any,
        canEdit,
        canView,
        hideFromDashboard,
        canAccessDevelopment,
        canAccessStaging,
        canAccessProduction,
        canAccessReleased,
      })
    );
    if (appIds.length) {
      await groupAppsRepo.insert(appIds.map((appId) => ({ appId, appsGroupPermissionsId: agp.id })));
    }
    return granularRepo.findOne({
      where: { id: gp.id },
      relations: ['appsGroupPermissions', 'appsGroupPermissions.groupApps'],
    });
  }

  // =========================================================================
  // PATCH /ext/workspace/:workspaceId/groups/:groupId
  // =========================================================================

  describe('PATCH /ext/workspace/:workspaceId/groups/:groupId', () => {
    it('returns 403 when Authorization header is missing', async () => {
      const { organization: org, user } = await seedOrg();
      const group = await seedCustomGroup(org.id, 'Dev Team');
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .send({ name: 'New Name' })
        .expect(403);
    });

    it('returns 403 when the access token is wrong', async () => {
      const { organization: org, user } = await seedOrg();
      const group = await seedCustomGroup(org.id, 'Dev Team');
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', 'Basic wrong-token')
        .send({ name: 'New Name' })
        .expect(403);
    });

    it('returns 404 for a non-existent workspace', async () => {
      const { organization: org, user } = await seedOrg();
      const group = await seedCustomGroup(org.id, 'Dev Team');
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${NONEXISTENT_UUID}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'New Name' })
        .expect(404);
    });

    it('returns 404 for a non-existent group', async () => {
      const { organization: org, user } = await seedOrg();
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${NONEXISTENT_UUID}`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'New Name' })
        .expect(404);
    });

    it('returns 400 when trying to update a default (non-custom) group', async () => {
      const { organization: org, user } = await seedOrg();
      const defaultGroup = await groupRepo.findOneOrFail({
        where: { organizationId: org.id, type: GROUP_PERMISSIONS_TYPE.DEFAULT },
      });
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${defaultGroup.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'Hacked Name' })
        .expect(400);
    });

    it('renames a group and returns 204 with no body', async () => {
      const { organization: org, user } = await seedOrg();
      const group = await seedCustomGroup(org.id, 'Old Name');

      const response = await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'New Name' })
        .expect(204);

      expect(response.body).toEqual({});

      const updated = await groupRepo.findOneOrFail({ where: { id: group.id } });
      expect(updated.name).toBe('New Name');
    });

    it('updates only the provided workspace permission flags', async () => {
      const { organization: org, user } = await seedOrg();
      const group = await seedCustomGroup(org.id, 'Dev Team', {
        appCreate: false,
        folderCreate: true,
      });

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ permissions: { appCreate: true } })
        .expect(204);

      const updated = await groupRepo.findOneOrFail({ where: { id: group.id } });
      expect(updated.appCreate).toBe(true);
      expect(updated.folderCreate).toBe(true);
    });

    it('merges new app resources into an existing matching granular permission entry', async () => {
      const { organization: org, user } = await seedOrg();
      const app1 = await seedApp(user, 'App One');
      const app2 = await seedApp(user, 'App Two', false);
      const group = await seedCustomGroup(org.id, 'Dev Team');

      await seedAppGranularPermission(group.id, [app1.id], {
        canEdit: false,
        canView: true,
        hideFromDashboard: false,
        canAccessDevelopment: false,
        canAccessStaging: false,
        canAccessProduction: false,
        canAccessReleased: false,
      });

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({
          granularPermissions: [
            {
              type: 'app',
              applyToAll: false,
              resources: [app2.id],
              permissions: { canEdit: false, hideFromDashboard: false, environments: [] },
            },
          ],
        })
        .expect(204);

      const gps = await granularRepo.find({
        where: { groupId: group.id, type: ResourceType.APP },
        relations: ['appsGroupPermissions', 'appsGroupPermissions.groupApps'],
      });
      expect(gps.length).toBe(1);
      const appIds = gps[0].appsGroupPermissions.groupApps.map((ga) => ga.appId);
      expect(appIds).toContain(app1.id);
      expect(appIds).toContain(app2.id);
    });

    it('creates a new granular permission entry when no match exists', async () => {
      const { organization: org, user } = await seedOrg();
      const app1 = await seedApp(user, 'App One');
      const app2 = await seedApp(user, 'App Two', false);
      const group = await seedCustomGroup(org.id, 'Dev Team');

      await seedAppGranularPermission(group.id, [app1.id], { canEdit: true, canView: false });

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({
          granularPermissions: [
            {
              type: 'app',
              applyToAll: false,
              resources: [app2.id],
              permissions: { canEdit: false, hideFromDashboard: false, environments: [] },
            },
          ],
        })
        .expect(204);

      const gps = await granularRepo.find({
        where: { groupId: group.id, type: ResourceType.APP },
        relations: ['appsGroupPermissions'],
      });
      expect(gps.length).toBe(2);
    });

    it('downgrade: moves an app out of the canEdit=true entry into a new canEdit=false entry, leaving the other app untouched', async () => {
      const { organization: org, user } = await seedOrg();
      const app1 = await seedApp(user, 'App One');
      const app2 = await seedApp(user, 'App Two', false);
      const group = await seedCustomGroup(org.id, 'Dev Team');

      // Both apps start in the same canEdit=true entry.
      await seedAppGranularPermission(group.id, [app1.id, app2.id], {
        canEdit: true,
        canView: false,
        canAccessDevelopment: true,
        canAccessStaging: false,
        canAccessProduction: false,
        canAccessReleased: false,
      });

      // Downgrade only app1 — the migration path matches by resource id, not just canEdit/env
      // overlap, so app2 (not referenced in this request) must stay in the canEdit=true entry.
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({
          granularPermissions: [
            {
              type: 'app',
              applyToAll: false,
              resources: [app1.id],
              permissions: { canEdit: false, hideFromDashboard: false, environments: ['development'] },
            },
          ],
        })
        .expect(204);

      const gps = await granularRepo.find({
        where: { groupId: group.id, type: ResourceType.APP },
        relations: ['appsGroupPermissions', 'appsGroupPermissions.groupApps'],
      });

      expect(gps.length).toBe(2);
      const canEditTrueEntry = gps.find((gp) => gp.appsGroupPermissions.canEdit === true);
      const canEditFalseEntry = gps.find((gp) => gp.appsGroupPermissions.canEdit === false);

      expect(canEditTrueEntry.appsGroupPermissions.groupApps.map((ga) => ga.appId)).toEqual([app2.id]);
      expect(canEditFalseEntry.appsGroupPermissions.groupApps.map((ga) => ga.appId)).toEqual([app1.id]);
    });

    it('treats environments as an unordered set for match lookup', async () => {
      const { organization: org, user } = await seedOrg();
      const app1 = await seedApp(user, 'App One');
      const app2 = await seedApp(user, 'App Two', false);
      const group = await seedCustomGroup(org.id, 'Dev Team');

      await seedAppGranularPermission(group.id, [app1.id], {
        canEdit: false,
        canView: true,
        canAccessDevelopment: true,
        canAccessStaging: true,
        canAccessProduction: false,
        canAccessReleased: false,
      });

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({
          granularPermissions: [
            {
              type: 'app',
              applyToAll: false,
              resources: [app2.id],
              permissions: {
                canEdit: false,
                hideFromDashboard: false,
                environments: ['staging', 'development'],
              },
            },
          ],
        })
        .expect(204);

      const gps = await granularRepo.find({
        where: { groupId: group.id, type: ResourceType.APP },
        relations: ['appsGroupPermissions', 'appsGroupPermissions.groupApps'],
      });
      expect(gps.length).toBe(1);
      const appIds = gps[0].appsGroupPermissions.groupApps.map((ga) => ga.appId);
      expect(appIds).toContain(app1.id);
      expect(appIds).toContain(app2.id);
    });

    it('does not create duplicate resource entries when the same resource is sent twice', async () => {
      const { organization: org, user } = await seedOrg();
      const app1 = await seedApp(user, 'App One');
      const group = await seedCustomGroup(org.id, 'Dev Team');
      // environments: [] on the incoming request only matches an existing entry whose own
      // environment flags are all false — must be explicit, the helper's defaults aren't empty.
      await seedAppGranularPermission(group.id, [app1.id], {
        canEdit: false,
        canView: true,
        canAccessDevelopment: false,
        canAccessStaging: false,
        canAccessProduction: false,
        canAccessReleased: false,
      });

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({
          granularPermissions: [
            {
              type: 'app',
              applyToAll: false,
              resources: [app1.id],
              permissions: { canEdit: false, hideFromDashboard: false, environments: [] },
            },
          ],
        })
        .expect(204);

      const gps = await granularRepo.find({
        where: { groupId: group.id, type: ResourceType.APP },
        relations: ['appsGroupPermissions', 'appsGroupPermissions.groupApps'],
      });
      expect(gps.length).toBe(1);
      const appIds = gps[0].appsGroupPermissions.groupApps.map((ga) => ga.appId);
      expect(appIds.filter((id) => id === app1.id).length).toBe(1);
    });

    it('updates an existing applyToAll entry in-place', async () => {
      const { organization: org, user } = await seedOrg();
      const group = await seedCustomGroup(org.id, 'Dev Team');

      const gp = await granularRepo.save(
        granularRepo.create({
          groupId: group.id,
          name: 'app_all',
          type: ResourceType.APP,
          isAll: true,
        })
      );
      await appsGroupRepo.save(
        appsGroupRepo.create({
          granularPermissionId: gp.id,
          appType: 'front-end' as any,
          canEdit: false,
          canView: true,
          hideFromDashboard: false,
          canAccessDevelopment: false,
          canAccessStaging: false,
          canAccessProduction: false,
          canAccessReleased: true,
        })
      );

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({
          granularPermissions: [
            {
              type: 'app',
              applyToAll: true,
              resources: [],
              permissions: {
                canEdit: true,
                environments: ['development', 'staging'],
              },
            },
          ],
        })
        .expect(204);

      const updatedGp = await granularRepo.findOneOrFail({
        where: { groupId: group.id, type: ResourceType.APP, isAll: true },
        relations: ['appsGroupPermissions'],
      });
      const allGps = await granularRepo.find({ where: { groupId: group.id } });
      expect(allGps.length).toBe(1);
      expect(updatedGp.appsGroupPermissions.canEdit).toBe(true);
      expect(updatedGp.appsGroupPermissions.canAccessDevelopment).toBe(true);
      expect(updatedGp.appsGroupPermissions.canAccessStaging).toBe(true);
    });

    it('creates a new applyToAll entry when none exists for that type', async () => {
      const { organization: org, user } = await seedOrg();
      const group = await seedCustomGroup(org.id, 'Dev Team');

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({
          granularPermissions: [
            {
              type: 'app',
              applyToAll: true,
              resources: [],
              permissions: { canEdit: false, environments: [] },
            },
          ],
        })
        .expect(204);

      const gps = await granularRepo.find({
        where: { groupId: group.id, type: ResourceType.APP, isAll: true },
      });
      expect(gps.length).toBe(1);
    });

    it('returns 422 when two applyToAll=true entries for the same type are sent in one request', async () => {
      const { organization: org, user } = await seedOrg();
      const group = await seedCustomGroup(org.id, 'Dev Team');

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({
          granularPermissions: [
            {
              type: 'app',
              applyToAll: true,
              resources: [],
              permissions: { canEdit: true, environments: [] },
            },
            {
              type: 'app',
              applyToAll: true,
              resources: [],
              permissions: { canEdit: false, environments: [] },
            },
          ],
        })
        .expect(422);
    });

    it('merges data source resources into a matching granular permission entry', async () => {
      const { organization: org, user } = await seedOrg();
      const ds1 = await seedDataSource(org.id, 'DS One');
      const ds2 = await seedDataSource(org.id, 'DS Two');
      const group = await seedCustomGroup(org.id, 'Dev Team');

      const gp = await granularRepo.save(
        granularRepo.create({
          groupId: group.id,
          name: 'ds_gp',
          type: ResourceType.DATA_SOURCE,
          isAll: false,
        })
      );
      const dsgp = await dsGroupRepo.save(
        dsGroupRepo.create({
          granularPermissionId: gp.id,
          canConfigure: true,
          canUse: false,
        })
      );
      await groupDataSourcesRepo.save(
        groupDataSourcesRepo.create({
          dataSourceId: ds1.id,
          dataSourcesGroupPermissionsId: dsgp.id,
        })
      );

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({
          granularPermissions: [
            {
              type: 'data_source',
              applyToAll: false,
              resources: [ds2.id],
              permissions: { canConfigure: true },
            },
          ],
        })
        .expect(204);

      const updatedDsgp = await dsGroupRepo.findOneOrFail({
        where: { id: dsgp.id },
        relations: ['groupDataSources'],
      });
      const dsIds = updatedDsgp.groupDataSources.map((gds) => gds.dataSourceId);
      expect(dsIds).toContain(ds1.id);
      expect(dsIds).toContain(ds2.id);
    });

    it('creates a new data_source granular permission when no match exists', async () => {
      const { organization: org, user } = await seedOrg();
      const ds1 = await seedDataSource(org.id, 'DS One');
      const group = await seedCustomGroup(org.id, 'Dev Team');

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({
          granularPermissions: [
            {
              type: 'data_source',
              applyToAll: false,
              resources: [ds1.id],
              permissions: { canConfigure: true },
            },
          ],
        })
        .expect(204);

      const gps = await granularRepo.find({
        where: { groupId: group.id, type: ResourceType.DATA_SOURCE },
      });
      expect(gps.length).toBe(1);
    });

    it('returns 400 when resources array is empty and applyToAll=false', async () => {
      const { organization: org, user } = await seedOrg();
      const group = await seedCustomGroup(org.id, 'Dev Team');

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({
          granularPermissions: [
            {
              type: 'app',
              applyToAll: false,
              resources: [],
              permissions: { canEdit: false, environments: [] },
            },
          ],
        })
        .expect(400);
    });

    it('returns 400 when a referenced app resource does not exist', async () => {
      const { organization: org, user } = await seedOrg();
      const group = await seedCustomGroup(org.id, 'Dev Team');

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({
          granularPermissions: [
            {
              type: 'app',
              applyToAll: false,
              resources: [NONEXISTENT_UUID],
              permissions: { canEdit: false, environments: [] },
            },
          ],
        })
        .expect(400);
    });

    it('resolves app resources by name when names are provided', async () => {
      const { organization: org, user } = await seedOrg();
      const appByName = await seedApp(user, 'Named App');
      // Name resolution for the APP type joins app_versions.app_name, not apps.name —
      // a version carrying the name must exist.
      const version = await createApplicationVersion(app, appByName);
      await appVersionRepo.update(version.id, { appName: appByName.name });
      const group = await seedCustomGroup(org.id, 'Dev Team');

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({
          granularPermissions: [
            {
              type: 'app',
              applyToAll: false,
              resources: [appByName.name],
              permissions: { canEdit: false, hideFromDashboard: false, environments: [] },
            },
          ],
        })
        .expect(204);

      const gps = await granularRepo.find({
        where: { groupId: group.id, type: ResourceType.APP },
        relations: ['appsGroupPermissions', 'appsGroupPermissions.groupApps'],
      });
      expect(gps.length).toBe(1);
      const appIds = gps[0].appsGroupPermissions.groupApps.map((ga) => ga.appId);
      expect(appIds).toContain(appByName.id);
    });

    it('combines both name and permissions update in a single request', async () => {
      const { organization: org, user } = await seedOrg();
      const group = await seedCustomGroup(org.id, 'Old Name', { appCreate: false });

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({
          name: 'New Name',
          permissions: { appCreate: true },
        })
        .expect(204);

      const updated = await groupRepo.findOneOrFail({ where: { id: group.id } });
      expect(updated.name).toBe('New Name');
      expect(updated.appCreate).toBe(true);
    });
  });

  // =========================================================================
  // GET /ext/workspace/:workspaceId/groups
  // =========================================================================

  describe('GET /ext/workspace/:workspaceId/groups', () => {
    it('returns 403 when Authorization header is missing', async () => {
      const { organization: org, user } = await seedOrg();
      await request(app.getHttpServer()).get(`/api/ext/workspace/${org.id}/groups`).expect(403);
    });

    it('returns 404 for a non-existent workspace', async () => {
      await request(app.getHttpServer())
        .get(`/api/ext/workspace/${NONEXISTENT_UUID}/groups`)
        .set('Authorization', AUTH_HEADER)
        .expect(404);
    });

    it('returns only custom groups (not default role groups)', async () => {
      const { organization: org, user } = await seedOrg();
      await seedCustomGroup(org.id, 'Custom Group A');

      const response = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${org.id}/groups`)
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      const names: string[] = response.body.data.map((g: any) => g.name);
      expect(names).not.toContain('admin');
      expect(names).not.toContain('builder');
      expect(names).not.toContain('end-user');
      expect(names).toContain('Custom Group A');
    });

    it('returns the correct pagination shape', async () => {
      const { organization: org, user } = await seedOrg();
      await seedCustomGroup(org.id, 'Group A');
      await seedCustomGroup(org.id, 'Group B');
      await seedCustomGroup(org.id, 'Group C');

      const response = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${org.id}/groups?page=1&per_page=2`)
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        per_page: 2,
        total_count: 3,
      });
    });

    it('paginates correctly across pages', async () => {
      const { organization: org, user } = await seedOrg();
      await seedCustomGroup(org.id, 'Group A');
      await seedCustomGroup(org.id, 'Group B');
      await seedCustomGroup(org.id, 'Group C');

      const page2 = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${org.id}/groups?page=2&per_page=2`)
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      expect(page2.body.data.length).toBe(1);
      expect(page2.body.pagination.page).toBe(2);
    });

    it('filters groups by name using the search param (case-insensitive)', async () => {
      const { organization: org, user } = await seedOrg();
      await seedCustomGroup(org.id, 'Frontend Devs');
      await seedCustomGroup(org.id, 'Backend Devs');
      await seedCustomGroup(org.id, 'Designers');

      const response = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${org.id}/groups?search=devs`)
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      expect(response.body.pagination.total_count).toBe(2);
      const names = response.body.data.map((g: any) => g.name);
      expect(names).toContain('Frontend Devs');
      expect(names).toContain('Backend Devs');
      expect(names).not.toContain('Designers');
    });

    it('returns an empty data array when no groups match the search', async () => {
      const { organization: org, user } = await seedOrg();
      await seedCustomGroup(org.id, 'Frontend Devs');

      const response = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${org.id}/groups?search=nonexistent`)
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total_count).toBe(0);
    });

    it('returns the correct permissions shape for each group', async () => {
      const { organization: org, user } = await seedOrg();
      await seedCustomGroup(org.id, 'My Group', {
        appCreate: true,
        appDelete: false,
        appPromote: true,
        appRelease: false,
        workflowCreate: true,
        workflowDelete: false,
        dataSourceCreate: false,
        dataSourceDelete: false,
        folderCreate: true,
        folderDelete: false,
        orgConstantCRUD: false,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${org.id}/groups`)
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      const group = response.body.data[0];
      expect(group.permissions).toMatchObject({
        apps_create: true,
        apps_delete: false,
        apps_promote: true,
        apps_release: false,
        workflows_create: true,
        workflows_delete: false,
        datasources_create: false,
        datasources_delete: false,
        folder_create: true,
        folder_delete: false,
        workspace_constants: false,
      });
    });

    it('includes granularPermissions with correct shape in the response', async () => {
      const { organization: org, user } = await seedOrg();
      const testApp = await seedApp(user, 'My App');
      const group = await seedCustomGroup(org.id, 'Dev Team');
      await seedAppGranularPermission(group.id, [testApp.id], {
        canEdit: true,
        canView: false,
        canAccessDevelopment: true,
        canAccessStaging: true,
        canAccessProduction: false,
        canAccessReleased: false,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${org.id}/groups`)
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      const returnedGroup = response.body.data.find((g: any) => g.id === group.id);
      expect(returnedGroup.granularPermissions.length).toBe(1);

      const gp = returnedGroup.granularPermissions[0];
      expect(gp.id).toBeDefined();
      expect(gp.type).toBe('app');
      expect(gp.applyToAll).toBe(false);
      expect(gp.resources).toContain(testApp.id);
      expect(gp.permissions.canEdit).toBe(true);
      expect(gp.permissions.environments).toContain('development');
      expect(gp.permissions.environments).toContain('staging');
    });

    it('returns groups with empty granularPermissions array when none exist', async () => {
      const { organization: org, user } = await seedOrg();
      await seedCustomGroup(org.id, 'Empty Group');

      const response = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${org.id}/groups`)
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      const group = response.body.data[0];
      expect(group.granularPermissions).toEqual([]);
    });
  });

  // =========================================================================
  // DELETE /ext/workspace/:workspaceId/groups/:groupId
  // =========================================================================

  describe('DELETE /ext/workspace/:workspaceId/groups/:groupId', () => {
    it('returns 403 when Authorization header is missing', async () => {
      const { organization: org, user } = await seedOrg();
      const group = await seedCustomGroup(org.id, 'To Delete');
      await request(app.getHttpServer()).delete(`/api/ext/workspace/${org.id}/groups/${group.id}`).expect(403);
    });

    it('returns 404 for a non-existent workspace', async () => {
      const { organization: org, user } = await seedOrg();
      const group = await seedCustomGroup(org.id, 'To Delete');
      await request(app.getHttpServer())
        .delete(`/api/ext/workspace/${NONEXISTENT_UUID}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .expect(404);
    });

    it('returns 404 for a non-existent group', async () => {
      const { organization: org, user } = await seedOrg();
      await request(app.getHttpServer())
        .delete(`/api/ext/workspace/${org.id}/groups/${NONEXISTENT_UUID}`)
        .set('Authorization', AUTH_HEADER)
        .expect(404);
    });

    it('returns 400 when trying to delete a default group', async () => {
      const { organization: org, user } = await seedOrg();
      const defaultGroup = await groupRepo.findOneOrFail({
        where: { organizationId: org.id, type: GROUP_PERMISSIONS_TYPE.DEFAULT },
      });

      await request(app.getHttpServer())
        .delete(`/api/ext/workspace/${org.id}/groups/${defaultGroup.id}`)
        .set('Authorization', AUTH_HEADER)
        .expect(400);
    });

    it('deletes a custom group and returns 204 with no body', async () => {
      const { organization: org, user } = await seedOrg();
      const group = await seedCustomGroup(org.id, 'To Delete');

      const response = await request(app.getHttpServer())
        .delete(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .expect(204);

      expect(response.body).toEqual({});

      const deleted = await groupRepo.findOne({ where: { id: group.id } });
      expect(deleted).toBeNull();
    });

    it('cascades deletion to granular permissions and resource entries', async () => {
      const { organization: org, user } = await seedOrg();
      const testApp = await seedApp(user, 'Cascade App');
      const group = await seedCustomGroup(org.id, 'To Delete');
      await seedAppGranularPermission(group.id, [testApp.id]);

      await request(app.getHttpServer())
        .delete(`/api/ext/workspace/${org.id}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .expect(204);

      const gps = await granularRepo.find({ where: { groupId: group.id } });
      expect(gps.length).toBe(0);
    });

    it('returns 422 when the UUID path param is invalid', async () => {
      const { organization: org } = await seedOrg();
      await request(app.getHttpServer())
        .delete(`/api/ext/workspace/${org.id}/groups/not-a-uuid`)
        .set('Authorization', AUTH_HEADER)
        .expect(422);
    });
  });
});
