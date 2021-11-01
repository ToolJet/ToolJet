import {
  clearDB,
  createUser,
  createNestAppInstance,
  createApplication,
  createApplicationVersion,
  createDataQuery,
  createDataSource,
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
      const app = await createApplication(nestApp, {
        user: adminUser,
        name: 'sample app',
        isPublic: true,
      });

      const result = await service.export(adminUser, app.id);

      expect(result.id).toBe(app.id);
      expect(result.name).toBe(app.name);
      expect(result.isPublic).toBe(app.isPublic);
      expect(result.organizationId).toBe(app.organizationId);
      expect(result.currentVersionId).toBe(null);
      expect(result.appVersions).toEqual([]);
      expect(result.dataQueries).toEqual([]);
      expect(result.dataSources).toEqual([]);
    });

    it('should export app', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      const application = await createApplication(nestApp, {
        user: adminUser,
        name: 'sample app',
        isPublic: true,
      });
      await createApplicationVersion(nestApp, application);
      const dataSource = await createDataSource(nestApp, {
        application,
        kind: 'test_kind',
        name: 'test_name',
      });
      await createDataQuery(nestApp, {
        application,
        dataSource,
        kind: 'test_kind',
      });

      const exportedApp = await getManager().findOne(App, application.id, {
        relations: ['dataQueries', 'dataSources', 'appVersions'],
      });

      const result = await service.export(adminUser, exportedApp.id);

      expect(result.id).toBe(exportedApp.id);
      expect(result.name).toBe(exportedApp.name);
      expect(result.isPublic).toBe(exportedApp.isPublic);
      expect(result.organizationId).toBe(exportedApp.organizationId);
      expect(result.currentVersionId).toBe(null);
      expect(result.appVersions).toEqual(exportedApp.appVersions);
      expect(result.dataQueries).toEqual(exportedApp.dataQueries);
      expect(result.dataSources).toEqual(exportedApp.dataSources);
    });
  });

  describe('.import', () => {
    it('should throw error with invalid params', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      await expect(service.import(adminUser, 'hello world')).rejects.toThrow('Invalid params for app import');
    });

    it('should create apps with empty params', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      await service.import(adminUser, {});
      const apps = await getManager().find(App);

      expect(apps).toHaveLength(1);
    });

    it('should import app with empty related associations', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      const adminUser = adminUserData.user;
      const app = await createApplication(nestApp, {
        user: adminUser,
        name: 'sample app',
        isPublic: true,
      });

      const exportedApp = await service.export(adminUser, app.id);

      const result = await service.import(adminUser, exportedApp);
      const importedApp = await getManager().findOne(App, result.id, {
        relations: ['dataQueries', 'dataSources', 'appVersions'],
      });

      expect(importedApp.id == exportedApp.id).toBeFalsy();
      expect(importedApp.name).toBe(exportedApp.name);
      expect(importedApp.isPublic).toBeFalsy();
      expect(importedApp.organizationId).toBe(exportedApp.organizationId);
      expect(importedApp.currentVersionId).toBe(null);
      expect(importedApp.appVersions).toEqual([]);
      expect(importedApp.dataQueries).toEqual([]);
      expect(importedApp.dataSources).toEqual([]);

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
      const application = await createApplication(nestApp, {
        user: adminUser,
        name: 'sample app',
        isPublic: true,
      });
      await createApplicationVersion(nestApp, application);
      let dataSource = await createDataSource(nestApp, {
        application,
        kind: 'test_kind',
        name: 'test_name',
      });
      await createDataQuery(nestApp, {
        application,
        dataSource,
        kind: 'test_kind',
      });

      const exportedApp = await service.export(adminUser, application.id);
      const result = await service.import(adminUser, exportedApp);
      const importedApp = await getManager().findOne(App, result.id, {
        relations: ['dataQueries', 'dataSources', 'appVersions'],
      });

      expect(importedApp.id == exportedApp.id).toBeFalsy();
      expect(importedApp.name).toBe(exportedApp.name);
      expect(importedApp.isPublic).toBeFalsy();
      expect(importedApp.organizationId).toBe(exportedApp.organizationId);
      expect(importedApp.currentVersionId).toBe(null);

      // assert relations
      const appVersion = importedApp.appVersions[0];
      expect(appVersion.appId).toEqual(importedApp.id);

      dataSource = importedApp.dataSources[0];
      expect(dataSource.appId).toEqual(importedApp.id);

      const dataQuery = importedApp.dataQueries[0];
      expect(dataQuery.appId).toEqual(importedApp.id);
      expect(dataQuery.dataSourceId).toEqual(dataSource.id);

      // assert all fields except primary keys, foriegn keys and timestamps are same
      const deleteFieldsNotToCheck = (entity) => {
        delete entity.id;
        delete entity.appId;
        delete entity.dataSourceId;
        delete entity.createdAt;
        delete entity.updatedAt;

        return entity;
      };
      const importedAppVersions = importedApp.appVersions.map((version) => deleteFieldsNotToCheck(version));
      const exportedAppVersions = exportedApp.appVersions.map((version) => deleteFieldsNotToCheck(version));
      const importedDataSources = importedApp.dataSources.map((source) => deleteFieldsNotToCheck(source));
      const exportedDataSources = exportedApp.dataSources.map((source) => deleteFieldsNotToCheck(source));
      const importedDataQueries = importedApp.dataQueries.map((query) => deleteFieldsNotToCheck(query));
      const exportedDataQueries = exportedApp.dataQueries.map((query) => deleteFieldsNotToCheck(query));

      expect(importedAppVersions).toEqual(exportedAppVersions);
      expect(importedDataSources).toEqual(exportedDataSources);
      expect(importedDataQueries).toEqual(exportedDataQueries);

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
