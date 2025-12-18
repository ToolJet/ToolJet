export interface AgentTool {
  name: string;
  description: string;
  inputs: Array<{
    name: string;
    description: string;
    path: string[]; // Full path for nested parameter reconstruction (e.g., ['user', 'email'])
    isParent?: boolean; // True if this path is a parent of other paths (e.g., ['user'] when ['user', 'email'] exists)
    isArray?: boolean; // True if this parameter should be a JSON array (e.g., extracted from items[0])
  }>;
  dataSourceQueryId: string;
}
