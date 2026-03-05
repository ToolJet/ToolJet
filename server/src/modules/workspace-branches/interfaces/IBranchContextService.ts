export interface IBranchContextService {
  getActiveBranchId(organizationId: string): Promise<string | null>;
  getDefaultBranchId(organizationId: string): Promise<string | null>;
}
