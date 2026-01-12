import { DynamicModule } from "@nestjs/common";
import { getImportPath } from "@modules/app/constants";
import { AiConversationRepository } from "./repositories/ai-conversation.repository";
import { AiConversationMessageRepository } from "./repositories/ai-conversation-message.repository";
import { AiResponseVoteRepository } from "./repositories/ai-response-vote.repository";
import { AppsRepository } from "@modules/apps/repository";
import { FeatureAbilityFactory } from "./ability";
import { TooljetDbModule } from "@modules/tooljet-db/module";
import { DataQueriesModule } from "@modules/data-queries/module";
import { AppPermissionsModule } from "@modules/app-permissions/module";
import { ImportExportResourcesModule } from "@modules/import-export-resources/module";
import { ArtifactRepository } from "./repositories/artifact.repository";
import { SubModule } from "@modules/app/sub-module";
import { DataQueryRepository } from "@modules/data-queries/repository";
import { AppHistoryModule } from "@modules/app-history/module";
import { DataSourcesModule } from "@modules/data-sources/module";
import { AppEnvironmentsModule } from "@modules/app-environments/module";
import { VersionRepository } from "@modules/versions/repository";
import { OrganizationRepository } from "@modules/organizations/repository";
import { DataQueriesUtilService as DataQueriesUtilServiceBase } from "@modules/data-queries/util.service";

export class AiModule extends SubModule {
  static async register(
    configs: { IS_GET_CONTEXT: boolean },
    isMainImport: boolean = false
  ): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { AiController } = await import(`${importPath}/ai/controller`);
    const { AiService } = await import(`${importPath}/ai/service`);
    const { NewAiService } = await import(`${importPath}/ai/new.service`);
    const { AiUtilService } = await import(`${importPath}/ai/util.service`);
    const { AgentsService } = await import(
      `${importPath}/ai/services/agents.service`
    );
    const { ComponentsService } = await import(
      `${importPath}/apps/services/component.service`
    );
    const { EventsService } = await import(
      `${importPath}/apps/services/event.service`
    );
    const { PageService } = await import(
      `${importPath}/apps/services/page.service`
    );
    const { PageHelperService } = await import(
      `${importPath}/apps/services/page.util.service`
    );
    const { AppsUtilService } = await import(`${importPath}/apps/util.service`);
    const { AiCacheService } = await import(`${importPath}/ai/ai-cache`);
    const { DataQueriesUtilService } = await import(
      `${importPath}/data-queries/util.service`
    );

    return {
      module: AiModule,
      imports: [
        await TooljetDbModule.register(configs),
        await DataQueriesModule.register(configs),
        await AppPermissionsModule.register(configs),
        await ImportExportResourcesModule.register(configs),
        await AppHistoryModule.register(configs),
        await DataSourcesModule.register(configs),
        await AppEnvironmentsModule.register(configs),
      ],
      controllers: isMainImport ? [AiController] : [],
      providers: [
        AiUtilService,
        AgentsService,
        ComponentsService,
        {
          provide: DataQueriesUtilServiceBase,
          useClass: DataQueriesUtilService,
        },
        // ImportExportResourcesService,
        AiConversationRepository,
        VersionRepository,
        AiConversationMessageRepository,
        AppsRepository,
        AiResponseVoteRepository,
        OrganizationRepository,
        FeatureAbilityFactory,
        ArtifactRepository,
        DataQueryRepository,
        EventsService,
        PageService,
        PageHelperService,
        AppsUtilService,
        AiCacheService,
        ...(isMainImport ? [AiService, NewAiService, AiCacheService] : []),
      ],
      exports: [AiUtilService],
    };
  }
}
