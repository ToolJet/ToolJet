export interface AgentTool {
  name: string;
  description: string;
  inputs: Array<{
    name: string;
    description: string;
  }>;
  dataSourceQueryId: string;
}
