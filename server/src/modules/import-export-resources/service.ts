import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { ExportResourcesDto } from '@dto/export-resources.dto';
import { AppImportExportService } from '@modules/apps/services/app-import-export.service';
import { TooljetDbImportExportService } from '@modules/tooljet-db/services/tooljet-db-import-export.service';
import { ImportResourcesDto, ImportTooljetDatabaseDto } from '@dto/import-resources.dto';
import { CloneResourcesDto } from '@dto/clone-resources.dto';
import { isEmpty } from 'lodash';
import { InternalTableRepository } from '@modules/tooljet-db/repository';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { AppsRepository } from '@modules/apps/repository';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';

@Injectable()
export class ImportExportResourcesService {
  constructor(
    protected readonly appImportExportService: AppImportExportService,
    protected readonly tooljetDbImportExportService: TooljetDbImportExportService,
    protected readonly internalTableRepository: InternalTableRepository,
    protected readonly appsRepository: AppsRepository
  ) {}

  async export(
    user: User,
    exportResourcesDto: ExportResourcesDto,
    branchId?: string
  ): Promise<{
    tooljet_database?: Array<ImportTooljetDatabaseDto>;
    app?: Array<Record<string, any>>; // TODO: Define the type for app
  }> {
    const resourcesExport: {
      tooljet_database?: Array<ImportTooljetDatabaseDto>;
      app?: Array<Record<string, unknown>>;
    } = {};

    // Branch validation. Git-enabled workspaces must export from a feature
    // branch — exports from the default branch are blocked because the
    // default-branch DRAFT is the editor working state, not a publishable
    // artifact. Git-disabled workspaces (no default branch row) skip this
    // check and behave as before.
    await this.validateBranchForImportExport(user.organizationId, branchId, 'export');

    if (exportResourcesDto.tooljet_database?.length) {
      const exportedDbs: ImportTooljetDatabaseDto[] = [];
      for (const tjdb of exportResourcesDto.tooljet_database) {
        const exportedDb = await this.tooljetDbImportExportService.export(
          exportResourcesDto.organization_id,
          tjdb,
          exportResourcesDto.tooljet_database
        );
        exportedDbs.push(exportedDb);
      }

      if (exportedDbs.length > 0) resourcesExport.tooljet_database = exportedDbs;
    }

    if (exportResourcesDto.app?.length) {
      const exportedApps: Record<string, unknown>[] = [];
      for (const app of exportResourcesDto.app) {
        const exportedApp = {
          definition: await this.appImportExportService.export(user, app.id, app.search_params, branchId),
        };
        exportedApps.push(exportedApp);
      }

      if (exportedApps.length > 0) resourcesExport.app = exportedApps;
    }

    if (exportResourcesDto.app?.length) {
      const appData = await this.appsRepository.findOne({
        where: { id: exportResourcesDto.app[0].id }
      });
      //APP_EXPORT audit
      const auditLogsData = {
        userId: user.id,
        organizationId: user.organizationId,
        resourceId: appData.id,
        resourceName: appData.name,
      };
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);
    }
    return resourcesExport;
  }

  async import(
    user: User,
    importResourcesDto: ImportResourcesDto,
    cloning = false,
    isGitApp = false,
    isTemplateApp = false,
    manager?: EntityManager
  ) {
    let tableNameMapping = {};
    const imports = { app: [], tooljet_database: [], tableNameMapping: {} };
    const importingVersion = importResourcesDto.tooljet_version;
    const skipPermissionsGroupCheck = importResourcesDto.skip_permissions_group_check;

    // Branch validation. Git-enabled workspaces must import onto a feature
    // branch — imports onto the default branch are blocked because the
    // default-branch DRAFT is reserved for the publish hook to seed. Git
    // imports (`isGitApp=true`) skip this — they own their own branch
    // handling via createGitApp / createBranchVersionFromGit / importTagVersion.
    if (!isGitApp) {
      await this.validateBranchForImportExport(
        importResourcesDto.organization_id ?? user.organizationId,
        importResourcesDto.branchId,
        'import'
      );
    }

    if (!isEmpty(importResourcesDto.app) && !skipPermissionsGroupCheck) {
      for (const appImportDto of importResourcesDto.app) {
        let appParams = appImportDto.definition;
        if (appParams?.appV2) {
          appParams = { ...appParams.appV2 };
          const pages = appParams?.pages;
          const queries = appParams?.dataQueries;
          const components = appParams?.components;
          if (pages?.length || queries?.length || components?.length)
            await this.appImportExportService.checkIfGroupPermissionsExist(
              pages,
              queries,
              components,
              user.organizationId
            );
        }
      }
    }

    return await dbTransactionWrap(async (manager) => {
      if (!isEmpty(importResourcesDto.tooljet_database)) {
        const res = await this.tooljetDbImportExportService.bulkImport(importResourcesDto, importingVersion, cloning);
        tableNameMapping = res.tableNameMapping;
        imports.tooljet_database = res.tooljet_database;
        imports.tableNameMapping = tableNameMapping;
      }

      if (!isEmpty(importResourcesDto.app)) {
        for (const appImportDto of importResourcesDto.app) {
          user.organizationId = importResourcesDto.organization_id;
          const createdApp = await this.appImportExportService.import(
            user,
            appImportDto.definition,
            appImportDto.appName,
            {
              tooljet_database: tableNameMapping,
            },
            isGitApp,
            importResourcesDto.tooljet_version,
            cloning,
            manager,
            importResourcesDto.branchId
          );

          imports.app.push({ id: createdApp.newApp.id, name: createdApp.newApp.name });

          RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
            userId: user.id,
            organizationId: user.organizationId,
            resourceId: createdApp.newApp.id,
            resourceName: createdApp.newApp.name,
          });
        }
      }

      return imports;
    }, manager);
  }

  async legacyImport(user: User, templateDefinition: any, appName: string) {
    const importedApp = await this.appImportExportService.import(user, templateDefinition, appName);
    return {
      app: [importedApp.newApp],
      tooljet_database: [],
    };
  }

  async clone(user: User, { organization_id, app: [{ id: appId, name: newAppName }], branchId }: CloneResourcesDto) {
    const tablesForApp = await this.internalTableRepository.findTables(appId);
    const exportResourcesDto: ExportResourcesDto = {
      organization_id,
      app: [{ id: appId, search_params: null }],
      tooljet_database: tablesForApp,
    };

    const resourceExport = await this.export(user, exportResourcesDto);

    // Prevent cloning a stub app (pulled from git but not yet hydrated — has no pages).
    // AppVersion.isStub is a real DB column (is_stub, default false) — reliable to check here.
    const exportedVersions: any[] = resourceExport.app?.[0]?.definition?.appV2?.appVersions ?? [];
    const hasNonStubVersion = exportedVersions.some((v: any) => !v.isStub);
    if (exportedVersions.length > 0 && !hasNonStubVersion) {
      throw new BadRequestException('App contents are still syncing from Git. Open the app to finish loading, then try again.');
    }

    // TODO: Verify if this is required as we always pass name on imports
    // Without this appImportExportService.import will throw an error
    resourceExport.app[0].definition.appV2.name = newAppName;

    const importResourcesDto: ImportResourcesDto = {
      organization_id,
      tooljet_version: globalThis.TOOLJET_VERSION,
      ...(branchId && { branchId }),
      app: [
        {
          appName: newAppName,
          definition: resourceExport.app[0].definition,
        },
      ],
      tooljet_database: resourceExport.tooljet_database,
    };

    const createdApp = await this.import(user, importResourcesDto, true);
    //APP_CLONE audit
    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
      userId: user.id,
      organizationId: user.organizationId,
      resourceId: createdApp.app[0]?.id,
      resourceName: createdApp.app[0]?.name,
    });
    return createdApp;
  }

  /**
   * Branch policy for file imports/exports:
   *
   *   - **Git-disabled workspace** (no `workspace_branches.is_default=true` row): no
   *     branch required, no branch allowed. Pass `branchId=undefined`.
   *   - **Git-enabled workspace, feature branch supplied**: allowed. Caller continues
   *     with the sub-branch import/export path.
   *   - **Git-enabled workspace, no branch supplied**: 400 — must specify a
   *     feature branch via `x-branch-id`.
   *   - **Git-enabled workspace, default branch supplied**: 400 — default branch
   *     is the editor working state, not a publishable artifact. Switch to a
   *     feature branch.
   */
  private async validateBranchForImportExport(
    organizationId: string,
    branchId: string | undefined,
    operation: 'import' | 'export'
  ): Promise<void> {
    if (!organizationId) return;

    const defaultBranch = await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOne(WorkspaceBranch, {
        where: { organizationId, isDefault: true },
        select: ['id'],
      });
    });

    const isGitEnabled = !!defaultBranch;

    if (!isGitEnabled) {
      // Git-disabled — branch context is meaningless. If the caller sent one, ignore
      // silently (don't reject; the clone DTO carries branchId for symmetry).
      return;
    }

    if (!branchId) {
      throw new BadRequestException(
        `${operation === 'import' ? 'Import' : 'Export'} requires a feature branch in git-enabled workspaces (missing x-branch-id header).`
      );
    }

    if (branchId === defaultBranch.id) {
      throw new BadRequestException(
        `${operation === 'import' ? 'Imports onto' : 'Exports from'} the default branch are not allowed. Switch to a feature branch and retry.`
      );
    }
  }
}
