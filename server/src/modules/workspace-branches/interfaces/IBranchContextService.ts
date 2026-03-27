export interface IBranchContextService {
  /** @deprecated Use branchId from request query params instead. Always returns null. */
  getActiveBranchId(organizationId: string): Promise<string | null>;
  getDefaultBranchId(organizationId: string): Promise<string | null>;
}
