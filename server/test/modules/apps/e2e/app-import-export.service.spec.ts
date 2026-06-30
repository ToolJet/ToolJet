/**
 * @group platform
 */
import {
  resetDB,
  createUser,
  initTestApp,
  createApplication,
  createApplicationVersion,
  createDataQuery,
  createDataSource,
  createAppWithDependencies,
  ensureAppEnvironments,
  findAppWithRelations,
  findEntityOrFail,
  findEntity,
  updateEntity,
  closeTestApp,
  getDefaultDataSource,
} from 'test-helper';
import { INestApplication } from '@nestjs/common';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { AppImportExportService } from '@ee/apps/services/app-import-export.service';
import { DataSourceVersion } from 'src/entities/data_source_version.entity';

// initTestApp() can exceed 60s when Jest restarts the worker to free memory
jest.setTimeout(120_000);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('AppImportExportService', () => {
describe('EE (plan: enterprise)', () => {
  let nestApp: INestApplication;
  let service: AppImportExportService;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
    service = nestApp.get<AppImportExportService>(AppImportExportService);
  });

  describe('.export | serialize app for transfer', () => {
    it('should export app with empty related associations', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      const { application: app } = await createAppWithDependencies(nestApp, adminUserData.user, {
        isAppPublic: true,
        isDataSourceNeeded: false,
        isQueryNeeded: false,
      });

      const { appV2: result } = await service.export(adminUser, app.id);

      expect(result.id).toBe(app.id);
      expect(result.name).toBe(app.name);
      expect(result.isPublic).toBe(app.isPublic);
      expect(result.organizationId).toBe(app.organizationId);
      expect(result.currentVersionId).toBe(null);
      expect(result['dataQueries']).toEqual([]);
      expect(result['dataSources']).toEqual([]);
    });

    it('should export app', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      const { application } = await createAppWithDependencies(nestApp, adminUserData.user, {
        isAppPublic: true,
      });

      const exportedApp = await findAppWithRelations(application.id);

      const { appV2: result } = await service.export(adminUser, exportedApp.id);

      expect(result.id).toBe(exportedApp.id);
      expect(result.name).toBe(exportedApp.name);
      expect(result.isPublic).toBe(exportedApp.isPublic);
      expect(result.organizationId).toBe(exportedApp.organizationId);
      expect(result.currentVersionId).toBe(null);
      // Export strips slug/appName/icon/isPublic from version objects (metadata lives at top-level)
      // and createdAt/updatedAt/dataSources/dataQueries are not included in the export version shape.
      const exportStripped = ['slug', 'appName', 'icon', 'isPublic', 'createdAt', 'updatedAt', 'dataSources', 'dataQueries'];
      const normalise = (versions: any[]) =>
        versions.map((v) => {
          const copy = { ...v };
          exportStripped.forEach((f) => delete copy[f]);
          return copy;
        });
      expect(normalise(result.appVersions)).toEqual(normalise(exportedApp.appVersions));
      expect(result['dataQueries'].length).toBe(exportedApp['dataQueries'].length);
      expect(result['dataSources'].length).toBe(exportedApp['dataSources'].length);
    });

    it('should export app with filtered version', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      const application = await createApplication(
        nestApp,
        {
          user: adminUser,
          name: 'sample app',
          isPublic: true,
        },
        false
      );
      await ensureAppEnvironments(nestApp, adminUser.organizationId);
      const appVersion1 = await createApplicationVersion(nestApp, application, { name: 'v1', definition: {} });
      const dataSource1 = await createDataSource(nestApp, {
        appVersion: appVersion1,
        kind: 'test_kind',
        name: 'test_name_1',
      });
      const dataQuery1 = await createDataQuery(nestApp, {
        dataSource: dataSource1,
        appVersion: appVersion1,
        name: 'test_query_1',
        kind: 'test_kind',
      });

      const appVersion2 = await createApplicationVersion(nestApp, application, {
        name: 'v2',
        definition: { hello: 'world' },
      });
      const dataSource2 = await createDataSource(nestApp, {
        appVersion: appVersion2,
        kind: 'test_kind',
        name: 'test_name_2',
      });
      const dataQuery2 = await createDataQuery(nestApp, {
        appVersion: appVersion2,
        dataSource: dataSource2,
        name: 'test_query_2',
      });

      const exportedApp = await findEntityOrFail(App, { id: application.id } as any);

      let { appV2: result } = await service.export(adminUser, exportedApp.id, { version_id: appVersion1.id });

      expect(result.id).toBe(exportedApp.id);
      expect(result.name).toBe(exportedApp.name);
      expect(result.isPublic).toBe(exportedApp.isPublic);
      expect(result.organizationId).toBe(exportedApp.organizationId);
      expect(result.currentVersionId).toBe(null);
      expect(result['dataQueries'].length).toBe(1);
      expect(result['dataQueries'][0].name).toEqual(dataQuery1.name);
      expect(result['dataSources'].length).toBe(1);
      expect(result['dataSources'][0].name).toEqual(dataSource1.name);
      expect(result.appVersions.length).toBe(1);
      expect(result.appVersions[0].name).toEqual(appVersion1.name);

      const res = await service.export(adminUser, exportedApp.id, { version_id: appVersion2.id });
      result = res.appV2;

      expect(result.id).toBe(exportedApp.id);
      expect(result.name).toBe(exportedApp.name);
      expect(result.isPublic).toBe(exportedApp.isPublic);
      expect(result.organizationId).toBe(exportedApp.organizationId);
      expect(result.currentVersionId).toBe(null);
      expect(result['dataQueries'].length).toBe(1);
      expect(result['dataQueries'][0].name).toEqual(dataQuery2.name);
      expect(result['dataSources'].length).toBe(1);
      expect(result['dataSources'][0].name).toEqual(dataSource2.name);
      expect(result.appVersions.length).toBe(1);
      expect(result.appVersions[0].name).toEqual(appVersion2.name);
    });
  });

  describe('.import | deserialize and create app from payload', () => {
    it('should throw error with invalid params', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      const appName = 'my app';
      await expect(service.import(adminUser, 'hello world', appName)).rejects.toThrow('Invalid params for app import');
    });

    it('should import app with empty related associations', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      const { application: app } = await createAppWithDependencies(nestApp, adminUserData.user, {
        isAppPublic: true,
        isDataSourceNeeded: false,
        isQueryNeeded: false,
      });

      const { appV2: exportedApp } = await service.export(adminUser, app.id);
      const appName = 'my app';
      const { newApp } = await service.import(adminUser, exportedApp, appName);
      const importedApp = await findAppWithRelations(newApp.id);

      expect(importedApp.id == exportedApp.id).toBeFalsy();
      // Non-workflow apps store name on app_versions.app_name, not apps.name
      expect(importedApp.appVersions[0].appName).toBe(appName);
      expect(importedApp.isPublic).toBeFalsy();
      expect(importedApp.organizationId).toBe(exportedApp.organizationId);
      expect(importedApp.currentVersionId).toBe(null);
      expect(importedApp['dataQueries']).toEqual([]);
      // Static data sources are now org-level global, not auto-created per app version
      expect(importedApp['dataSources'].length).toEqual(0);
    });

    it('should import app with related associations', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      const { application, appVersion: applicationVersion } = await createAppWithDependencies(nestApp, adminUserData.user, {
        isDataSourceNeeded: false,
        isQueryNeeded: false,
      });

      // Create a non-static data source and query to test import/export of app-level associations
      const testDs = await createDataSource(nestApp, {
        name: 'test_datasource',
        kind: 'test_kind',
        appVersion: applicationVersion,
      });

      await createDataQuery(nestApp, {
        dataSource: testDs,
        appVersion: applicationVersion,
        options: {},
      });

      const { appV2: exportedApp } = await service.export(adminUser, application.id);
      const appName = 'my app';
      const { newApp } = await service.import(adminUser, exportedApp, appName);

      // Verify the imported app is a distinct copy
      expect(newApp.id).not.toBe(exportedApp.id);
      expect(newApp.organizationId).toBe(exportedApp.organizationId);

      // Verify the imported app has an app version
      const importedApp = await findAppWithRelations(newApp.id);
      expect(importedApp.appVersions).toHaveLength(1);
      expect(importedApp.appVersions[0].appId).toEqual(newApp.id);

      // Data sources are now created at global/org scope during import,
      // not per-version, so they won't appear in version-scoped queries.
      // Verify the global data source was created for the org.
      const { DataSource: DataSourceEntity } = await import('src/entities/data_source.entity');
      const globalDs = await findEntity(DataSourceEntity, {
            organizationId: adminUser.organizationId,
            kind: 'test_kind',
            scope: 'global',
          } as any);
      expect(globalDs).toBeDefined();
      expect(globalDs.name).toBe('test_datasource');

      // Every DSV for the imported data source must be linked to the new app version
      const importedAppVersionId = importedApp.appVersions[0].id;
      const dsvs = await getDefaultDataSource().manager.find(DataSourceVersion, {
        where: { dataSourceId: globalDs.id },
      });
      expect(dsvs.length).toBeGreaterThan(0);
      for (const dsv of dsvs) {
        expect(dsv.appVersionId).toBe(importedAppVersionId);
      }
    });
  });

  describe('.export | metadata projection', () => {
    it('should strip slug from per-version objects and carry it at the top-level', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const { application, appVersion } = await createAppWithDependencies(nestApp, adminUserData.user, {
        isDataSourceNeeded: false,
        isQueryNeeded: false,
      });

      const customSlug = 'export-projection-test-slug';
      await updateEntity(AppVersion, appVersion.id, { slug: customSlug });

      const { appV2: result } = await service.export(adminUserData.user, application.id);

      expect(result.slug).toBe(customSlug);
      for (const v of result.appVersions) {
        expect((v as any).slug).toBeUndefined();
      }
    });
  });

  describe('.import | slug isolation', () => {
    it('should assign a fresh UUID slug, not the source app slug', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      const { application, appVersion } = await createAppWithDependencies(nestApp, adminUser, {
        isDataSourceNeeded: false,
        isQueryNeeded: false,
      });

      const originalSlug = 'original-custom-slug';
      await updateEntity(AppVersion, appVersion.id, { slug: originalSlug });

      const { appV2: exportedApp } = await service.export(adminUser, application.id);
      const { newApp } = await service.import(adminUser, exportedApp, 'slug-isolation-import');

      const importedRecord = await findAppWithRelations(newApp.id);
      const importedVersion = importedRecord.appVersions[0];

      expect(importedVersion.slug).not.toBe(originalSlug);
      expect(importedVersion.slug).toBe(newApp.id);
    });

    it('should produce unique slugs when importing the same export twice', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      const { application } = await createAppWithDependencies(nestApp, adminUser, {
        isDataSourceNeeded: false,
        isQueryNeeded: false,
      });

      const { appV2: exportedApp } = await service.export(adminUser, application.id);

      const { newApp: firstImport } = await service.import(adminUser, exportedApp, 'dupe-import-1');
      const { newApp: secondImport } = await service.import(adminUser, exportedApp, 'dupe-import-2');

      const firstRecord = await findAppWithRelations(firstImport.id);
      const secondRecord = await findAppWithRelations(secondImport.id);

      expect(firstRecord.appVersions[0].slug).toBe(firstImport.id);
      expect(secondRecord.appVersions[0].slug).toBe(secondImport.id);
      expect(firstRecord.appVersions[0].slug).not.toBe(secondRecord.appVersions[0].slug);
    });

    it('should assign the same slug (= new app id) to all versions in a multi-version import', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      const { application } = await createAppWithDependencies(nestApp, adminUser, {
        isDataSourceNeeded: false,
        isQueryNeeded: false,
      });

      await createApplicationVersion(nestApp, application, { name: 'v2', definition: {} });

      const { appV2: exportedApp } = await service.export(adminUser, application.id);
      const { newApp } = await service.import(adminUser, exportedApp, 'multi-version-slug-test');

      const importedRecord = await findAppWithRelations(newApp.id);
      const slugs = importedRecord.appVersions.map((v) => v.slug);

      // All versions share the same slug = new app's id (mirrors fresh-creation invariant)
      expect(slugs.every((s) => s === newApp.id)).toBe(true);
    });
  });

  describe('.import | globalSettings preservation', () => {
    it('should preserve globalSettings from the exported version', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      const { application, appVersion } = await createAppWithDependencies(nestApp, adminUser, {
        isDataSourceNeeded: false,
        isQueryNeeded: false,
      });

      const customGlobalSettings = {
        hideHeader: false,
        appInMaintenance: false,
        canvasMaxWidth: 1200,
        canvasMaxWidthType: 'px',
        canvasMaxHeight: 3000,
        canvasBackgroundColor: '#abcdef',
        backgroundFxQuery: '',
        appMode: 'dark',
      };
      await updateEntity(AppVersion, appVersion.id, { globalSettings: customGlobalSettings });

      const { appV2: exportedApp } = await service.export(adminUser, application.id);
      // Pass tooljetVersion >= 2.24.0 so the normalized schema path is taken,
      // which reads globalSettings from the dedicated column (not definition blob).
      const { newApp } = await service.import(adminUser, exportedApp, 'global-settings-preservation-test', {}, false, '3.0.0');

      const importedRecord = await findAppWithRelations(newApp.id);
      const importedVersion = importedRecord.appVersions[0];

      expect(importedVersion.globalSettings).toMatchObject({
        canvasMaxWidth: 1200,
        canvasMaxWidthType: 'px',
        canvasMaxHeight: 3000,
        canvasBackgroundColor: '#abcdef',
        appMode: 'dark',
      });
    });
  });

  describe('.import | identity isolation', () => {
    it('should create new IDs for app, versions, and data queries — never reuse source IDs', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      const { application, appVersion: sourceVersion } = await createAppWithDependencies(nestApp, adminUser, {
        isDataSourceNeeded: false,
        isQueryNeeded: false,
      });

      const testDs = await createDataSource(nestApp, {
        name: 'identity_test_ds',
        kind: 'test_kind',
        appVersion: sourceVersion,
      });
      const sourceQuery = await createDataQuery(nestApp, {
        dataSource: testDs,
        appVersion: sourceVersion,
        options: {},
      });

      const { appV2: exportedApp } = await service.export(adminUser, application.id);
      const { newApp } = await service.import(adminUser, exportedApp, 'identity-isolation-test');

      expect(newApp.id).not.toBe(application.id);

      const importedRecord = await findAppWithRelations(newApp.id);
      expect(importedRecord.appVersions[0].id).not.toBe(sourceVersion.id);
      expect(importedRecord['dataQueries'][0]?.id).not.toBe(sourceQuery.id);
    });
  });

  describe('.export → import | round-trip', () => {
    it('should produce a structurally equivalent app after export and re-import', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      const { application, appVersion: sourceVersion } = await createAppWithDependencies(nestApp, adminUser, {
        isDataSourceNeeded: false,
        isQueryNeeded: false,
      });

      const testDs = await createDataSource(nestApp, {
        name: 'round_trip_ds',
        kind: 'test_kind',
        appVersion: sourceVersion,
      });
      await createDataQuery(nestApp, {
        dataSource: testDs,
        appVersion: sourceVersion,
        options: {},
      });

      const { appV2: firstExport } = await service.export(adminUser, application.id);
      const { newApp } = await service.import(adminUser, firstExport, 'round-trip-app');
      const { appV2: secondExport } = await service.export(adminUser, newApp.id);

      expect(secondExport.name).toBe('round-trip-app');
      expect(secondExport.appVersions).toHaveLength(firstExport.appVersions.length);
      expect(secondExport['dataQueries']).toHaveLength(firstExport['dataQueries'].length);
      expect(secondExport['dataSources']).toHaveLength(firstExport['dataSources'].length);
    });

    it('should not carry the source app slug after export → import → re-export', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      const { application, appVersion } = await createAppWithDependencies(nestApp, adminUser, {
        isDataSourceNeeded: false,
        isQueryNeeded: false,
      });

      const originalSlug = 'round-trip-original-slug';
      await updateEntity(AppVersion, appVersion.id, { slug: originalSlug });

      const { appV2: firstExport } = await service.export(adminUser, application.id);
      const { newApp } = await service.import(adminUser, firstExport, 'round-trip-slug-test');
      const { appV2: secondExport } = await service.export(adminUser, newApp.id);

      expect(secondExport.slug).not.toBe(originalSlug);
      expect(secondExport.slug).toMatch(UUID_PATTERN);
    });
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);
});
});
