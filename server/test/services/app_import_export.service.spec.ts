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
import { getManager, In } from 'typeorm';
import { App } from 'src/entities/app.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { AppImportExportService } from '@services/app_import_export.service';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';

describe('AppImportExportService', () => {
  let nestApp: INestApplication;
  let service: AppImportExportService;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    nestApp = await createNestAppInstance();
    service = nestApp.get<AppImportExportService>(AppImportExportService);
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

      const exportedApp = await getManager().findOneOrFail(App, {
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
      const result = await service.import(adminUser, exportedApp, appName);
      const importedApp = await getAppWithAllDetails(result.id);

      expect(importedApp.id == exportedApp.id).toBeFalsy();
      expect(importedApp.name).toContain(exportedApp.name);
      expect(importedApp.isPublic).toBeFalsy();
      expect(importedApp.organizationId).toBe(exportedApp.organizationId);
      expect(importedApp.currentVersionId).toBe(null);
      expect(importedApp['dataQueries']).toEqual([]);
      // there will be 5 data sources created automatically when a user creates a new app.
      expect(importedApp['dataSources'].length).toEqual(5);

      // assert group permissions are valid
      const appGroupPermissions = await getManager().find(AppGroupPermission, {
        appId: importedApp.id,
      });
      const groupPermissionIds = appGroupPermissions.map((agp) => agp.groupPermissionId);
      const groupPermissions = await getManager().find(GroupPermission, {
        id: In(groupPermissionIds),
      });

      expect(new Set(groupPermissions.map((gp) => gp.organizationId))).toEqual(new Set([adminUser.organizationId]));
      expect(new Set(groupPermissions.map((gp) => gp.group))).toEqual(new Set(['admin']));
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

      //create default 5 datasources
      const firstDs = await createDataSource(nestApp, {
        name: 'runpydefault',
        kind: 'runpy',
        type: 'static',
        appVersion: applicationVersion,
      });

      await createDataSource(nestApp, {
        name: 'restapidefault',
        kind: 'restapi',
        type: 'static',
        appVersion: applicationVersion,
      });

      await createDataSource(nestApp, {
        name: 'runjsdefault',
        kind: 'runjs',
        type: 'static',
        appVersion: applicationVersion,
      });

      await createDataSource(nestApp, {
        name: 'tooljetdbdefault',
        kind: 'tooljetdb',
        type: 'static',
        appVersion: applicationVersion,
      });

      await createDataSource(nestApp, {
        name: 'workflowsdefault',
        kind: 'workflows',
        type: 'static',
        appVersion: applicationVersion,
      });

      //create default dataQuery
      await createDataQuery(nestApp, {
        dataSource: firstDs,
        appVersion: applicationVersion,
        options: {},
      });

      const { appV2: exportedApp } = await service.export(adminUser, application.id);
      const appName = 'my app';
      const result = await service.import(adminUser, exportedApp, appName);
      const importedApp = await getAppWithAllDetails(result.id);

      expect(importedApp.id == exportedApp.id).toBeFalsy();
      expect(importedApp.name).toContain(exportedApp.name);
      expect(importedApp.isPublic).toBeFalsy();
      expect(importedApp.organizationId).toBe(exportedApp.organizationId);
      expect(importedApp.currentVersionId).toBe(null);

      // assert relations
      const appVersion = importedApp.appVersions[0];
      expect(appVersion.appId).toEqual(importedApp.id);

      const dataQuery = importedApp['dataQueries'][0];
      const dataSourceForTheDataQuery = importedApp['dataSources'].find((ds) => ds.id === dataQuery.dataSourceId);
      expect(dataSourceForTheDataQuery).toBeDefined();

      // assert all fields except primary keys, foreign keys and timestamps are same
      const deleteFieldsNotToCheck = (entity) => {
        delete entity.id;
        delete entity.appId;
        delete entity.dataSourceId;
        delete entity.appVersionId;
        delete entity.createdAt;
        delete entity.updatedAt;

        return entity;
      };
      const importedAppVersions = importedApp.appVersions.map((version) => deleteFieldsNotToCheck(version));
      const exportedAppVersions = exportedApp.appVersions.map((version) => deleteFieldsNotToCheck(version));
      const importedDataSources = importedApp['dataSources'].map((source) => deleteFieldsNotToCheck(source));
      const exportedDataSources = exportedApp['dataSources'].map((source) => deleteFieldsNotToCheck(source));
      const importedDataQueries = importedApp['dataQueries'].map((query) => deleteFieldsNotToCheck(query));
      const exportedDataQueries = exportedApp['dataQueries'].map((query) => deleteFieldsNotToCheck(query));

      expect(new Set(importedAppVersions)).toEqual(new Set(exportedAppVersions));
      expect(new Set(importedDataSources)).toEqual(new Set(exportedDataSources));
      expect(new Set(importedDataQueries)).toEqual(new Set(exportedDataQueries));

      // assert group permissions are valid
      const appGroupPermissions = await getManager().find(AppGroupPermission, {
        appId: importedApp.id,
      });
      const groupPermissionIds = appGroupPermissions.map((agp) => agp.groupPermissionId);
      const groupPermissions = await getManager().find(GroupPermission, {
        id: In(groupPermissionIds),
      });

      expect(new Set(groupPermissions.map((gp) => gp.organizationId))).toEqual(new Set([adminUser.organizationId]));
      expect(new Set(groupPermissions.map((gp) => gp.group))).toEqual(new Set(['admin']));
    });
  });

  afterAll(async () => {
    await nestApp.close();
  });
});
