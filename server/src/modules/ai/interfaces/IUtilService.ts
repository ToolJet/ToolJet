export interface IAiUtilService {
  getAgentAssetPath(filename: string): any;

  mergeSteps(componentsJson: any, newStepsJson: any): any;

  AgenticMergeSteps(input: any): any;

  AIGateway(provider: string, operation_id: string, prompt_body: any, organizationId: string): Promise<any>;

  createComponentFromSteps(
    steps: any,
    componentDatapath?: string
  ): Promise<{
    type?: string;
    steps: {
      [key: string]: {
        component: {
          definition: {
            properties: {
              text?: {
                value: string;
              };
            };
          };
        };
      };
    };
  }>;

  getComponentsFromsteps(steps: any): Promise<any>;

  createQueryFromSteps(steps: any): Promise<any>;

  getQueriesFromsteps(steps: any): Promise<any>;

  createQuerySteps(prd: string, lld: string, tableName: any, components: any, organizationId: any): Promise<any>;

  createEventSteps(prd: string, Query: any, components: any, organizationId: any): Promise<any>;

  convertToSteps(jsonData: any): Promise<any>;

  getColorScheme(prd: any): any;

  sendSSE(res: any, type: string, data: any): any;

  getConversation(appId: string, userId: string, conversationType: string): Promise<any>;

  createNewConversation(userId: string, appId: string, conversationType: string): Promise<any>;
}
