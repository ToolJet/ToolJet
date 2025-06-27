import { DynamicModule, forwardRef } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { AiConversationRepository } from './repositories/ai-conversation.repository';
import { AiConversationMessageRepository } from './repositories/ai-conversation-message.repository';
import { AiResponseVoteRepository } from './repositories/ai-response-vote.repository';
import { AppsRepository } from '@modules/apps/repository';
import { FeatureAbilityFactory } from './ability';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { DataQueriesModule } from '@modules/data-queries/module';
import { LicenseModule } from '@modules/licensing/module';
import { AppPermissionsModule } from '@modules/app-permissions/module';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';

export class AiModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { AiController } = await import(`${importPath}/ai/controller`);
    const { AiService } = await import(`${importPath}/ai/service`);
    const { AiUtilService } = await import(`${importPath}/ai/util.service`);
    const { AgentsService } = await import(`${importPath}/ai/services/agents.service`);
    const { ComponentsService } = await import(`${importPath}/apps/services/component.service`);
    const { ImportExportResourcesService } = await import(`${importPath}/apps/services/app-import-export.service`);
    const { GraphService } = await import(`${importPath}/ai/services/graph.service`);
    const { EventsService } = await import(`${importPath}/apps/services/event.service`);
    const { DataQueriesService } = await import(`${importPath}/data-queries/service`);
    const { DataQueriesUtilService } = await import(`${importPath}/data-queries/util.service`);

    return {
      module: AiModule,
      imports: [
        await TooljetDbModule.register(configs),
        await DataQueriesModule.register(configs),
        await LicenseModule.forRoot(configs),
        await AppPermissionsModule.register(configs),
        await ImportExportResourcesModule.register(configs),
      ],
      controllers: [AiController],
      providers: [
        AiService,
        AiUtilService,
        GraphService,
        AgentsService,
        ComponentsService,
        // ImportExportResourcesService,
        AiConversationRepository,
        AiConversationMessageRepository,
        AppsRepository,
        AiResponseVoteRepository,
        FeatureAbilityFactory,
        EventsService,

      ],
      exports: [AiUtilService],
    };
  }
}
