import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { Component } from '@entities/component.entity';
import { OrganizationThemes } from '@entities/organization_themes.entity';
import { PagePermission } from '@entities/page_permissions.entity';
import { PageUser } from '@entities/page_users.entity';
import { GroupUsers } from '@entities/group_users.entity';
import { PAGE_PERMISSION_TYPE } from '@modules/app-permissions/constants';
import { getAppDataRevision } from '@modules/apps/app-data-revision';
import { MIGRATION_ACTIVE_LOCK_KEY } from 'src/migration-helpers/migration-locks';
import {
  initTestApp,
  closeTestApp,
  createUser,
  createApplication,
  createApplicationVersion,
  createGroupPermission,
  grantAppPermission,
  getDefaultDataSource,
  saveEntity,
  updateEntity,
  deleteEntities,
  findEntity,
} from 'test-helper';

/**
 * The released-app viewer caches an app in the browser and refetches when its cache key changes.
 * Database triggers (migration AddViewerCacheStamps) move the app's change stamp, and the key reads
 * the viewer's groups, so these tests run against real Postgres.
 *
 * @group platform
 */
describe('Viewer cache change stamps | database triggers', () => {
  let nestApp: INestApplication;
  let user: Awaited<ReturnType<typeof createUser>>['user'];
  let organizationId: string;

  const query = <T>(sql: string, params: unknown[] = []): Promise<T[]> =>
    getDefaultDataSource().manager.query(sql, params);
  const appStamp = async (appId: string) =>
    (
      await query<{ t: string }>('SELECT updated_at::text AS t FROM app_viewer_cache_stamps WHERE app_id = $1', [appId])
    )[0]?.t ?? null;

  const addComponent = (pageId: string, overrides: Partial<Component> = {}) =>
    saveEntity(Component, {
      name: `text${Math.floor(Math.random() * 1e6)}`,
      type: 'Text',
      pageId,
      properties: {},
      styles: {},
      validation: {},
      ...overrides,
    } as Partial<Component>);

  // An app with a released version and a draft version, each with a home page. A fixed slug, as
  // in real version creation: versions share their app's slug, so a new one renames nothing.
  const createReleasedApp = async (name: string, type: 'front-end' | 'module' = 'front-end') => {
    const app = (await createApplication(nestApp, { name, user, type, slug: `stamp-${uuidv4()}` })) as App & {
      organizationId: string;
    };
    const released = await createApplicationVersion(nestApp, app, { name: 'released' });
    const draft = await createApplicationVersion(nestApp, app, { name: 'draft' });
    await updateEntity(App, app.id, { currentVersionId: released.id } as Partial<App>);
    return { app, released, draft };
  };

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
    ({ user } = await createUser(nestApp, { email: 'viewer-cache-stamps@tooljet.io', groups: ['end-user'] }));
    organizationId = user.organizationId;
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60000);

  describe('the released app', () => {
    it('gets a stamp when it is released', async () => {
      const app = (await createApplication(nestApp, { name: 'Release me', user })) as App & { organizationId: string };
      const version = await createApplicationVersion(nestApp, app);
      expect(await appStamp(app.id)).toBeNull();

      await updateEntity(App, app.id, { currentVersionId: version.id } as Partial<App>);

      expect(await appStamp(app.id)).not.toBeNull();
    });

    it('moves its stamp when a page permission is added, edited or removed', async () => {
      const { app, released } = await createReleasedApp('Permissions');
      const group = await createGroupPermission(nestApp, { name: 'stamp-viewers', organizationId });

      const before = await appStamp(app.id);
      const permission = await saveEntity(PagePermission, {
        pageId: released.homePageId,
        type: PAGE_PERMISSION_TYPE.GROUP,
      } as Partial<PagePermission>);
      await saveEntity(PageUser, {
        pagePermissionsId: permission.id,
        permissionGroupsId: group.id,
      } as Partial<PageUser>);
      const added = await appStamp(app.id);
      expect(added).not.toBe(before);

      await updateEntity(PagePermission, permission.id, {
        type: PAGE_PERMISSION_TYPE.SINGLE,
      } as Partial<PagePermission>);
      const edited = await appStamp(app.id);
      expect(edited).not.toBe(added);

      await deleteEntities(PagePermission, { id: permission.id });
      expect(await appStamp(app.id)).not.toBe(edited);
    });

    it('can still be deleted, and its stamp goes with it', async () => {
      const { app, released } = await createReleasedApp('Delete me');
      const permission = await saveEntity(PagePermission, {
        pageId: released.homePageId,
        type: PAGE_PERMISSION_TYPE.GROUP,
      } as Partial<PagePermission>);
      await saveEntity(PageUser, { pagePermissionsId: permission.id, userId: user.id } as Partial<PageUser>);
      await addComponent(released.homePageId);
      expect(await appStamp(app.id)).not.toBeNull();

      await deleteEntities(App, { id: app.id });

      expect(await findEntity(App, { id: app.id })).toBeNull();
      expect(await appStamp(app.id)).toBeNull();
    });

    it('ignores permission changes on the draft version', async () => {
      const { app, draft } = await createReleasedApp('Draft permissions');
      const before = await appStamp(app.id);

      await saveEntity(PagePermission, {
        pageId: draft.homePageId,
        type: PAGE_PERMISSION_TYPE.GROUP,
      } as Partial<PagePermission>);

      expect(await appStamp(app.id)).toBe(before);
    });
  });

  describe('workspace-wide changes', () => {
    it('moves every released app in the workspace when the theme is edited', async () => {
      const first = await createReleasedApp('Theme A');
      const second = await createReleasedApp('Theme B');
      const theme = await saveEntity(OrganizationThemes, {
        name: 'Brand',
        organizationId,
        definition: {},
      } as Partial<OrganizationThemes>);
      const before = [await appStamp(first.app.id), await appStamp(second.app.id)];

      await updateEntity(OrganizationThemes, theme.id, { name: 'Brand v2' } as Partial<OrganizationThemes>);

      expect(await appStamp(first.app.id)).not.toBe(before[0]);
      expect(await appStamp(second.app.id)).not.toBe(before[1]);
    });

    it("moves every released app in the workspace when an app's slug changes", async () => {
      const linking = await createReleasedApp('Links out');
      const target = await createReleasedApp('Link target');
      const before = await appStamp(linking.app.id);

      await updateEntity(AppVersion, target.released.id, { slug: `renamed-${uuidv4()}` } as Partial<AppVersion>);

      expect(await appStamp(linking.app.id)).not.toBe(before);
    });
  });

  describe('modules', () => {
    it('moves the apps that use a module when the module is released again', async () => {
      const module = await createReleasedApp('Header module', 'module');
      const coRelationId = uuidv4();
      await updateEntity(App, module.app.id, { co_relation_id: coRelationId } as Partial<App>);
      const consumer = await createReleasedApp('Uses module');
      const bystander = await createReleasedApp('No module');
      await addComponent(consumer.released.homePageId, {
        type: 'ModuleViewer',
        properties: { moduleAppId: { value: coRelationId } },
      });
      const before = { consumer: await appStamp(consumer.app.id), bystander: await appStamp(bystander.app.id) };

      const nextModuleVersion = await createApplicationVersion(nestApp, module.app, { name: 'v2' });
      await updateEntity(App, module.app.id, { currentVersionId: nextModuleVersion.id } as Partial<App>);

      expect(await appStamp(consumer.app.id)).not.toBe(before.consumer);
      expect(await appStamp(bystander.app.id)).toBe(before.bystander);
    });
  });

  const revision = (app: App) =>
    getAppDataRevision(getDefaultDataSource().manager, app, {
      versionId: app.currentVersionId,
      userId: user.id,
      licenseTerms: {},
    });

  describe('migrations', () => {
    // A data migration can rewrite components while this server already serves, so a copy read mid-run
    // must not be cached under the key the app has once the run commits.
    it('change the key when a migration is recorded, and mark it while one is running', async () => {
      const { app } = await createReleasedApp('Migrated');
      const released = await findEntity(App, { id: app.id });
      const before = await revision(released);

      await query("SELECT nextval('migrations_id_seq')");
      const recorded = await revision(released);
      expect(recorded).not.toBe(before);

      const runner = getDefaultDataSource().createQueryRunner();
      await runner.connect();
      try {
        await runner.query('SELECT pg_advisory_lock($1)', [MIGRATION_ACTIVE_LOCK_KEY]);
        const running = await revision(released);
        expect(running).not.toBe(recorded);
        expect(running).not.toBe(before);

        await runner.query('SELECT pg_advisory_unlock($1)', [MIGRATION_ACTIVE_LOCK_KEY]);
        expect(await revision(released)).toBe(recorded);
      } finally {
        await runner.release();
      }
    });
  });

  describe("the viewer's groups", () => {
    it('change the key when the viewer joins or leaves a group with access to the app', async () => {
      const { app } = await createReleasedApp('Group members');
      const released = await findEntity(App, { id: app.id });
      const group = await createGroupPermission(nestApp, { name: 'stamp-members', organizationId });
      await grantAppPermission(nestApp, released, group.id, { read: true });
      const before = await revision(released);

      const membership = await saveEntity(GroupUsers, { groupId: group.id, userId: user.id } as Partial<GroupUsers>);
      const joined = await revision(released);
      expect(joined).not.toBe(before);

      await deleteEntities(GroupUsers, { id: membership.id });
      expect(await revision(released)).toBe(before);
    });
  });
});
