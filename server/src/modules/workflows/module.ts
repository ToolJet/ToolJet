import { DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getImportPath } from '@modules/app/constants';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { UserRepository } from '@modules/users/repository';
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
export class WorkflowsModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { WorkflowExecutionsService } = await import(`${importPath}/workflows/services/workflow-executions.service`);
    const { WorkflowExecutionsController } = await import(
      `${importPath}/workflows/controllers/workflow-executions.controller`
    );
    const { WorkflowSchedulesController } = await import(
      `${importPath}/workflows/controllers/workflow-schedules.controller`
    );
    const { WorkflowWebhooksController } = await import(
      `${importPath}/workflows/controllers/workflow-webhooks.controller`
    );
    const { WorkflowWebhooksService } = await import(`${importPath}/workflows/services/workflow-webhooks.service`);
    const { WorkflowsController } = await import(`${importPath}/workflows/controllers/workflows.controller`);
    const { OrganizationConstantsService } = await import(`${importPath}/organization-constants/service`);
    const { AppsService } = await import(`${importPath}/apps/service`);
    const { PageService } = await import(`${importPath}/apps/services/page.service`);
    const { EventsService } = await import(`${importPath}/apps/services/event.service`);
    const { ComponentsService } = await import(`${importPath}/apps/services/component.service`);
    const { PageHelperService } = await import(`${importPath}/apps/services/page.util.service`);
    const { WorkflowSchedulesService } = await import(`${importPath}/workflows/services/workflow-schedules.service`);
    const { TemporalService } = await import(`${importPath}/workflows/services/temporal.service`);
    const { WorkflowWebhooksListener } = await import(`${importPath}/workflows/listeners/workflow-webhooks.listener`);
    const { FeatureAbilityFactory } = await import(`${importPath}/workflows/ability/app`);

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
      ],
      providers: [
        AppsAbilityFactory,
        AppsRepository,
        UserRepository,
        DataSourcesRepository,
        DataQueryRepository,
        OrganizationConstantRepository,
        VersionRepository,
        AppsService,
        PageService,
        EventsService,
        WorkflowExecutionsService,
        WorkflowWebhooksListener,
        WorkflowWebhooksService,
        OrganizationConstantsService,
        ComponentsService,
        PageHelperService,
        WorkflowSchedulesService,
        TemporalService,
        FeatureAbilityFactory,
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
