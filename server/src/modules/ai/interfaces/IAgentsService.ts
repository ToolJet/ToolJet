export interface IAgentsService {
  CreateTable(organizationId: string, tables: any): Promise<any>;

  docs(prompt: string, organizationId: string): Promise<any>;

  create_header_component(appTitle: string): Promise<any>;

  classify(prompt: string, organizationId: string): Promise<any>;

  copilot(prompt: string, context: string, language: string, organizationId: string): Promise<any>;
}
