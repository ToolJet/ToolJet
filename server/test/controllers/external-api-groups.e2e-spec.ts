import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { getManager } from 'typeorm';
import { clearDB, createNestAppInstance, createUser } from '../test.helper';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { AppsGroupPermissions } from '@entities/apps_group_permissions.entity';
import { DataSourcesGroupPermissions } from '@entities/data_sources_group_permissions.entity';
import { GroupApps } from '@entities/group_apps.entity';
import { GroupDataSources } from '@entities/group_data_source.entity';
import { App } from '@entities/app.entity';
import { DataSource } from '@entities/data_source.entity';
import { GROUP_PERMISSIONS_TYPE, ResourceType } from '@modules/group-permissions/constants';
import { Organization } from '@entities/organization.entity';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXT_API_TOKEN = 'test-ext-api-token';
const AUTH_HEADER = `Basic ${EXT_API_TOKEN}`;

/**
 * Helper — set the env vars required by ExternalApiSecurityGuard before the
 * app boots.  Must be called *before* createNestAppInstance().
 */
function setExternalApiEnv() {
  process.env.ENABLE_EXTERNAL_API = 'true';
  process.env.EXTERNAL_API_ACCESS_TOKEN = EXT_API_TOKEN;
}

// ---------------------------------------------------------------------------
// DB seed helpers
// ---------------------------------------------------------------------------

