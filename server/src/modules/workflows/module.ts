import { DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { UserRepository } from '@modules/users/repositories/repository';
import { User } from '@entities/user.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import { WorkflowExecutionEdge } from '@entities/workflow_execution_edge.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { AppVersion } from '@entities/app_version.entity';
import { AppsRepository } from '@modules/apps/repository';
import { DataQueriesModule } from '@modules/data-queries/module';
import { EncryptionModule } from '@modules/encryption/module';
import { DataSourcesModule } from '@modules/data-sources/module';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { OrganizationConstantModule } from '@modules/organization-constants/module';
import { DataQuery } from '@entities/data_query.entity';
import { DataQueryRepository } from '@modules/data-queries/repository';
import { OrganizationConstantRepository } from '@modules/organization-constants/repository';
import { AppsModule } from '@modules/apps/module';
import { VersionRepository } from '@modules/versions/repository';
import { FoldersModule } from '@modules/folders/module';
import { FolderAppsModule } from '@modules/folder-apps/module';
import { ThemesModule } from '@modules/organization-themes/module';
import { AppsAbilityFactory } from '@modules/casl/abilities/apps-ability.factory';
import { WorkflowSchedule } from '@entities/workflow_schedule.entity';
import { App } from '@entities/app.entity';
import { AiModule } from '@modules/ai/module';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { AppPermissionsModule } from '@modules/app-permissions/module';
import { RolesRepository } from '@modules/roles/repository';
import { AppGitRepository } from '@modules/app-git/repository';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { SubModule } from '@modules/app/sub-module';
export class WorkflowsModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const {
      WorkflowExecutionsService,
      WorkflowExecutionsController,
      WorkflowSchedulesController,
      WorkflowWebhooksController,
      WorkflowWebhooksService,
      WorkflowsController,
      WorkflowSchedulesService,
      TemporalService,
      WorkflowWebhooksListener,
      WorkflowTriggersListener,
      FeatureAbilityFactory,
      WorkflowStreamService,
    } = await this.getProviders(configs, 'workflows', [
      'services/workflow-executions.service',
      'controllers/workflow-executions.controller',
      'controllers/workflow-schedules.controller',
      'controllers/workflow-webhooks.controller',
      'services/workflow-webhooks.service',
      'controllers/workflows.controller',
      'services/workflow-schedules.service',
      'services/temporal.service',
      'listeners/workflow-webhooks.listener',
      'listeners/workflow-triggers.listener',
      'ability/app',
      'services/workflow-stream.service',
    ]);

    // Get apps related providers
    const { AppsService, PageService, EventsService, ComponentsService, PageHelperService } = await this.getProviders(
      configs,
      'apps',
      [
        'service',
        'services/page.service',
        'services/event.service',
        'services/component.service',
        'services/page.util.service',
      ]
    );

    // Get organization constants provider
    const { OrganizationConstantsService } = await this.getProviders(configs, 'organization-constants', ['service']);

    return {
      module: WorkflowsModule,
      imports: [
        TypeOrmModule.forFeature([
          App,
          User,
          DataQuery,
          AppVersion,
          WorkflowSchedule,
          WorkflowExecution,
          WorkflowExecutionEdge,
          WorkflowExecutionNode,
          WorkflowExecutionNode,
          WorkflowExecutionEdge,
        ]),
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
        await AppsModule.register(configs),
        await TooljetDbModule.register(configs),
        await DataQueriesModule.register(configs),
        await EncryptionModule.register(configs),
        await DataSourcesModule.register(configs),
        await AppEnvironmentsModule.register(configs),
        await OrganizationConstantModule.register(configs),
        await FoldersModule.register(configs),
        await FolderAppsModule.register(configs),
        await ThemesModule.register(configs),
        await AiModule.register(configs),
        await AppPermissionsModule.register(configs),
      ],
      providers: [
        AppsAbilityFactory,
        AppsRepository,
        UserRepository,
        DataSourcesRepository,
        DataQueryRepository,
        DataSourcesRepository,
        OrganizationConstantRepository,
        VersionRepository,
        AppGitRepository,
        AppsService,
        PageService,
        EventsService,
        WorkflowExecutionsService,
        WorkflowStreamService,
        WorkflowTriggersListener,
        WorkflowWebhooksListener,
        WorkflowWebhooksService,
        OrganizationConstantsService,
        ComponentsService,
        PageHelperService,
        WorkflowSchedulesService,
        TemporalService,
        FeatureAbilityFactory,
        RolesRepository,
        GroupPermissionsRepository,
      ],
      controllers: [
        WorkflowsController,
        WorkflowExecutionsController,
        WorkflowWebhooksController,
        WorkflowSchedulesController,
      ],
    };
  }
}
