import {
  clearDB,
  createUser,
  createNestAppInstance,
  createApplication,
  createApplicationVersion,
  createDataQuery,
  createDataSource,
  generateAppDefaults,
  createAppEnvironments,
  getAppWithAllDetails,
} from '../test.helper';
import { INestApplication } from '@nestjs/common';
import { DataSource as TypeOrmDataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { AppImportExportService } from '../../ee/apps/services/app-import-export.service';

describe('AppImportExportService', () => {
  let nestApp: INestApplication;
  let service: AppImportExportService;
  let defaultDataSource: TypeOrmDataSource;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    nestApp = await createNestAppInstance();
    service = nestApp.get<AppImportExportService>(AppImportExportService);
    defaultDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('default'));
  });

  describe('.export', () => {
    it('should export app with empty related associations', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      const { application: app } = await generateAppDefaults(nestApp, adminUserData.user, {
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
      const { application } = await generateAppDefaults(nestApp, adminUserData.user, {
        isAppPublic: true,
      });

      const exportedApp = await getAppWithAllDetails(application.id);

      const { appV2: result } = await service.export(adminUser, exportedApp.id);

      expect(result.id).toBe(exportedApp.id);
      expect(result.name).toBe(exportedApp.name);
      expect(result.isPublic).toBe(exportedApp.isPublic);
      expect(result.organizationId).toBe(exportedApp.organizationId);
      expect(result.currentVersionId).toBe(null);
      expect(result.appVersions).toEqual(exportedApp.appVersions);
      expect(result['dataQueries']).toEqual(exportedApp['dataQueries']);
      expect(result['dataSources']).toEqual(exportedApp['dataSources']);
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
      await createAppEnvironments(nestApp, adminUser.organizationId);
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

      const exportedApp = await defaultDataSource.manager.findOneOrFail(App, {
        where: { id: application.id },
      });

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

  describe('.import', () => {
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
      const { application: app } = await generateAppDefaults(nestApp, adminUserData.user, {
        isAppPublic: true,
        isDataSourceNeeded: false,
        isQueryNeeded: false,
      });

      const { appV2: exportedApp } = await service.export(adminUser, app.id);
      const appName = 'my app';
      const { newApp } = await service.import(adminUser, exportedApp, appName);
      const importedApp = await getAppWithAllDetails(newApp.id);

      expect(importedApp.id == exportedApp.id).toBeFalsy();
      expect(importedApp.name).toContain(exportedApp.name);
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
      const { application, appVersion: applicationVersion } = await generateAppDefaults(nestApp, adminUserData.user, {
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
      const importedApp = await getAppWithAllDetails(newApp.id);
      expect(importedApp.appVersions).toHaveLength(1);
      expect(importedApp.appVersions[0].appId).toEqual(newApp.id);

      // Data sources are now created at global/org scope during import,
      // not per-version, so they won't appear in version-scoped queries.
      // Verify the global data source was created for the org.
      const globalDs = await defaultDataSource.manager.findOne(
        (await import('src/entities/data_source.entity')).DataSource,
        {
          where: {
            organizationId: adminUser.organizationId,
            kind: 'test_kind',
            scope: 'global',
          },
        }
      );
      expect(globalDs).toBeDefined();
      expect(globalDs.name).toBe('test_datasource');
    });
  });

  afterAll(async () => {
    await nestApp.close();
  });
});
