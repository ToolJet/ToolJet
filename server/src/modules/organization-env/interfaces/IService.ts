export interface IOrganizationEnvRegistryService {
  initialize(): Promise<void>;
  has(organizationId: string, key: string): boolean;
  hasAll(organizationId: string, keys: readonly string[]): boolean;
  get(organizationId: string, key: string): Promise<string | undefined>;
  ensureResolved(organizationId: string): Promise<void>;
  getResolvedOrganizationIds(): string[];
}
