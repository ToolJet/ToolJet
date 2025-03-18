import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from '../casl/casl.module';

import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { Credential } from 'src/entities/credential.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { File } from 'src/entities/file.entity';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';
import { Organization } from 'src/entities/organization.entity';
import { Plugin } from 'src/entities/plugin.entity';
import { User } from 'src/entities/user.entity';
import { WorkflowExecution } from 'src/entities/workflow_execution.entity';
import { WorkflowExecutionEdge } from 'src/entities/workflow_execution_edge.entity';
import { WorkflowExecutionNode } from 'src/entities/workflow_execution_node.entity';

import { AppEnvironmentService } from '@ee/app-environments/service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CredentialsService } from '@services/credentials.service';
import { DataQueriesService } from '@modules/data-queries/service';
import { DataSourcesService } from '@services/data_sources.service';
import { FilesService } from '@services/files.service';
import { PluginsHelper } from 'src/helpers/plugins.helper';
import { ThrottlerModule } from '@nestjs/throttler';
import { WorkflowExecutionsController } from '@controllers/workflow_executions_controller';
import { WorkflowExecutionsService } from '@services/workflow_executions.service';
import { WorkflowWebhooksController } from '@controllers/workflow_webhooks.controller';
import { WorkflowWebhooksListener } from '../../listeners/workflow_webhooks.listener';
import { WorkflowWebhooksService } from '@services/workflow_webhooks.service';
import { TooljetDbOperationsService } from '@services/tooljet_db_operations.service';
import { TooljetDbService } from '@services/tooljet_db.service';
import { PostgrestProxyService } from '@services/postgrest_proxy.service';
import { OrganizationConstantsService } from '@modules/organization-constants/service';
import { OrganizationConstant } from 'src/entities/organization_constants.entity';
import { UserResourcePermissionsModule } from '@modules/user_resource_permissions/user_resource_permissions.module';
import { UsersModule } from '@modules/users/users.module';
import { EncryptionModule } from '@modules/encryption/module';

@Module({
  imports: [
    UserResourcePermissionsModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('WEBHOOK_THROTTLE_TTL') || 60000,
          limit: config.get('WEBHOOK_THROTTLE_LIMIT') || 100,
        },
      ],
    }),
    TypeOrmModule.forFeature([
      App,
      AppVersion,
      Credential,
      DataQuery,
      DataSource,
      File,
      OrgEnvironmentVariable,
      Organization,
      Plugin,
      User,
      WorkflowExecution,
      WorkflowExecutionEdge,
      WorkflowExecutionNode,
      OrganizationConstant,
    ]),
    CaslModule,
    UsersModule,
    EncryptionModule,
  ],
  providers: [
    AppEnvironmentService,
    CredentialsService,
    DataQueriesService,
    DataSourcesService,
    FilesService,
    PluginsHelper,
    WorkflowExecutionsService,
    WorkflowWebhooksListener,
    WorkflowWebhooksService,
    TooljetDbOperationsService,
    TooljetDbService,
    PostgrestProxyService,
    OrganizationConstantsService,
  ],
  controllers: [WorkflowExecutionsController, WorkflowWebhooksController],
})
export class WebhooksModule {}
