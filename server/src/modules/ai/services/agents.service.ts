import { Injectable } from '@nestjs/common';
import { IAgentsService } from '../interfaces/IAgentsService';

@Injectable()
export class AgentsService implements IAgentsService {
  constructor() {}
  // Agents methods
  async createComponent(prompt: string, organizationId): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async createQuery(prompt: string, tableName: string, columns: string, organizationId): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async createEvent(prompt: string, pageId: string[], organizationId): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async Agentic(prompt: string, organizationId): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async PromptEnrichment(prd_data: { content: string; metadata?: any }, organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async PromptEnrichmentChat(prompt: string, oldContext: any[], organizationId): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async CreateTable(organizationId: string, tables): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async docs(prompt: string, organizationId): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async create_header_component(appTitle: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async classify(prompt: string, organizationId): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async copilot(prompt: string, context: string, language: string, organizationId): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
