import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { IExternalApisAiController } from '../Interfaces/IController';
import { CreateAiConversationDto, SendAiMessageDto } from '../dto';

@Controller('ext')
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
export class ExternalApisAiController implements IExternalApisAiController {
  createConversation(dto: CreateAiConversationDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  sendMessage(dto: SendAiMessageDto, response: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getConversation(email: string, conversationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  listConversations(email: string, appId: string, conversationType?: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getTaggableDatasources(email: string, appId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getCreditsBalance(email: string, appId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getThreadTokenUsage(email: string, conversationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
