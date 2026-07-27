export interface IOrganizationEnvRegistryService {
  initialize(): Promise<void>;
  has(organizationId: string, key: string): boolean;
  hasAll(organizationId: string, keys: readonly string[]): boolean;
  get(organizationId: string, key: string): Promise<string | undefined>;
  // All raw key/value pairs for a workspace — used by consumers (e.g. SamlEnvUtilService) that
  // need to scan for provider-name-flexible keys (bare or "PREFIX_{PROVIDERNAME}_FIELD") rather
  // than reading a single known key at a time.
  getAll(organizationId: string): Map<string, string> | undefined;
  ensureResolved(organizationId: string): Promise<void>;
  getResolvedOrganizationIds(): string[];
}
