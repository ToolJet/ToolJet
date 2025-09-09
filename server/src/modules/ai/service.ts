import { Injectable } from '@nestjs/common';
import { InstrumentService } from '../../otel/service-instrumentation';
import { IAiService } from './interfaces/IService';

@Injectable()
export class AiService implements IAiService {
  constructor() {}

  async fetchZeroStateConfig(firstName): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async voteAiMessage(messageId, voteType, userId): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async approvePrd(conversationId, prd, organizationId, response) {
    throw new Error('Method not implemented.');
  }

  @InstrumentService('AiService', { 
    attributes: { 'operation.type': 'message', 'ai.type': 'user_message' },
    tags: { 'business_operation': 'ai_user_message' }
  })
  async sendUserMessage(body, response, organizationId) {
    throw new Error('Method not implemented.');
  }

  async sendUserDocsMessage(body, response, organizationId) {
    throw new Error('Method not implemented.');
  }

  async regenerateAiMessage(parentMessageId, organizationId): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getCreditsBalance(organizationId) {
    throw new Error('Method not implemented.');
  }
}
