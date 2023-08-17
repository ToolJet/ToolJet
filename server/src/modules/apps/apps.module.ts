import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { App } from '../../entities/app.entity';
import { File } from '../../entities/file.entity';
import { AppsController } from '../../controllers/apps.controller';
import { AppsService } from '../../services/apps.service';
import { WorkflowExecutionsController } from '../../controllers/workflow_executions_controller';
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
    ]),
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
  ],
  controllers: [AppsController, AppUsersController, AppsImportExportController, WorkflowExecutionsController],
})
export class AppsModule {}
