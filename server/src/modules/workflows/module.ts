import { DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
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
import { WorkflowBundle } from '@entities/workflow_bundle.entity';
import { App } from '@entities/app.entity';
import { AiModule } from '@modules/ai/module';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { AppPermissionsModule } from '@modules/app-permissions/module';
import { RolesRepository } from '@modules/roles/repository';
import { AppGitRepository } from '@modules/app-git/repository';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { WorkflowAccessGuard } from './guards/workflow-access.guard';
import { SubModule } from '@modules/app/sub-module';
import { UsersModule } from '@modules/users/module';
import { AppHistoryModule } from '@modules/app-history/module';

const WORKFLOW_SCHEDULE_QUEUE = 'workflow-schedule-queue';
const WORKFLOW_EXECUTION_QUEUE = 'workflow-execution-queue';
import { OrganizationRepository } from '@modules/organizations/repository';
export class WorkflowsModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const {
      WorkflowExecutionsService,
      WorkflowExecutionsController,
      WorkflowSchedulesController,
      WorkflowWebhooksController,
      WorkflowWebhooksService,
      WorkflowsController,
      WorkflowSchedulesService,
      WorkflowSchedulerService,
      WorkflowScheduleProcessor,
      WorkflowExecutionProcessor,
      WorkflowExecutionQueueService,
      WorkflowTerminationRegistry,
      AppsActionsListener,
      FeatureAbilityFactory,
      WorkflowStreamService,
      ScheduleBootstrapService,
      NpmRegistryService,
      BundleGenerationService,
      WorkflowBundlesController,
    } = await this.getProviders(configs, 'workflows', [
      'services/workflow-executions.service',
      'controllers/workflow-executions.controller',
      'controllers/workflow-schedules.controller',
      'controllers/workflow-webhooks.controller',
      'services/workflow-webhooks.service',
      'controllers/workflows.controller',
      'services/workflow-schedules.service',
      'services/workflow-scheduler.service',
      'processors/workflow-schedule.processor',
      'processors/workflow-execution.processor',
      'services/workflow-execution-queue.service',
      'services/workflow-termination-registry',
      'listeners/app-actions.listener',
      'ability/app',
      'services/workflow-stream.service',
      'services/schedule-bootstrap.service',
      'services/npm-registry.service',
      'services/bundle-generation.service',
      'controllers/workflow-bundles.controller',
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
          WorkflowBundle,
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
        // Register BullMQ queues for workflow scheduling and execution
        BullModule.registerQueue({
          name: WORKFLOW_SCHEDULE_QUEUE,
        }),
        BullModule.registerQueue({
          name: WORKFLOW_EXECUTION_QUEUE,
        }),
        // Register queues with Bull Board for dashboard visibility
        BullBoardModule.forFeature({
          name: WORKFLOW_SCHEDULE_QUEUE,
          adapter: BullMQAdapter,
        }),
        BullBoardModule.forFeature({
          name: WORKFLOW_EXECUTION_QUEUE,
          adapter: BullMQAdapter,
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
        await UsersModule.register(configs),
        await AppHistoryModule.register(configs),
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
        OrganizationRepository,
        AppsService,
        PageService,
        EventsService,
        WorkflowExecutionsService,
        WorkflowWebhooksService,
        OrganizationConstantsService,
        ComponentsService,
        PageHelperService,
        WorkflowSchedulesService,
        WorkflowSchedulerService,
        WorkflowExecutionQueueService,
        WorkflowTerminationRegistry,
        FeatureAbilityFactory,
        NpmRegistryService,
        BundleGenerationService,
        WorkflowAccessGuard,
        RolesRepository,
        GroupPermissionsRepository,
        ...(isMainImport ? [
          WorkflowStreamService,
          AppsActionsListener,
          // Only register BullMQ processors and schedule bootstrap when WORKER=true
          // This allows running dedicated HTTP-only instances and worker instances
          ...(process.env.WORKER === 'true' ? [
            WorkflowScheduleProcessor,
            WorkflowExecutionProcessor,
            ScheduleBootstrapService,
          ] : []),
        ] : []),
      ],
      controllers: [
        WorkflowsController,
        WorkflowExecutionsController,
        WorkflowWebhooksController,
        WorkflowSchedulesController,
        WorkflowBundlesController,
      ],
    };
  }
}