async function seedCustomGroup(
  organizationId: string,
  name: string,
  overrides: Partial<GroupPermissions> = {}
): Promise<GroupPermissions> {
  const manager = getManager();
  const group = manager.create(GroupPermissions, {
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
  return manager.save(group);
}

async function seedApp(organizationId: string, name: string): Promise<App> {
  const manager = getManager();
  const app = manager.create(App, {
    name,
    organizationId,
    slug: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
    isPublic: false,
  });
  return manager.save(app);
}

async function seedDataSource(organizationId: string, name: string): Promise<DataSource> {
  const manager = getManager();
  const ds = manager.create(DataSource, {
    name,
    kind: 'restapi',
    organizationId,
  });
  return manager.save(ds);
}

/**
 * Seed an app granular permission (non-applyToAll) for a group.
 */
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
): Promise<GranularPermissions> {
  const manager = getManager();
  const gp = await manager.save(
    manager.create(GranularPermissions, {
      groupId,
      name: `app_gp_${Date.now()}`,
      type: ResourceType.APP,
      isAll: false,
    })
  );
  const agp = await manager.save(
    manager.create(AppsGroupPermissions, {
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
    await manager.insert(
      GroupApps,
      appIds.map((appId) => ({ appId, appsGroupPermissionsId: agp.id }))
    );
  }
  return manager.findOne(GranularPermissions, {
    where: { id: gp.id },
    relations: ['appsGroupPermissions', 'appsGroupPermissions.groupApps'],
  });
}

// ---------------------------------------------------------------------------
// Main test suite
// ---------------------------------------------------------------------------

describe('External API — Groups endpoints', () => {
  let app: INestApplication;
  let organizationId: string;
  let adminUserId: string;

  beforeAll(async () => {
    setExternalApiEnv();
    app = await createNestAppInstance();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearDB();
    // Create a workspace with an admin user (required by getAdminUserForOrg)
    const { organization, user } = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['admin'],
    });
    organizationId = organization.id;
    adminUserId = user.id;
  });

  // =========================================================================
  // PATCH /ext/workspace/:workspaceId/groups/:groupId
  // =========================================================================

  describe('PATCH /ext/workspace/:workspaceId/groups/:groupId', () => {
    // ---- Auth ----------------------------------------------------------------

    it('returns 403 when Authorization header is missing', async () => {
      const group = await seedCustomGroup(organizationId, 'Dev Team');
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
        .send({ name: 'New Name' })
        .expect(403);
    });

    it('returns 403 when ENABLE_EXTERNAL_API is false', async () => {
      process.env.ENABLE_EXTERNAL_API = 'false';
      const group = await seedCustomGroup(organizationId, 'Dev Team');
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'New Name' })
        .expect(403);
      process.env.ENABLE_EXTERNAL_API = 'true';
    });

    // ---- 400/404 guard cases -------------------------------------------------

    it('returns 404 for a non-existent workspace', async () => {
      const nonExistentWsId = '00000000-0000-0000-0000-000000000001';
      const group = await seedCustomGroup(organizationId, 'Dev Team');
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${nonExistentWsId}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'New Name' })
        .expect(404);
    });

    it('returns 404 for a non-existent group', async () => {
      const nonExistentGroupId = '00000000-0000-0000-0000-000000000002';
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${nonExistentGroupId}`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'New Name' })
        .expect(404);
    });

    it('returns 400 when trying to update a default (non-custom) group', async () => {
      // Default groups (admin, builder, end-user) have type DEFAULT
      const defaultGroup = await getManager().findOne(GroupPermissions, {
        where: { organizationId, type: GROUP_PERMISSIONS_TYPE.DEFAULT },
      });
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${defaultGroup.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'Hacked Name' })
        .expect(400);
    });

    // ---- Name update --------------------------------------------------------

    it('renames a group and returns 204 with no body', async () => {
      const group = await seedCustomGroup(organizationId, 'Old Name');

      const response = await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'New Name' })
        .expect(204);

      expect(response.body).toEqual({});

      const updated = await getManager().findOne(GroupPermissions, { where: { id: group.id } });
      expect(updated.name).toBe('New Name');
    });

    // ---- Permissions patch ---------------------------------------------------

    it('updates only the provided workspace permission flags', async () => {
      const group = await seedCustomGroup(organizationId, 'Dev Team', {
        appCreate: false,
        folderCreate: true,
        folderDelete: true,
      });

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ permissions: { appCreate: true } })
        .expect(204);

      const updated = await getManager().findOne(GroupPermissions, { where: { id: group.id } });
      // The provided flag is set
      expect(updated.appCreate).toBe(true);
      // Omitted flag is untouched
      expect(updated.folderCreate).toBe(true);
    });

    // ---- granularPermissions — app upsert (merge) ----------------------------

    it('merges new app resources into an existing matching granular permission entry', async () => {
      const app1 = await seedApp(organizationId, 'App One');
      const app2 = await seedApp(organizationId, 'App Two');
      const group = await seedCustomGroup(organizationId, 'Dev Team');

      // Pre-existing entry: canView, no environments, app1
      await seedAppGranularPermission(group.id, [app1.id], {
        canEdit: false,
        canView: true,
        hideFromDashboard: false,
        canAccessDevelopment: false,
        canAccessStaging: false,
        canAccessProduction: false,
        canAccessReleased: false,
      });

      // Incoming: same canEdit=false, hideFromDashboard=false, environments=[] → should merge app2
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
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

      // Both apps should now be in the same granular permission entry
      const gps = await getManager().find(GranularPermissions, {
        where: { groupId: group.id, type: ResourceType.APP },
        relations: ['appsGroupPermissions', 'appsGroupPermissions.groupApps'],
      });
      expect(gps.length).toBe(1);
      const appIds = gps[0].appsGroupPermissions.groupApps.map((ga) => ga.appId);
      expect(appIds).toContain(app1.id);
      expect(appIds).toContain(app2.id);
    });

    it('creates a new granular permission entry when no match exists', async () => {
      const app1 = await seedApp(organizationId, 'App One');
      const app2 = await seedApp(organizationId, 'App Two');
      const group = await seedCustomGroup(organizationId, 'Dev Team');

      // Pre-existing: canEdit=true
      await seedAppGranularPermission(group.id, [app1.id], { canEdit: true, canView: false });

      // Incoming: canEdit=false — no match → new entry
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
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

      const gps = await getManager().find(GranularPermissions, {
        where: { groupId: group.id, type: ResourceType.APP },
        relations: ['appsGroupPermissions'],
      });
      expect(gps.length).toBe(2);
    });

    // ---- Downgrade: canEdit=true → canEdit=false (no data loss) ---------------

    it('downgrade: deletes canEdit=true entry, migrates its resources into canEdit=false entry', async () => {
      const app1 = await seedApp(organizationId, 'App One');
      const app2 = await seedApp(organizationId, 'App Two');
      const group = await seedCustomGroup(organizationId, 'Dev Team');

      // Pre-existing canEdit=true entry with app1 and empty environments
      await seedAppGranularPermission(group.id, [app1.id], {
        canEdit: true,
        canView: false,
        canAccessDevelopment: false,
        canAccessStaging: false,
        canAccessProduction: false,
        canAccessReleased: false,
      });

      // Incoming: canEdit=false with app2, same environments → triggers downgrade path
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
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

      const gps = await getManager().find(GranularPermissions, {
        where: { groupId: group.id, type: ResourceType.APP },
        relations: ['appsGroupPermissions', 'appsGroupPermissions.groupApps'],
      });

      // The canEdit=true entry must be gone, only one entry remains
      expect(gps.length).toBe(1);
      expect(gps[0].appsGroupPermissions.canEdit).toBe(false);

      // Both app1 (migrated) and app2 (incoming) must be present — no data loss
      const appIds = gps[0].appsGroupPermissions.groupApps.map((ga) => ga.appId);
      expect(appIds).toContain(app1.id);
      expect(appIds).toContain(app2.id);
    });

    // ---- Environments are compared as unordered sets -------------------------

    it('treats environments as an unordered set for match lookup', async () => {
      const app1 = await seedApp(organizationId, 'App One');
      const app2 = await seedApp(organizationId, 'App Two');
      const group = await seedCustomGroup(organizationId, 'Dev Team');

      // Existing: canEdit=false, dev+staging
      await seedAppGranularPermission(group.id, [app1.id], {
        canEdit: false,
        canView: true,
        canAccessDevelopment: true,
        canAccessStaging: true,
        canAccessProduction: false,
        canAccessReleased: false,
      });

      // Incoming: same permissions but environments in reverse order — should still merge
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
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

      const gps = await getManager().find(GranularPermissions, {
        where: { groupId: group.id, type: ResourceType.APP },
        relations: ['appsGroupPermissions', 'appsGroupPermissions.groupApps'],
      });
      expect(gps.length).toBe(1);
      const appIds = gps[0].appsGroupPermissions.groupApps.map((ga) => ga.appId);
      expect(appIds).toContain(app1.id);
      expect(appIds).toContain(app2.id);
    });

    // ---- Idempotency: merging duplicate resources ----------------------------

    it('does not create duplicate resource entries when the same resource is sent twice', async () => {
      const app1 = await seedApp(organizationId, 'App One');
      const group = await seedCustomGroup(organizationId, 'Dev Team');
      await seedAppGranularPermission(group.id, [app1.id], { canEdit: false, canView: true });

      // Send app1 again — should be deduplicated
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
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

      const gps = await getManager().find(GranularPermissions, {
        where: { groupId: group.id, type: ResourceType.APP },
        relations: ['appsGroupPermissions', 'appsGroupPermissions.groupApps'],
      });
      expect(gps.length).toBe(1);
      const appIds = gps[0].appsGroupPermissions.groupApps.map((ga) => ga.appId);
      // Exactly one occurrence of app1
      expect(appIds.filter((id) => id === app1.id).length).toBe(1);
    });

    // ---- applyToAll upsert ---------------------------------------------------

    it('updates an existing applyToAll entry in-place', async () => {
      const group = await seedCustomGroup(organizationId, 'Dev Team');
      const manager = getManager();

      // Seed an applyToAll=true entry
      const gp = await manager.save(
        manager.create(GranularPermissions, {
          groupId: group.id,
          name: 'app_all',
          type: ResourceType.APP,
          isAll: true,
        })
      );
      await manager.save(
        manager.create(AppsGroupPermissions, {
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

      // Update flags via PATCH
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
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

      const updatedGp = await manager.findOne(GranularPermissions, {
        where: { groupId: group.id, type: ResourceType.APP, isAll: true },
        relations: ['appsGroupPermissions'],
      });
      // Still only one applyToAll entry
      const allGps = await manager.find(GranularPermissions, { where: { groupId: group.id } });
      expect(allGps.length).toBe(1);
      expect(updatedGp.appsGroupPermissions.canEdit).toBe(true);
      expect(updatedGp.appsGroupPermissions.canAccessDevelopment).toBe(true);
      expect(updatedGp.appsGroupPermissions.canAccessStaging).toBe(true);
    });

    it('creates a new applyToAll entry when none exists for that type', async () => {
      const group = await seedCustomGroup(organizationId, 'Dev Team');

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
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

      const gps = await getManager().find(GranularPermissions, {
        where: { groupId: group.id, type: ResourceType.APP, isAll: true },
      });
      expect(gps.length).toBe(1);
    });

    it('returns 422 when two applyToAll=true entries for the same type are sent in one request', async () => {
      const group = await seedCustomGroup(organizationId, 'Dev Team');

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
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

    // ---- data_source upsert --------------------------------------------------

    it('merges data source resources into a matching granular permission entry', async () => {
      const ds1 = await seedDataSource(organizationId, 'DS One');
      const ds2 = await seedDataSource(organizationId, 'DS Two');
      const group = await seedCustomGroup(organizationId, 'Dev Team');

      // Pre-existing DS entry with canConfigure=true + ds1
      const manager = getManager();
      const gp = await manager.save(
        manager.create(GranularPermissions, {
          groupId: group.id,
          name: 'ds_gp',
          type: ResourceType.DATA_SOURCE,
          isAll: false,
        })
      );
      const dsgp = await manager.save(
        manager.create(DataSourcesGroupPermissions, {
          granularPermissionId: gp.id,
          canConfigure: true,
          canUse: false,
        })
      );
      await manager.save(
        manager.create(GroupDataSources, {
          dataSourceId: ds1.id,
          dataSourcesGroupPermissionsId: dsgp.id,
        })
      );

      // Incoming: same canConfigure=true → merge ds2
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
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

      const updatedDsgp = await manager.findOne(DataSourcesGroupPermissions, {
        where: { id: dsgp.id },
        relations: ['groupDataSources'],
      });
      const dsIds = updatedDsgp.groupDataSources.map((gds) => gds.dataSourceId);
      expect(dsIds).toContain(ds1.id);
      expect(dsIds).toContain(ds2.id);
    });

    it('creates a new data_source granular permission when no match exists', async () => {
      const ds1 = await seedDataSource(organizationId, 'DS One');
      const group = await seedCustomGroup(organizationId, 'Dev Team');

      // No existing entries
      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
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

      const gps = await getManager().find(GranularPermissions, {
        where: { groupId: group.id, type: ResourceType.DATA_SOURCE },
      });
      expect(gps.length).toBe(1);
    });

    // ---- Validation ----------------------------------------------------------

    it('returns 400 when resources array is empty and applyToAll=false', async () => {
      const group = await seedCustomGroup(organizationId, 'Dev Team');

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
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
      const group = await seedCustomGroup(organizationId, 'Dev Team');
      const nonExistentAppId = '00000000-0000-0000-0000-000000000099';

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({
          granularPermissions: [
            {
              type: 'app',
              applyToAll: false,
              resources: [nonExistentAppId],
              permissions: { canEdit: false, environments: [] },
            },
          ],
        })
        .expect(400);
    });

    it('resolves app resources by name when names are provided', async () => {
      const appByName = await seedApp(organizationId, 'Named App');
      const group = await seedCustomGroup(organizationId, 'Dev Team');

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
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

      const gps = await getManager().find(GranularPermissions, {
        where: { groupId: group.id, type: ResourceType.APP },
        relations: ['appsGroupPermissions', 'appsGroupPermissions.groupApps'],
      });
      expect(gps.length).toBe(1);
      const appIds = gps[0].appsGroupPermissions.groupApps.map((ga) => ga.appId);
      expect(appIds).toContain(appByName.id);
    });

    it('combines both name and permissions update in a single request', async () => {
      const group = await seedCustomGroup(organizationId, 'Old Name', { appCreate: false });

      await request(app.getHttpServer())
        .patch(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({
          name: 'New Name',
          permissions: { appCreate: true },
        })
        .expect(204);

      const updated = await getManager().findOne(GroupPermissions, { where: { id: group.id } });
      expect(updated.name).toBe('New Name');
      expect(updated.appCreate).toBe(true);
    });
  });

  // =========================================================================
  // GET /ext/workspace/:workspaceId/groups
  // =========================================================================

  describe('GET /ext/workspace/:workspaceId/groups', () => {
    it('returns 403 when Authorization header is missing', async () => {
      await request(app.getHttpServer())
        .get(`/api/ext/workspace/${organizationId}/groups`)
        .expect(403);
    });

    it('returns 404 for a non-existent workspace', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000001';
      await request(app.getHttpServer())
        .get(`/api/ext/workspace/${nonExistentId}/groups`)
        .set('Authorization', AUTH_HEADER)
        .expect(404);
    });

    it('returns only custom groups (not default role groups)', async () => {
      await seedCustomGroup(organizationId, 'Custom Group A');

      const response = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${organizationId}/groups`)
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      const names: string[] = response.body.data.map((g: any) => g.name);
      // Default groups must not appear
      expect(names).not.toContain('admin');
      expect(names).not.toContain('builder');
      expect(names).not.toContain('end-user');
      // Custom group must appear
      expect(names).toContain('Custom Group A');
    });

    it('returns the correct pagination shape', async () => {
      await seedCustomGroup(organizationId, 'Group A');
      await seedCustomGroup(organizationId, 'Group B');
      await seedCustomGroup(organizationId, 'Group C');

      const response = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${organizationId}/groups?page=1&per_page=2`)
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
      await seedCustomGroup(organizationId, 'Group A');
      await seedCustomGroup(organizationId, 'Group B');
      await seedCustomGroup(organizationId, 'Group C');

      const page2 = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${organizationId}/groups?page=2&per_page=2`)
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      expect(page2.body.data.length).toBe(1);
      expect(page2.body.pagination.page).toBe(2);
    });

    it('filters groups by name using the search param (case-insensitive)', async () => {
      await seedCustomGroup(organizationId, 'Frontend Devs');
      await seedCustomGroup(organizationId, 'Backend Devs');
      await seedCustomGroup(organizationId, 'Designers');

      const response = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${organizationId}/groups?search=devs`)
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      expect(response.body.pagination.total_count).toBe(2);
      const names = response.body.data.map((g: any) => g.name);
      expect(names).toContain('Frontend Devs');
      expect(names).toContain('Backend Devs');
      expect(names).not.toContain('Designers');
    });

    it('returns an empty data array when no groups match the search', async () => {
      await seedCustomGroup(organizationId, 'Frontend Devs');

      const response = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${organizationId}/groups?search=nonexistent`)
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total_count).toBe(0);
    });

    it('returns the correct permissions shape for each group', async () => {
      await seedCustomGroup(organizationId, 'My Group', {
        appCreate: true,
        appDelete: false,
        appPromote: true,
        appRelease: false,
        workflowCreate: true,
        workflowDelete: false,
        dataSourceCreate: false,
        dataSourceDelete: false,
        folderCreate: true,
        folderDelete: true,
        orgConstantCRUD: false,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${organizationId}/groups`)
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
        folder: true,
        workspace_constants: false,
      });
    });

    it('includes granularPermissions with correct shape in the response', async () => {
      const testApp = await seedApp(organizationId, 'My App');
      const group = await seedCustomGroup(organizationId, 'Dev Team');
      await seedAppGranularPermission(group.id, [testApp.id], {
        canEdit: true,
        canView: false,
        canAccessDevelopment: true,
        canAccessStaging: true,
        canAccessProduction: false,
        canAccessReleased: false,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${organizationId}/groups`)
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
      await seedCustomGroup(organizationId, 'Empty Group');

      const response = await request(app.getHttpServer())
        .get(`/api/ext/workspace/${organizationId}/groups`)
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
      const group = await seedCustomGroup(organizationId, 'To Delete');
      await request(app.getHttpServer())
        .delete(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
        .expect(403);
    });

    it('returns 404 for a non-existent workspace', async () => {
      const group = await seedCustomGroup(organizationId, 'To Delete');
      const nonExistentWsId = '00000000-0000-0000-0000-000000000001';
      await request(app.getHttpServer())
        .delete(`/api/ext/workspace/${nonExistentWsId}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .expect(404);
    });

    it('returns 404 for a non-existent group', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000002';
      await request(app.getHttpServer())
        .delete(`/api/ext/workspace/${organizationId}/groups/${nonExistentId}`)
        .set('Authorization', AUTH_HEADER)
        .expect(404);
    });

    it('returns 400 when trying to delete a default group', async () => {
      const defaultGroup = await getManager().findOne(GroupPermissions, {
        where: { organizationId, type: GROUP_PERMISSIONS_TYPE.DEFAULT },
      });

      await request(app.getHttpServer())
        .delete(`/api/ext/workspace/${organizationId}/groups/${defaultGroup.id}`)
        .set('Authorization', AUTH_HEADER)
        .expect(400);
    });

    it('deletes a custom group and returns 204 with no body', async () => {
      const group = await seedCustomGroup(organizationId, 'To Delete');

      const response = await request(app.getHttpServer())
        .delete(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .expect(204);

      expect(response.body).toEqual({});

      const deleted = await getManager().findOne(GroupPermissions, { where: { id: group.id } });
      expect(deleted).toBeNull();
    });

    it('cascades deletion to granular permissions and resource entries', async () => {
      const testApp = await seedApp(organizationId, 'Cascade App');
      const group = await seedCustomGroup(organizationId, 'To Delete');
      await seedAppGranularPermission(group.id, [testApp.id]);

      await request(app.getHttpServer())
        .delete(`/api/ext/workspace/${organizationId}/groups/${group.id}`)
        .set('Authorization', AUTH_HEADER)
        .expect(204);

      const gps = await getManager().find(GranularPermissions, { where: { groupId: group.id } });
      expect(gps.length).toBe(0);
    });

    it('returns 400 when the UUID path param is invalid', async () => {
      await request(app.getHttpServer())
        .delete(`/api/ext/workspace/${organizationId}/groups/not-a-uuid`)
        .set('Authorization', AUTH_HEADER)
        .expect(400);
    });
  });
});

