export interface IAgentsService {
  createComponent(prompt: string, organizationId: string): Promise<any>;

  createQuery(prompt: string, tableName: string, columns: string, organizationId: string): Promise<any>;

  createEvent(prompt: string, pageId: string[], organizationId: string): Promise<any>;

  Agentic(prompt: string, organizationId: string): Promise<any>;

  PromptEnrichment(prd_data: { content: string; metadata?: any }, organizationId: string): Promise<any>;

  PromptEnrichmentChat(prompt: string, oldContext: any[], organizationId: string): Promise<any>;

  CreateTable(organizationId: string, tables: any): Promise<any>;

  docs(prompt: string, organizationId: string): Promise<any>;

  create_header_component(appTitle: string): Promise<any>;

  classify(prompt: string, organizationId: string): Promise<any>;

  copilot(prompt: string, context: string, language: string, organizationId: string): Promise<any>;
}
