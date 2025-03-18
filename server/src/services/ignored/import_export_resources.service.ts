// import { Injectable } from '@nestjs/common';
// import { User } from 'src/entities/user.entity';
// import { ExportResourcesDto } from '@dto/export-resources.dto';
// import { AppImportExportService } from './app_import_export.service';
// import { TooljetDbImportExportService } from './tooljet_db_import_export_service';
// import { ImportResourcesDto, ImportTooljetDatabaseDto } from '@dto/import-resources.dto';
// import { AppsService } from './apps.service';
// import { CloneResourcesDto } from '@dto/clone-resources.dto';
// import { isEmpty } from 'lodash';
// import { ActionTypes, ResourceTypes } from 'src/entities/audit_log.entity';
// import { EventEmitter2 } from '@nestjs/event-emitter';

// @Injectable()
// export class ImportExportResourcesService {
//   constructor(
//     private readonly appImportExportService: AppImportExportService,
//     private readonly appsService: AppsService,
//     private readonly tooljetDbImportExportService: TooljetDbImportExportService,
//     private eventEmitter: EventEmitter2
//   ) {}

//   async export(
//     user: User,
//     exportResourcesDto: ExportResourcesDto
//   ): Promise<{
//     tooljet_database?: Array<ImportTooljetDatabaseDto>;
//     app?: Array<Record<string, any>>; // TODO: Define the type for app
//   }> {
//     const resourcesExport: {
//       tooljet_database?: Array<ImportTooljetDatabaseDto>;
//       app?: Array<Record<string, unknown>>;
//     } = {};

//     if (exportResourcesDto.tooljet_database?.length) {
//       const exportedDbs: ImportTooljetDatabaseDto[] = [];
//       for (const tjdb of exportResourcesDto.tooljet_database) {
//         const exportedDb = await this.tooljetDbImportExportService.export(
//           exportResourcesDto.organization_id,
//           tjdb,
//           exportResourcesDto.tooljet_database
//         );
//         exportedDbs.push(exportedDb);
//       }

//       if (exportedDbs.length > 0) resourcesExport.tooljet_database = exportedDbs;
//     }

//     if (exportResourcesDto.app?.length) {
//       const exportedApps: Record<string, unknown>[] = [];
//       for (const app of exportResourcesDto.app) {
//         const exportedApp = {
//           definition: await this.appImportExportService.export(user, app.id, app.search_params),
//         };
//         exportedApps.push(exportedApp);
//       }

//       if (exportedApps.length > 0) resourcesExport.app = exportedApps;
//     }

//     return resourcesExport;
//   }

//   async import(
//     user: User,
//     importResourcesDto: ImportResourcesDto,
//     cloning = false,
//     isGitApp = false,
//     isTemplateApp = false
//   ) {
//     let tableNameMapping = {};
//     const imports = { app: [], tooljet_database: [], tableNameMapping: {} };
//     const importingVersion = importResourcesDto.tooljet_version;

//     if (!isEmpty(importResourcesDto.tooljet_database)) {
//       const res = await this.tooljetDbImportExportService.bulkImport(importResourcesDto, importingVersion, cloning);
//       tableNameMapping = res.tableNameMapping;
//       imports.tooljet_database = res.tooljet_database;
//       imports.tableNameMapping = tableNameMapping;
//     }

//     if (!isEmpty(importResourcesDto.app)) {
//       for (const appImportDto of importResourcesDto.app) {
//         user.organizationId = importResourcesDto.organization_id;
//         const createdApp = await this.appImportExportService.import(
//           user,
//           appImportDto.definition,
//           appImportDto.appName,
//           {
//             tooljet_database: tableNameMapping,
//           },
//           isGitApp,
//           importResourcesDto.tooljet_version,
//           cloning
//         );

//         imports.app.push({ id: createdApp.id, name: createdApp.name });

//         this.eventEmitter.emit('auditLogEntry', {
//           userId: user.id,
//           organizationId: user.organizationId,
//           resourceId: createdApp.id,
//           resourceType: ResourceTypes.APP,
//           resourceName: createdApp.name,
//           actionType: ActionTypes.APP_CREATE,
//         });
//       }
//     }

//     return imports;
//   }

//   async clone(user: User, { organization_id, app: [{ id: appId, name: newAppName }] }: CloneResourcesDto) {
//     const tablesForApp = await this.appsService.findTooljetDbTables(appId);
//     const exportResourcesDto: ExportResourcesDto = {
//       organization_id,
//       app: [{ id: appId, search_params: null }],
//       tooljet_database: tablesForApp,
//     };

//     const resourceExport = await this.export(user, exportResourcesDto);
//     // TODO: Verify if this is required as we always pass name on imports
//     // Without this appImportExportService.import will throw an error
//     resourceExport.app[0].definition.appV2.name = newAppName;

//     const importResourcesDto: ImportResourcesDto = {
//       organization_id,
//       tooljet_version: globalThis.TOOLJET_VERSION,
//       app: [
//         {
//           appName: newAppName,
//           definition: resourceExport.app[0].definition,
//         },
//       ],
//       tooljet_database: resourceExport.tooljet_database,
//     };

//     return this.import(user, importResourcesDto, true);
//   }
// }
