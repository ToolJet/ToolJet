import { Injectable } from '@nestjs/common';
import { IAgentsService } from '../interfaces/IAgentsService';

@Injectable()
export class AgentsService implements IAgentsService {
  constructor() {}

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
