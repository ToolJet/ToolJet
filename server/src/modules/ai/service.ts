import { Injectable } from '@nestjs/common';
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

  async listConversations(appId: string, userId: string, conversationType: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async createConversation(userId: string, appId: string, conversationType: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getConversationById(conversationId: string, userId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
