import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { AiConversationRepository } from './repositories/ai-conversation.repository';
import { AiConversationMessageRepository } from './repositories/ai-conversation-message.repository';
import { AiResponseVoteRepository } from './repositories/ai-response-vote.repository';
import { FeatureAbilityFactory } from './ability';
import { TooljetDbModule } from '@modules/tooljet-db/module';

export class AiModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { AiController } = await import(`${importPath}/ai/controller`);
    const { AiService } = await import(`${importPath}/ai/service`);
    const { AiUtilService } = await import(`${importPath}/ai/util.service`);
    const { AgentsService } = await import(`${importPath}/ai/services/agents.service`);
    const { ComponentsService } = await import(`${importPath}/apps/services/component.service`);
    const { EventsService } = await import(`${importPath}/apps/services/event.service`);

    return {
      module: AiModule,
      imports: [await TooljetDbModule.register(configs)],
      controllers: [AiController],
      providers: [
        AiService,
        AiUtilService,
        AgentsService,
        ComponentsService,
        AiConversationRepository,
        AiConversationMessageRepository,
        AiResponseVoteRepository,
        FeatureAbilityFactory,
        EventsService,
      ],
      exports: [AiUtilService],
    };
  }
}
