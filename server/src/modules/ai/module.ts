import { DynamicModule } from '@nestjs/common';
import { AiConversationRepository } from './repositories/ai-conversation.repository';
import { AiConversationMessageRepository } from './repositories/ai-conversation-message.repository';
import { AiResponseVoteRepository } from './repositories/ai-response-vote.repository';
import { FeatureAbilityFactory } from './ability';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { SubModule } from '@modules/app/sub-module';

export class AiModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { AiController, AiService, AiUtilService, AgentsService } = await this.getProviders(configs, 'ai', [
      'controller',
      'service',
      'util.service',
      'services/agents.service',
    ]);

    const { ComponentsService, EventsService } = await this.getProviders(configs, 'apps', [
      'services/component.service',
      'services/event.service',
    ]);

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
