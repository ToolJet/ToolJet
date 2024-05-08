import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { App } from '../../entities/app.entity';
import { File } from '../../entities/file.entity';
import { AppsController } from '../../controllers/apps.controller';
import { AppsControllerV2 } from '../../controllers/apps.controller.v2';
import { AppsService } from '../../services/apps.service';
import { AppVersion } from '../../../src/entities/app_version.entity';
import { DataQuery } from '../../../src/entities/data_query.entity';
import { CaslModule } from '../casl/casl.module';
import { AppUser } from 'src/entities/app_user.entity';
import { AppUsersService } from '@services/app_users.service';
import { AppUsersController } from '@controllers/app_users.controller';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { UsersService } from '@services/users.service';
import { User } from 'src/entities/user.entity';
import { Organization } from 'src/entities/organization.entity';
import { FilesService } from '@services/files.service';
import { FoldersService } from '@services/folders.service';
import { Folder } from 'src/entities/folder.entity';
import { FolderApp } from 'src/entities/folder_app.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { AppImportExportService } from '@services/app_import_export.service';
import { DataSourcesService } from '@services/data_sources.service';
import { CredentialsService } from '@services/credentials.service';
import { EncryptionService } from '@services/encryption.service';
import { Credential } from 'src/entities/credential.entity';
import { AuditLog } from 'src/entities/audit_log.entity';
import { AuditLoggerService } from '@services/audit_logger.service';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { AppsImportExportController } from '@controllers/app_import_export.controller';
import { PluginsService } from '@services/plugins.service';
import { Plugin } from 'src/entities/plugin.entity';
import { PluginsHelper } from 'src/helpers/plugins.helper';
import { AppEnvironmentService } from '@services/app_environments.service';
import { WorkflowExecution } from 'src/entities/workflow_execution.entity';
import { WorkflowExecutionNode } from 'src/entities/workflow_execution_node.entity';
import { WorkflowExecutionsService } from '@services/workflow_executions.service';
import { WorkflowExecutionEdge } from 'src/entities/workflow_execution_edge.entity';
import { BullModule } from '@nestjs/bull';
import { DataQueriesService } from '@services/data_queries.service';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';
import { GitSyncService } from '@services/git_sync.service';
import { AppGitSync } from 'src/entities/app_git_sync.entity';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';

import { Component } from 'src/entities/component.entity';
import { Page } from 'src/entities/page.entity';
import { EventHandler } from 'src/entities/event_handler.entity';
import { Layout } from 'src/entities/layout.entity';

import { ComponentsService } from '@services/components.service';
import { PageService } from '@services/page.service';
import { EventsService } from '@services/events_handler.service';
import { WorkflowExecutionsController } from '@controllers/workflow_executions_controller';
import { ImportExportResourcesService } from '@services/import_export_resources.service';
import { TooljetDbImportExportService } from '@services/tooljet_db_import_export_service';
import { TooljetDbService } from '@services/tooljet_db.service';
import { TooljetDbOperationsService } from '@services/tooljet_db_operations.service';
import { PostgrestProxyService } from '@services/postgrest_proxy.service';
import { TooljetDbModule } from '../tooljet_db/tooljet_db.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      App,
      AppVersion,
      AppUser,
      DataQuery,
      Folder,
      FolderApp,
      OrganizationUser,
      User,
      Organization,
      DataSource,
      GroupPermission,
      AppGroupPermission,
      UserGroupPermission,
      Credential,
      AuditLog,
      File,
      AppEnvironment,
      Plugin,
      WorkflowExecution,
      WorkflowExecutionNode,
      WorkflowExecutionEdge,
      OrgEnvironmentVariable,
      AppGitSync,
      OrganizationGitSync,
      Component,
      Page,
      EventHandler,
      Layout,
    ]),
    TooljetDbModule,
    CaslModule,
    BullModule.registerQueue({
      name: 'workflows',
    }),
  ],
  providers: [
    AppsService,
    AppUsersService,
    UsersService,
    FoldersService,
    AppImportExportService,
    DataSourcesService,
    CredentialsService,
    EncryptionService,
    AuditLoggerService,
    FilesService,
    PluginsService,
    PluginsHelper,
    AppEnvironmentService,
    WorkflowExecutionsService,
    DataQueriesService,
    ComponentsService,
    GitSyncService,
    PageService,
    EventsService,
    TooljetDbService,
    ImportExportResourcesService,
    TooljetDbImportExportService,
    TooljetDbOperationsService,
    PostgrestProxyService,
  ],
  controllers: [
    AppsController,
    AppsControllerV2,
    AppUsersController,
    AppsImportExportController,
    WorkflowExecutionsController,
  ],
})
export class AppsModule {}
