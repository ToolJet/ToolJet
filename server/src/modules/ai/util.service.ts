import { IAiUtilService } from './interfaces/IUtilService';

export class AiUtilService implements IAiUtilService {
  constructor() {}
  public getAgentAssetPath(filename) {
    throw new Error('Method not implemented.');
  }

  public mergeSteps(componentsJson, newStepsJson) {
    throw new Error('Method not implemented.');
  }

  public AgenticMergeSteps(input) {
    throw new Error('Method not implemented.');
  }

  async AIGateway(provider: string, operation_id: string, prompt_body, organizationId) {
    throw new Error('Method not implemented.');
  }

  async createComponentfromSteps(steps, componentDatapath?: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getComponentsfromsteps(steps) {
    throw new Error('Method not implemented.');
  }

  async createQueryfromSteps(steps) {
    throw new Error('Method not implemented.');
  }

  async getQueriesfromsteps(steps) {
    throw new Error('Method not implemented.');
  }

  async createQuerySteps(prd: string, lld: string, tableName, components, organizationId) {
    throw new Error('Method not implemented.');
  }

  async createEventSteps(prd: string, Query: any, components: any, organizationId: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async convertToSteps(jsonData: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  public getColorScheme(prd) {
    throw new Error('Method not implemented.');
  }

  public sendSSE(res: any, type: string, data: any) {
    throw new Error('Method not implemented.');
  }

  async getConversation(appId: string, userId: string, conversationType: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async createNewConversation(userId, appId, conversationType): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
