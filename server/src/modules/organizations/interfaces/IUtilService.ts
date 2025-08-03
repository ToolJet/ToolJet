export interface IOrganizationUtilService {
  validateWorkspaceExists(workspaceId: string): Promise<void>;
}
